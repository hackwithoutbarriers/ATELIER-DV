(() => {
  "use strict";

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const worksheetRelationship =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet";
  const sharedStringsRelationship =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings";
  const worksheetContentType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml";

  function escapeXml(value) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function decodeXml(value) {
    return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
      if (entity[0] === "#") {
        const code = entity[1].toLowerCase() === "x"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
        return String.fromCodePoint(code);
      }
      return {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
      }[entity.toLowerCase()];
    });
  }

  function readFile(workbook, path) {
    const file = workbook.files[path];
    if (!file?.content) throw new Error(`Workbook template is missing ${path}.`);
    return decoder.decode(file.content);
  }

  function writeFile(workbook, path, value) {
    const content = encoder.encode(value);
    workbook.files[path] = {
      name: path,
      type: 2,
      content,
      size: content.length,
    };
  }

  function deleteFile(workbook, path) {
    delete workbook.files[path];
  }

  function setCell(xml, reference, value) {
    const isNumber = typeof value === "number" && Number.isFinite(value);
    const replacementFor = (cell) => {
      let opening = cell
        ? cell.slice(0, cell.indexOf(">") + 1)
        : `<c r="${reference}">`;
      opening = opening.replace(/\/?>$/, ">").replace(/\s+t="[^"]*"/, "");
      if (isNumber) return `${opening}<v>${value}</v></c>`;
      if (value === null || value === undefined || value === "") {
        return `${opening}</c>`;
      }
      opening = opening.replace(/>$/, ' t="inlineStr">');
      return `${opening}<is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    };
    const cellPattern = /<c\b[^>]*?\/>|<c\b[^>]*>[\s\S]*?<\/c>/g;
    const existing = [...xml.matchAll(cellPattern)].find(
      (cell) => cell[0].match(/\br="([^"]+)"/)?.[1] === reference,
    );
    if (existing) {
      const replacement = replacementFor(existing[0]);
      return (
        xml.slice(0, existing.index) +
        replacement +
        xml.slice(existing.index + existing[0].length)
      );
    }
    const rowNumber = reference.match(/\d+$/)?.[0];
    const row = [...xml.matchAll(/<row\b[^>]*>/g)].find(
      (candidate) => candidate[0].match(/\br="([^"]+)"/)?.[1] === rowNumber,
    );
    if (!row) {
      throw new Error(`Workbook template is missing row ${rowNumber}.`);
    }
    const rowStart = row.index;
    const rowOpenEnd = rowStart + row[0].length;
    const rowEnd = xml.indexOf("</row>", rowOpenEnd);
    if (rowEnd < 0) throw new Error(`Workbook template row ${rowNumber} is incomplete.`);
    const rowXml = xml.slice(rowStart, rowEnd + "</row>".length);
    const targetColumn = columnNumber(reference);
    let insertAt = rowXml.lastIndexOf("</row>");
    for (const cellMatch of rowXml.matchAll(cellPattern)) {
      const currentReference = cellMatch[0].match(/\br="([A-Z]+\d+)"/)?.[1];
      if (currentReference && columnNumber(currentReference) > targetColumn) {
        insertAt = cellMatch.index;
        break;
      }
    }
    const updatedRow =
      rowXml.slice(0, insertAt) +
      replacementFor(null) +
      rowXml.slice(insertAt);
    return xml.slice(0, rowStart) + updatedRow + xml.slice(rowEnd + "</row>".length);
  }

  function columnNumber(reference) {
    const letters = reference.match(/^[A-Z]+/)?.[0] || "";
    return [...letters].reduce(
      (number, letter) => number * 26 + letter.charCodeAt(0) - 64,
      0,
    );
  }

  function setRows(xml, first, last, values) {
    let result = xml;
    for (let row = first; row <= last; row++) {
      const rowValues = values[row - first] || [];
      for (let column = 0; column < rowValues.length; column++) {
        result = setCell(result, `${String.fromCharCode(65 + column)}${row}`, rowValues[column]);
      }
    }
    return result;
  }

  function removeRowsAfter(xml, lastRow) {
    return xml.replace(
      /<row\b(?=[^>]*\br="(\d+)")[^>]*(?:\/>|>[\s\S]*?<\/row>)/g,
      (row) => Number(row.match(/\br="(\d+)"/)?.[1]) > lastRow ? "" : row,
    );
  }

  function setDimension(xml, reference) {
    return xml.replace(
      /<dimension\b[^>]*\bref="[^"]*"[^>]*\/>/,
      `<dimension ref="${reference}"/>`,
    );
  }

  function setMerges(xml, references) {
    const children = references
      .map((reference) => `<mergeCell ref="${reference}"/>`)
      .join("");
    const replacement = `<mergeCells count="${references.length}">${children}</mergeCells>`;
    return xml.replace(/<mergeCells\b[^>]*>[\s\S]*?<\/mergeCells>/, replacement);
  }

  function excelDate(iso) {
    if (!iso) return "";
    const parts = iso.split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return "";
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return (date.getTime() - Date.UTC(1899, 11, 30)) / 86400000;
  }

  function dateParts(iso) {
    if (!iso) return ["", "", ""];
    const [year, month, day] = iso.split("-");
    return [day || "", month || "", year || ""];
  }

  function inlineSharedStrings(xml, strings) {
    return xml.replace(
      /<c\b(?=[^>]*\bt="s")[^>]*(?:\/>|>[\s\S]*?<\/c>)/g,
      (cell) => {
        const index = Number(cell.match(/<v>(\d+)<\/v>/)?.[1]);
        if (!Number.isInteger(index) || index < 0 || index >= strings.length) {
          throw new Error("Workbook template contains an invalid shared-string index.");
        }
        const opening = cell.slice(0, cell.indexOf(">") + 1);
        const text = `<is><t xml:space="preserve">${escapeXml(strings[index])}</t></is>`;
        return `${opening.replace(/\s+t="s"/, ' t="inlineStr"')}${text}</c>`;
      },
    );
  }

  function sharedStringValues(xml) {
    return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((item) =>
      [...item[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
        .map((text) => decodeXml(text[1]))
        .join(""),
    );
  }

  function setApplicantSheet(xml, profile, data) {
    const { text, fieldNames, fieldGuidance, yes, no } = data;
    const person = profile.person || {};
    const birth = dateParts(person.dob);
    const values = {
      8: person.last,
      9: person.first,
      10: person.mid,
      11: person.sex,
      12: birth[0],
      13: birth[1],
      14: birth[2],
      15: person.bc,
      16: person.bco,
      17: person.elig,
      20: person.a1,
      21: person.a2,
      22: person.city,
      23: person.reg,
      24: person.zip,
      25: person.ctry,
      26: person.res,
      27: person.tel,
      28: person.email,
      30: person.edu,
      31: profile.marital,
      32: data.children.length,
      34: person.ppn,
      35: person.ppc,
      36: excelDate(person.ppe),
      37: profile.passportStatus,
      38: "",
      40: person.photo?.name,
      41: person.photo ? `${person.photo.w}x${person.photo.h}` : "",
      42: person.photo?.kb,
      43: excelDate(person.pdate),
      44: profile.photoStatus,
    };
    const fieldRows = [
      [8, "last"],
      [9, "first"],
      [10, "middle"],
      [11, "gender"],
      [12, "birthDate"],
      [13, "birthDate"],
      [14, "birthDate"],
      [15, "birthCity"],
      [16, "birthCountry"],
      [17, "eligibility"],
      [19, "careOf"],
      [20, "address1"],
      [21, "address2"],
      [22, "city"],
      [23, "region"],
      [24, "postal"],
      [25, "country"],
      [26, "residence"],
      [27, "phone"],
      [28, "email"],
      [30, "education"],
      [31, "marital"],
      [32, "children"],
      [34, "passportNumber"],
      [35, "passportCountry"],
      [36, "passportExpiry"],
      [37, "passportStatus"],
      [38, "passportScan"],
      [40, "photoName"],
      [41, "photoDimensions"],
      [42, "photoSize"],
      [43, "photoDate"],
      [44, "photoStatus"],
    ];

    xml = setCell(xml, "A1", profile.title);
    xml = setCell(xml, "A2", text.legend);
    xml = setCell(xml, "A3", text.progress);
    xml = setCell(xml, "C3", profile.progress);
    xml = setCell(xml, "A4", text.verification);
    xml = setCell(xml, "C4", 0);
    for (const [cell, value] of Object.entries(text.headers)) {
      const column = {
        official: "A",
        local: "B",
        value: "C",
        example: "D",
        required: "E",
        guidance: "F",
        verified: "G",
      }[cell];
      xml = setCell(xml, `${column}6`, value);
    }
    for (const [row, key] of fieldRows) {
      const localLabel =
        fieldNames[key] || (key === "birthDate" ? text.dayLabel : "");
      xml = setCell(xml, `B${row}`, localLabel);
      xml = setCell(xml, `C${row}`, values[row]);
      if (row === 37 || row === 44) {
        xml = setCell(
          xml,
          `F${row}`,
          row === 37 ? text.passportGuidance : text.photoGuidance,
        );
      } else if (row === 38 || row === 19) {
        xml = setCell(xml, `F${row}`, text.notCollected);
      } else if (row >= 40 && row <= 43) {
        xml = setCell(xml, `F${row}`, text.photoGuidance);
      } else {
        xml = setCell(xml, `F${row}`, fieldGuidance[key] || text.fieldGuidance);
      }
    }
    for (let row = 7; row <= 62; row++) {
      const requiredCell = `E${row}`;
      const current = xml.match(
        new RegExp(`<c\\b(?=[^>]*\\br="${requiredCell}")[^>]*>[\\s\\S]*?<\\/c>`),
      )?.[0] || "";
      const value = current.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/)?.[1] || "";
      if (value === "Oui") xml = setCell(xml, requiredCell, yes);
      else if (value === "Non") xml = setCell(xml, requiredCell, no);
    }
    xml = setCell(xml, "A7", text.sections.identity);
    xml = setCell(xml, "A18", text.sections.address);
    xml = setCell(xml, "A29", text.sections.education);
    xml = setCell(xml, "A33", text.sections.passport);
    xml = setCell(xml, "A39", text.sections.photo);
    xml = setCell(
      xml,
      "A45",
      profile.spouse ? text.sections.spouse : text.sections.spouseNone,
    );
    xml = setCell(xml, "A54", data.children.length ? text.sections.children : text.noChildren);
    xml = setCell(xml, "B12", text.dayLabel);
    xml = setCell(xml, "B13", text.monthLabel);
    xml = setCell(xml, "B14", text.yearLabel);
    xml = setCell(xml, "B19", text.careOfLabel);
    xml = setCell(xml, "B32", fieldNames.children);
    xml = setCell(xml, "B37", fieldNames.passportStatus);
    xml = setCell(xml, "B38", text.passportScanLabel);
    xml = setCell(xml, "B40", text.photoNameLabel);
    xml = setCell(xml, "B41", text.photoDimensionsLabel);
    xml = setCell(xml, "B42", text.photoSizeLabel);
    xml = setCell(xml, "B43", text.photoDateLabel);
    xml = setCell(xml, "B44", text.photoStatusLabel);

    const spouse = profile.spouse?.person;
    const spouseValues = [
      spouse?.last,
      spouse?.first,
      spouse?.mid,
      spouse?.sex,
      spouse?.dob || "",
      spouse?.bc,
      spouse?.bco,
      spouse?.photo?.name,
    ];
    for (let index = 0; index < spouseValues.length; index++) {
      const row = 46 + index;
      xml = setCell(xml, `C${row}`, index === 4 ? excelDate(spouse?.dob) : spouseValues[index]);
      xml = setCell(
        xml,
        `B${row}`,
        [
          fieldNames.last,
          fieldNames.first,
          fieldNames.middle,
          fieldNames.gender,
          fieldNames.birthDate,
          fieldNames.birthCity,
          fieldNames.birthCountry,
          fieldNames.photoName,
        ][index],
      );
    }
    const child = data.children[0]?.person;
    const childValues = [
      child?.last,
      child?.first,
      child?.mid,
      child?.sex,
      child?.dob ? excelDate(child.dob) : "",
      child?.bc,
      child?.bco,
      child?.photo?.name,
    ];
    for (let index = 0; index < childValues.length; index++) {
      xml = setCell(xml, `C${55 + index}`, childValues[index]);
    }
    xml = setCell(xml, "A54", data.children.length ? text.sections.children : text.noChildren);
    xml = setCell(xml, "B55", fieldNames.last);
    xml = setCell(xml, "B56", fieldNames.first);
    xml = setCell(xml, "B57", fieldNames.middle);
    xml = setCell(xml, "B58", fieldNames.gender);
    xml = setCell(xml, "B59", fieldNames.birthDate);
    xml = setCell(xml, "B60", fieldNames.birthCity);
    xml = setCell(xml, "B61", fieldNames.birthCountry);
    xml = setCell(xml, "B62", fieldNames.photoName);
    for (let row = 46; row <= 53; row++) {
      if (!spouse) {
        xml = setCell(xml, `C${row}`, "");
        xml = setCell(
          xml,
          `B${row}`,
          [
            fieldNames.last,
            fieldNames.first,
            fieldNames.middle,
            fieldNames.gender,
            fieldNames.birthDate,
            fieldNames.birthCity,
            fieldNames.birthCountry,
            fieldNames.photoName,
          ][row - 46],
        );
      }
    }
    if (!data.children.length) {
      for (let row = 55; row <= 62; row++) xml = setCell(xml, `C${row}`, "");
    }
    xml = xml.replace(/<dataValidations\b[^>]*>[\s\S]*?<\/dataValidations>/, "");
    xml = xml.replace(/<conditionalFormatting\b[^>]*>[\s\S]*?<\/conditionalFormatting>/g, "");
    if (/\<f\b/.test(xml)) throw new Error("Applicant worksheet still contains a template formula.");
    return xml;
  }

  function setChildSheet(xml, child, data) {
    const { text, fieldNames, fieldGuidance } = data;
    const person = child.person || {};
    const birth = dateParts(person.dob);
    const values = {
      8: person.last,
      9: person.first,
      10: person.mid,
      11: person.sex,
      12: birth[0],
      13: birth[1],
      14: birth[2],
      15: person.bc,
      16: person.bco,
      17: person.rel,
      19: "Unmarried",
      20: excelDate(data.entryDate),
      21: child.ageStatus,
      23: person.ppn,
      24: person.ppc,
      25: excelDate(person.ppe),
      26: child.passportStatus,
      28: person.photo?.name,
      29: person.photo ? `${person.photo.w}x${person.photo.h}` : "",
      30: person.photo?.kb,
      31: excelDate(person.pdate),
      32: child.photoStatus,
    };
    const fieldRows = [
      [8, "last"],
      [9, "first"],
      [10, "middle"],
      [11, "gender"],
      [12, "birthDate"],
      [13, "birthDate"],
      [14, "birthDate"],
      [15, "birthCity"],
      [16, "birthCountry"],
      [17, "relationship"],
      [19, "childMarital"],
      [20, "entryDate"],
      [21, "ageStatus"],
      [23, "passportNumber"],
      [24, "passportCountry"],
      [25, "passportExpiry"],
      [26, "passportStatus"],
      [28, "photoName"],
      [29, "photoDimensions"],
      [30, "photoSize"],
      [31, "photoDate"],
      [32, "photoStatus"],
    ];

    xml = setCell(xml, "A1", child.title);
    xml = setCell(xml, "A2", text.legend);
    xml = setCell(xml, "A3", text.progress);
    xml = setCell(xml, "C3", child.progress);
    xml = setCell(xml, "A4", text.verification);
    xml = setCell(xml, "C4", 0);
    for (const [cell, value] of Object.entries(text.headers)) {
      const column = {
        official: "A",
        local: "B",
        value: "C",
        example: "D",
        required: "E",
        guidance: "F",
        verified: "G",
      }[cell];
      xml = setCell(xml, `${column}6`, value);
    }
    for (const [row, key] of fieldRows) {
      xml = setCell(xml, `B${row}`, fieldNames[key] || text.fieldGuidance);
      xml = setCell(xml, `C${row}`, values[row]);
      if (row === 21 || row === 26 || row === 32) {
        xml = setCell(
          xml,
          `F${row}`,
          row === 21
            ? text.ageGuidance
            : row === 26
              ? text.passportGuidance
              : text.photoGuidance,
        );
      } else if (row === 23 || row === 24 || row === 25) {
        xml = setCell(xml, `F${row}`, text.notCollected);
      } else if (row >= 28 && row <= 31) {
        xml = setCell(xml, `F${row}`, text.photoGuidance);
      } else {
        xml = setCell(xml, `F${row}`, fieldGuidance[key] || text.fieldGuidance);
      }
    }
    xml = setCell(xml, "A7", text.sections.identity);
    xml = setCell(xml, "A18", text.childStatusSection);
    xml = setCell(xml, "A22", text.childPassportSection);
    xml = setCell(xml, "A27", text.childPhotoSection);
    xml = setCell(xml, "B12", text.dayLabel);
    xml = setCell(xml, "B13", text.monthLabel);
    xml = setCell(xml, "B14", text.yearLabel);
    xml = setCell(xml, "B19", text.childMaritalLabel);
    xml = setCell(xml, "B20", text.entryDateLabel);
    xml = setCell(xml, "B21", text.ageStatusLabel);
    xml = setCell(xml, "B26", text.passportStatusLabel);
    xml = setCell(xml, "B32", text.photoStatusLabel);

    for (let row = 7; row <= 32; row++) {
      const cell = `E${row}`;
      const current = xml.match(
        new RegExp(`<c\\b(?=[^>]*\\br="${cell}")[^>]*>[\\s\\S]*?<\\/c>`),
      )?.[0] || "";
      const value = current.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/)?.[1] || "";
      if (value === "Oui") xml = setCell(xml, cell, data.yes);
      else if (value === "Non") xml = setCell(xml, cell, data.no);
    }
    xml = xml.replace(/<dataValidations\b[^>]*>[\s\S]*?<\/dataValidations>/, "");
    xml = xml.replace(/<conditionalFormatting\b[^>]*>[\s\S]*?<\/conditionalFormatting>/g, "");
    if (/\<f\b/.test(xml)) throw new Error("Child worksheet still contains a template formula.");
    return xml;
  }

  function setChecklistSheet(xml, data) {
    const { text } = data;
    xml = setCell(xml, "A1", text.checklistTitle);
    xml = setCell(xml, "A2", text.checklistNote);
    xml = setCell(xml, "C4", text.referenceLabel);
    xml = setCell(xml, "D4", excelDate(data.referenceDate));
    xml = setCell(xml, "E4", text.referenceNote);
    xml = setCell(xml, "C6", text.progress);
    xml = setCell(xml, "D6", data.entries[0]?.progress || 0);
    xml = setCell(xml, "C7", text.secondProgress);
    xml = setCell(xml, "D7", data.entries[1]?.progress || 0);
    xml = setCell(xml, "C8", text.childrenProgress);
    xml = setCell(
      xml,
      "D8",
      data.children.length
        ? data.children.reduce((sum, child) => sum + child.progress, 0) /
            data.children.length
        : 0,
    );
    xml = setCell(xml, "C9", text.checklistProgress);
    const done = data.checklist.filter((item) => item.done).length;
    xml = setCell(xml, "D9", data.checklist.length ? done / data.checklist.length : 0);

    for (const [cell, value] of Object.entries(text.checklistHeaders)) {
      const column = {
        number: "A",
        phase: "B",
        item: "C",
        applies: "D",
        guidance: "E",
        status: "F",
        evidence: "G",
        notes: "H",
      }[cell];
      xml = setCell(xml, `${column}11`, value);
    }
    xml = setCell(xml, "A12", text.checklistSection);

    const values = data.checklist.map((item, index) => [
      index + 1,
      text.preparation,
      item.label,
      text.allEntries,
      text.checklistGuidance,
      item.done ? data.done : data.todo,
      "",
      "",
    ]);
    xml = setRows(xml, 13, 23, values);
    const lastRow = 12 + data.checklist.length;
    xml = removeRowsAfter(xml, lastRow);
    xml = setDimension(xml, `A1:H${lastRow}`);
    xml = setMerges(xml, ["A12:H12"]);
    xml = xml.replace(/<dataValidations\b[^>]*>[\s\S]*?<\/dataValidations>/, "");
    xml = xml.replace(/<conditionalFormatting\b[^>]*>[\s\S]*?<\/conditionalFormatting>/g, "");
    if (/\<f\b/.test(xml)) throw new Error("Checklist worksheet still contains a template formula.");
    return xml;
  }

  function setTrackingSheet(xml, data) {
    const { text } = data;
    xml = setCell(xml, "A1", text.trackingTitle);
    xml = setCell(xml, "A2", text.trackingNote);
    xml = setCell(xml, "A5", text.trackingSection);
    for (const [cell, value] of Object.entries(text.trackingHeaders)) {
      const column = {
        entry: "A",
        confirmation: "B",
        date: "C",
        result: "D",
        fee: "E",
      }[cell];
      xml = setCell(xml, `${column}4`, value);
    }

    const values = data.tracking.map((entry) => [
      entry.label,
      entry.confirmation,
      entry.date,
      entry.result,
      entry.fee,
    ]);
    xml = setRows(xml, 6, 7, values);
    if (values.length < 2) xml = removeRowsAfter(xml, 6);
    else xml = removeRowsAfter(xml, 7);
    xml = setDimension(xml, values.length < 2 ? "A1:E6" : "A1:E7");
    xml = setMerges(xml, ["A1:E1", "A2:E2", "A5:E5"]);
    xml = xml.replace(/<dataValidations\b[^>]*>[\s\S]*?<\/dataValidations>/, "");
    xml = xml.replace(/<conditionalFormatting\b[^>]*>[\s\S]*?<\/conditionalFormatting>/g, "");
    if (/\<f\b/.test(xml)) throw new Error("Tracking worksheet still contains a template formula.");
    return xml;
  }

  function replaceWorksheetLinks(xml, sheets) {
    const relationshipPattern = new RegExp(
      `<Relationship\\b(?=[^>]*\\bType="${worksheetRelationship.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}")[^>]*/>`,
      "g",
    );
    const withoutSheets = xml
      .replace(relationshipPattern, "")
      .replace(
        new RegExp(
          `<Relationship\\b(?=[^>]*\\bType="${sharedStringsRelationship.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}")[^>]*/>`,
          "g",
        ),
        "",
      );
    const relationships = sheets
      .map(
        (sheet, index) =>
          `<Relationship Id="rId${100 + index}" Type="${worksheetRelationship}" Target="worksheets/sheet${sheet.fileNumber}.xml"/>`,
      )
      .join("");
    return withoutSheets.replace("</Relationships>", `${relationships}</Relationships>`);
  }

  function setWorkbookSheets(xml, sheets) {
    const sheetNodes = sheets
      .map(
        (sheet, index) =>
          `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${100 + index}"/>`,
      )
      .join("");
    return xml
      .replace(/<sheets\b[^>]*>[\s\S]*?<\/sheets>/, `<sheets>${sheetNodes}</sheets>`)
      .replace(/<definedNames\b[^>]*>[\s\S]*?<\/definedNames>/, "")
      .replace(/<workbookView\b([^>]*)\/>/, (match, attributes) => {
        const updated = attributes
          .replace(/\s+activeTab="\d+"/, "")
          .replace(/\s+firstSheet="\d+"/, "");
        return `<workbookView${updated} firstSheet="0" activeTab="0"/>`;
      });
  }

  function updateContentTypes(xml, sheets) {
    xml = xml
      .replace(
        /<Override\b(?=[^>]*\bPartName="\/xl\/worksheets\/sheet\d+\.xml")[^>]*\/>/g,
        "",
      )
      .replace(
        /<Override\b(?=[^>]*\bPartName="\/xl\/sharedStrings\.xml")[^>]*\/>/g,
        "",
      )
      .replace(
        /<Override\b(?=[^>]*\bPartName="\/docProps\/custom\.xml")[^>]*\/>/g,
        "",
      );
    const overrides = sheets
      .map(
        (sheet) =>
          `<Override PartName="/xl/worksheets/sheet${sheet.fileNumber}.xml" ContentType="${worksheetContentType}"/>`,
      )
      .join("");
    return xml.replace("</Types>", `${overrides}</Types>`);
  }

  function updateRootRelationships(xml) {
    return xml.replace(
      /<Relationship\b(?=[^>]*\bTarget="docProps\/custom\.xml")[^>]*\/>/g,
      "",
    );
  }

  function updateAppProperties(xml, sheetNames) {
    const properties = sheetNames
      .map((name) => `<vt:lpstr>${escapeXml(name)}</vt:lpstr>`)
      .join("");
    xml = xml.replace(
      /<TitlesOfParts\b[^>]*>[\s\S]*?<\/TitlesOfParts>/,
      `<TitlesOfParts><vt:vector size="${sheetNames.length}" baseType="lpstr">${properties}</vt:vector></TitlesOfParts>`,
    );
    return xml.replace(/<vt:i4>\d+<\/vt:i4>/, `<vt:i4>${sheetNames.length}</vt:i4>`);
  }

  function updateCoreProperties(xml, title) {
    return xml.replace(
      /<dc:title>[\s\S]*?<\/dc:title>/,
      `<dc:title>${escapeXml(title)}</dc:title>`,
    );
  }

  function sharedStrings(workbook) {
    return sharedStringValues(readFile(workbook, "xl/sharedStrings.xml"));
  }

  function crc32Table() {
    return Array.from({ length: 256 }, (_, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit++) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      return value >>> 0;
    });
  }

  const crcTable = crc32Table();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function writeZip(files) {
    const localRecords = [];
    const centralRecords = [];
    const entries = Object.entries(files).filter(
      ([name, file]) =>
        name &&
        !name.startsWith("\u0001") &&
        file?.content instanceof Uint8Array,
    );
    const date = new Date();
    const dosTime =
      (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDate =
      ((Math.max(1980, date.getFullYear()) - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate();
    let offset = 0;

    for (const [name, file] of entries) {
      const path = encoder.encode(name);
      const content = file.content;
      const checksum = crc32(content);
      const local = new Uint8Array(30 + path.length);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, dosTime, true);
      localView.setUint16(12, dosDate, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, content.length, true);
      localView.setUint32(22, content.length, true);
      localView.setUint16(26, path.length, true);
      localView.setUint16(28, 0, true);
      local.set(path, 30);
      localRecords.push(local, content);

      const central = new Uint8Array(46 + path.length);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, dosTime, true);
      centralView.setUint16(14, dosDate, true);
      centralView.setUint32(16, checksum, true);
      centralView.setUint32(20, content.length, true);
      centralView.setUint32(24, content.length, true);
      centralView.setUint16(28, path.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      central.set(path, 46);
      centralRecords.push(central);
      offset += local.length + content.length;
    }

    const centralSize = centralRecords.reduce((sum, record) => sum + record.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    const output = new Uint8Array(offset + centralSize + end.length);
    let position = 0;
    for (const record of localRecords) {
      output.set(record, position);
      position += record.length;
    }
    for (const record of centralRecords) {
      output.set(record, position);
      position += record.length;
    }
    output.set(end, position);
    return output;
  }

  async function build(data) {
    if (!window.XLSX) throw new Error("The XLSX library is not available.");
    const response = await fetch(data.templateUrl);
    if (!response.ok) throw new Error(`Workbook template request failed (${response.status}).`);
    const workbook = window.XLSX.read(await response.arrayBuffer(), {
      type: "array",
      bookFiles: true,
      cellStyles: true,
    });
    const strings = sharedStrings(workbook);
    const files = workbook.files;
    const originalChild = inlineSharedStrings(
      readFile(workbook, "xl/worksheets/sheet3.xml"),
      strings,
    );
    const sheets = [];

    const first = { fileNumber: 1, name: data.text.entrySheetName(1) };
    writeFile(workbook, "xl/worksheets/sheet1.xml", setApplicantSheet(
      inlineSharedStrings(readFile(workbook, "xl/worksheets/sheet1.xml"), strings),
      data.entries[0],
      data,
    ));
    sheets.push(first);

    if (data.entries[1]) {
      writeFile(workbook, "xl/worksheets/sheet2.xml", setApplicantSheet(
        inlineSharedStrings(readFile(workbook, "xl/worksheets/sheet2.xml"), strings),
        data.entries[1],
        data,
      ));
      sheets.push({ fileNumber: 2, name: data.text.entrySheetName(2) });
    } else {
      deleteFile(workbook, "xl/worksheets/sheet2.xml");
    }

    for (const [index, child] of data.children.entries()) {
      const fileNumber = index === 0 ? 3 : index + 6;
      const childXml = setChildSheet(
        originalChild,
        child,
        data,
      );
      writeFile(workbook, `xl/worksheets/sheet${fileNumber}.xml`, childXml);
      sheets.push({
        fileNumber,
        name: data.text.childSheetName(index + 1),
      });
    }
    if (!data.children.length) deleteFile(workbook, "xl/worksheets/sheet3.xml");

    writeFile(workbook, "xl/worksheets/sheet4.xml", setChecklistSheet(
      inlineSharedStrings(readFile(workbook, "xl/worksheets/sheet4.xml"), strings),
      data,
    ));
    writeFile(workbook, "xl/worksheets/sheet5.xml", setTrackingSheet(
      inlineSharedStrings(readFile(workbook, "xl/worksheets/sheet5.xml"), strings),
      data,
    ));
    sheets.push(
      { fileNumber: 4, name: data.text.checklistSheetName },
      { fileNumber: 5, name: data.text.trackingSheetName },
    );

    const usedFiles = new Set(sheets.map((sheet) => `xl/worksheets/sheet${sheet.fileNumber}.xml`));
    for (const path of Object.keys(files)) {
      if (/^xl\/worksheets\/sheet\d+\.xml$/.test(path) && !usedFiles.has(path)) {
        deleteFile(workbook, path);
      }
    }
    for (const sheet of sheets) {
      const path = `xl/worksheets/sheet${sheet.fileNumber}.xml`;
      const xml = inlineSharedStrings(readFile(workbook, path), strings);
      if (/\<f\b/.test(xml)) throw new Error(`Unexpected formula remains in ${path}.`);
      writeFile(workbook, path, xml);
    }

    writeFile(
      workbook,
      "xl/workbook.xml",
      setWorkbookSheets(readFile(workbook, "xl/workbook.xml"), sheets),
    );
    writeFile(
      workbook,
      "xl/_rels/workbook.xml.rels",
      replaceWorksheetLinks(readFile(workbook, "xl/_rels/workbook.xml.rels"), sheets),
    );
    writeFile(
      workbook,
      "[Content_Types].xml",
      updateContentTypes(readFile(workbook, "[Content_Types].xml"), sheets),
    );
    writeFile(
      workbook,
      "_rels/.rels",
      updateRootRelationships(readFile(workbook, "_rels/.rels")),
    );
    writeFile(
      workbook,
      "docProps/app.xml",
      updateAppProperties(readFile(workbook, "docProps/app.xml"), sheets.map((sheet) => sheet.name)),
    );
    if (files["docProps/core.xml"]) {
      writeFile(
        workbook,
        "docProps/core.xml",
        updateCoreProperties(readFile(workbook, "docProps/core.xml"), data.text.title),
      );
    }
    deleteFile(workbook, "xl/sharedStrings.xml");
    deleteFile(workbook, "docProps/custom.xml");
    return writeZip(files);
  }

  window.DV_WORKBOOK_EXPORT = { build };
})();
