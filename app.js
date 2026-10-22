window.DV_I18N_READY.then(() => {
      const { lang, t, plural, fmtDate } = window.DV_I18N;
      const K = "dv-atelier-v1",
        $ = (s) => document.querySelector(s);
      const EDU = [
        ["Primary school only", t("app.education.primary." + (lang === "fr" ? "fr" : "en"))],
        ["Some high school, no diploma", t("app.education.someHighSchool." + (lang === "fr" ? "fr" : "en"))],
        ["High school diploma", t("app.education.highSchool." + (lang === "fr" ? "fr" : "en"))],
        ["Vocational school", t("app.education.vocational." + (lang === "fr" ? "fr" : "en"))],
        ["Some university courses", t("app.education.someUniversity." + (lang === "fr" ? "fr" : "en"))],
        ["University degree", t("app.education.degree." + (lang === "fr" ? "fr" : "en"))],
        ["Some graduate level courses", t("app.education.someGraduate." + (lang === "fr" ? "fr" : "en"))],
        ["Master’s degree", t("app.education.masters." + (lang === "fr" ? "fr" : "en"))],
        ["Some doctoral level courses", t("app.education.someDoctorate." + (lang === "fr" ? "fr" : "en"))],
        ["Doctorate degree", t("app.education.doctorate." + (lang === "fr" ? "fr" : "en"))],
      ];
      const MAR = {
        unmarried: [
          t("app.status.unmarried.label"),
          t("app.status.unmarried.help"),
        ],
        married: [
          t("app.status.married.label"),
          t("app.status.married.help"),
        ],
        marriedus: [
          t("app.status.marriedus.label"),
          t("app.status.marriedus.help"),
        ],
        divorced: [
          t("app.status.divorced.label"),
          t("app.status.divorced.help"),
        ],
        widowed: [
          t("app.status.widowed.label"),
          t("app.status.widowed.help"),
        ],
        separated: [
          t("app.status.separated.label"),
          t("app.status.separated.help"),
        ],
      };
      const fieldLabels = {
        last: "last", first: "first", mid: "middle", sex: "gender",
        dob: "birthDate", bc: "birthCity", bco: "birthCountry",
        elig: "eligibility", a1: "address1", a2: "address2", city: "city",
        reg: "region", zip: "postal", ctry: "country", res: "residence",
        tel: "phone", email: "email", edu: "education", ppn: "passportNumber",
        ppc: "passportCountry", ppe: "passportExpiry", rel: "relationship",
      };
      const T = (k, o) => ({ k, label: fieldLabels[k], o, t: "text" }),
        SEL = (k, op, r) => ({ k, label: fieldLabels[k], op, t: "sel", r });
      const ID = [
        T("last"),
        T("first"),
        T("mid", 1),
        SEL("sex", ["Male", "Female"]),
        { k: "dob", label: fieldLabels.dob, t: "date" },
        T("bc"),
        T("bco"),
      ];
      const IDP = [
        ...ID,
        T("elig"),
      ];
      const ADDR = [
        T("a1"),
        T("a2", 1),
        T("city"),
        T("reg"),
        T("zip"),
        T("ctry"),
        T("res"),
        T("tel", 1),
        { k: "email", label: fieldLabels.email, t: "email" },
      ];
      const ST = [
        SEL("edu", EDU, 1),
        T("ppn"),
        T("ppc"),
        {
          k: "ppe",
          label: fieldLabels.ppe,
          t: "date",
        },
      ];
      const KID = [
        ...ID,
        SEL("rel", [
          "Biological child",
          "Adopted child",
          "Stepchild",
        ]),
      ];
      const CHK = Array.from({ length: 11 }, (_, i) => [
        `c${i + 1}`,
        t(`app.checklist.${i}`),
        i === 10 ? 2 : 1,
      ]);
      function configuredText(value) {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") return value[lang] || "";
        return "";
      }
      function configuredHttpsUrl(value, key) {
        if (!value) return "";
        try {
          const candidate = /^[a-z][a-z\d+.-]*:/i.test(value.trim())
            ? value.trim()
            : `https://${value.trim()}`;
          const url = new URL(candidate);
          if (url.protocol !== "https:" && url.protocol !== "http:") {
            throw new Error("Only HTTP(S) URLs are supported.");
          }
          return url.href;
        } catch (error) {
          console.error(`Invalid ${key} URL in DV_CONFIG.`, error);
          return "";
        }
      }
      function plausibleSiteDomain(value) {
        try {
          const candidate = /^[a-z][a-z\d+.-]*:/i.test(value.trim())
            ? value.trim()
            : `https://${value.trim()}`;
          const url = new URL(candidate);
          if (
            (url.protocol !== "https:" && url.protocol !== "http:") ||
            !url.hostname
          ) {
            throw new Error("A valid HTTP(S) site URL or hostname is required.");
          }
          return url.hostname;
        } catch (error) {
          console.error("Invalid plausible domain in DV_CONFIG.", error);
          return "";
        }
      }
      const C = Object.assign(
        {
          ref: "2027-09-30",
          session: "DV-2027",
          banner: "",
          ga: "",
          plausible: "",
          siteUrl: "",
          author: "Remy A.",
          authorTitle: "Cybersecurity Analyst & Developer",
          authorUrl: "",
          contactEmail: "",
        },
        window.DV_CONFIG || {},
      );
      const authorHref = configuredHttpsUrl(C.authorUrl, "authorUrl");
      const today = () => new Date().toISOString().slice(0, 10);
      const D = {
        v: 2,
        marital: "married",
        double: true,
        nk: 1,
        entry: today(),
        me: {},
        sp: {},
        kids: [{}],
        chk: {},
        ent: { 1: { res: "pending" }, 2: { res: "pending" } },
        tab: "gd",
      };
      function migrate(input) {
        const source = input && typeof input === "object" ? input : {};
        const state = Object.assign(structuredClone(D), source);
        state.me = Object.assign({}, D.me, source.me || {});
        state.sp = Object.assign({}, D.sp, source.sp || {});
        state.kids = Array.isArray(source.kids)
          ? source.kids.map((child) => Object.assign({}, child))
          : structuredClone(D.kids);
        state.ent = Object.fromEntries(
          Object.entries(D.ent).map(([key, defaults]) => [
            key,
            Object.assign({}, defaults, source.ent?.[key] || {}),
          ]),
        );
        state.chk = source.chk && typeof source.chk === "object" ? source.chk : {};
        state.v = 2;
        for (const person of [state.me, state.sp, ...state.kids]) {
          if (
            person &&
            (person.exp === window.DV_I18N_LEGACY.yes ||
              person.exp === window.DV_I18N_LEGACY.no)
          ) {
            person.exp = person.exp === window.DV_I18N_LEGACY.yes ? "yes" : "no";
          }
        }
        const statuses = {
          [window.DV_I18N_LEGACY.notVerified]: "pending",
          [window.DV_I18N_LEGACY.selected]: "selected",
          [window.DV_I18N_LEGACY.notSelected]: "not_selected",
        };
        for (const entry of Object.values(state.ent || {})) {
          if (entry && statuses[entry.res]) entry.res = statuses[entry.res];
        }
        const legacyChecklist = {};
        for (const [index, [id, label]] of CHK.entries()) {
          if (Object.prototype.hasOwnProperty.call(state.chk || {}, id)) {
            legacyChecklist[id] = state.chk[id];
          } else {
            const oldLabel = window.DV_I18N_LEGACY_CHECKLIST[index];
            if (Object.prototype.hasOwnProperty.call(state.chk, oldLabel)) {
              legacyChecklist[id] = state.chk[oldLabel];
            } else if (Object.prototype.hasOwnProperty.call(state.chk, label)) {
              legacyChecklist[id] = state.chk[label];
            }
          }
        }
        state.chk = legacyChecklist;
        return state;
      }
      let S = (() => {
        try {
          const j = localStorage.getItem(K);
          if (j) return migrate(JSON.parse(j));
        } catch (e) {}
        return structuredClone(D);
      })();
      const save = () => {
        try {
          localStorage.setItem(K, JSON.stringify(S));
          $("#storage-warning").hidden = true;
          $("#storage-warning").textContent = "";
        } catch (error) {
          console.error("Unable to save application state in local storage.", error);
          const warning = $("#storage-warning");
          warning.textContent = t("app.ui.storageUnavailable");
          warning.hidden = false;
        }
      };
      const gp = (p) =>
        p.split(".").reduce((o, k) => (o == null ? o : o[k]), S);
      const put = (p, v) => {
        const a = p.split("."),
          l = a.pop();
        a.reduce((o, k) => (o[k] ??= {}), S)[l] = v;
      };
      const esc = (s) =>
        String(s ?? "").replace(
          /[&<>"]/g,
          (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
        );
      const fmtD = fmtDate;
      const hasSp = () => S.marital === "married",
        dbl = () => hasSp() && S.double,
        isP = (r) => r === "me" || (r === "sp" && dbl());
      const fl = (r) =>
        r === "kid" ? KID : isP(r) ? [...IDP, ...ADDR, ...ST] : ID;
      const lowEdu = (o) =>
        ["Primary school only", "Some high school, no diploma"].includes(o.edu);
      const under21 = (dob, e) => {
        const d = new Date(dob);
        d.setFullYear(d.getFullYear() + 21);
        return d > new Date(e);
      };
      const obj = (r) => (r === "me" ? S.me : S.sp);
      function syncKids() {
        while (S.kids.length < S.nk) S.kids.push({});
        S.kids.length = S.nk;
      }
      function phIssues(o) {
        const e = [],
          p = o.photo;
        if (!p) e.push(t("app.photo.missing"));
        else {
          if (p.t !== "image/jpeg") e.push(t("app.photo.notJpeg"));
          if (p.w !== 600 || p.h !== 600)
            e.push(t("app.photo.dimensions", { width: p.w, height: p.h }));
          if (p.kb > 240) e.push(t("app.photo.size", { size: p.kb }));
        }
        if (!o.pdate) e.push(t("app.photo.missingDate"));
        else {
          const d = (Date.now() - new Date(o.pdate)) / 864e5;
          if (d > 183) e.push(t("app.photo.old"));
          if (d < 0) e.push(t("app.photo.future"));
        }
        return e;
      }
      function comp(r, o) {
        const f = fl(r).filter((x) => !x.o);
        let n = f.length + 1,
          d = f.filter((x) => o[x.k]).length;
        if (!phIssues(o).length) d++;
        if (isP(r) && lowEdu(o)) {
          n++;
          if (o.exp === "yes") d++;
        }
        return d / n;
      }
      const avg = (a) =>
        a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      const pk = () => avg(S.kids.map((k) => comp("kid", k)));
      const pct = () =>
        avg([
          comp("me", S.me),
          ...(hasSp() ? [comp("sp", S.sp)] : []),
          ...S.kids.map((k) => comp("kid", k)),
        ]);
      function fld(pre, x, o) {
        const p = `${pre}.${x.k}`,
          v = o[x.k] ?? "",
          r = x.r ? " data-r" : "";
        const fieldKey = x.label ? `app.fields.${x.label}` : null;
        const primaryLabel = fieldKey
          ? t(`${fieldKey}.${lang === "fr" ? "fr" : "en"}`)
          : t(lang === "fr" ? "app.ui.experience" : "app.ui.experienceOfficial");
        const secondaryLabel = fieldKey
          ? t(`${fieldKey}.${lang === "fr" ? "en" : "help"}`)
          : t(lang === "fr" ? "app.ui.experienceOfficial" : "app.ui.experience");
        const lab = `<span>${primaryLabel}${x.o ? "" : " *"}<small>${secondaryLabel}</small></span>`;
        if (x.t === "sel")
          return `<label class="f">${lab}<select data-p="${p}"${r}><option value="">—</option>${x.op
            .map((a) => {
              const [o, l] = Array.isArray(a) ? a : [a, a];
              return `<option value="${esc(o)}"${o === v ? " selected" : ""}>${esc(l)}</option>`;
            })
            .join("")}</select></label>`;
        return `<label class="f">${lab}<input type="${x.t}" data-p="${p}" value="${esc(v)}"></label>`;
      }
      const card = (t, b, n) =>
        `<section class="card"><h3>${t}</h3>${b}${n || ""}</section>`;
      const grid = (pre, L, o) =>
        `<div class="g">${L.map((x) => fld(pre, x, o)).join("")}</div>`;
      function photo(pre, o) {
        const e = phIssues(o);
        return card(
          t("app.photo.title"),
          `<div class="g"><label class="f"><span>${t("app.photo.file")}<small>${t("app.photo.local")}</small></span><input type="file" accept="image/*" data-ph="${pre}"></label><label class="f"><span>${t("app.photo.taken")}<small>${t("app.photo.sixMonths")}</small></span><input type="date" data-p="${pre}.pdate" value="${esc(o.pdate || "")}"></label></div>`,
          `<div class="note ${e.length ? "wa" : "ok"}">${e.length ? "⚠ " + esc(e.join(" · ")) : "✔ " + esc(t("app.photo.compliant", { name: o.photo.name }))}</div>`,
        );
      }
      function person(r) {
        const o = obj(r),
          P = isP(r);
        let h = "";
        if (r === "me")
          h += `<div class="note">${t("app.ui.namePassport")}</div>`;
        if (r === "sp" && !P)
          h += `<div class="note wa">${t("app.ui.spouseNotPrincipal")}</div>`;
        h += card(t("app.ui.identity"), grid(r, P ? IDP : ID, o));
        if (P) {
          h += card(t("app.ui.address"), grid(r, ADDR, o));
          h += card(
            t("app.ui.educationPassport"),
            grid(r, ST, o),
            lowEdu(o)
              ? `<div class="note wa">${t("app.ui.eligibilityHelp")}</div><div class="g" style="margin-top:10px">${fld(r, { k: "exp", label: null, op: [["yes", t("app.ui.yes")], ["no", t("app.ui.no")]], t: "sel" }, o)}</div>`
              : "",
          );
        }
        return h + photo(r, o);
      }
      function kids() {
        return S.kids
          .map((k, i) => {
            const pre = "kids." + i;
            const a = k.dob
              ? under21(k.dob, S.entry)
                ? `<div class="note ok">${t("app.ui.under21")}</div>`
                : `<div class="note er">${t("app.ui.over21")}</div>`
              : "";
            return (
              `<h4>${t("app.ui.childLabel")} ${i + 1}</h4>` +
              card(
                t("app.ui.identity"),
                grid(pre, KID, k),
                a + `<div class="note">${t("app.ui.childNote")}</div>`,
              ) +
              photo(pre, k)
            );
          })
          .join("");
      }
      function sit() {
        const m = MAR[S.marital],
          n = S.nk,
          pl = plural("app.ui.child", n),
          kt = n ? ` + ${pl}` : "";
        const ch = dbl()
          ? [
              `<b>${t("app.ui.entry")} 1</b>: ${t("app.ui.spouseEntry1")}${kt}`,
              `<b>${t("app.ui.entry")} 2</b>: ${t("app.ui.spouseEntry2")}${kt}`,
            ]
          : [
              `<b>${t("app.ui.uniqueEntry")}</b>: ${t("app.ui.singleEntry")}${hasSp() ? " + " + t("app.ui.spouse") : ""}${kt}`,
            ];
        return (
          card(
            t("app.ui.status"),
            `<div class="g"><label class="f"><span>${t("app.ui.fieldRequired")}<small>${t(lang === "fr" ? "app.ui.maritalOfficial" : "app.ui.officialEntryField")}</small></span><select data-p="marital" data-r>${Object.entries(
              MAR,
            )
              .map(
                ([k, v]) =>
                  `<option value="${k}"${S.marital === k ? " selected" : ""}>${v[0]}</option>`,
              )
              .join("")}</select></label>
<label class="f"><span>${t("app.ui.childrenCount")}<small>${lang === "fr" ? "Number of children" : "List every eligible child"}</small></span><input type="number" min="0" max="10" data-p="nk" data-r value="${S.nk}"></label>
<label class="f"><span>${t("app.ui.plannedEntryDate")}<small>${t("app.ui.ageHelp")}</small></span><input type="date" data-p="entry" value="${S.entry}"></label>
<div class="f"><span>${t("app.ui.referenceDate")}<small>${t("app.ui.referenceHelp")}</small></span><b>${fmtD(C.ref)}</b></div></div>`,
            `<div class="note">${m[1]}</div>` +
              (hasSp()
                ? `<label class="sw"><input type="checkbox" data-p="double" data-r ${S.double ? "checked" : ""}><span><b>${t("app.ui.doubleEntryTitle")}</b> ${t("app.ui.doubleEntryHelp")}</span></label>`
                : ""),
          ) +
          card(
            t("app.ui.entriesTitle"),
            ch.map((c) => `<span class="chip">${c}</span>`).join(""),
          )
        );
      }
      function checks() {
        const c = [],
          ok = (m) => c.push(["ok", m]),
          wa = (m) => c.push(["wa", m]),
          er = (m) => c.push(["er", m]);
        const nm = (o) =>
          ((o.last || "") + (o.first || "")).trim().toLowerCase();
        const P = [[t("app.ui.me"), S.me]];
        if (dbl()) P.push([t("app.ui.spouse"), S.sp]);
        if (dbl() && nm(S.me) && nm(S.me) === nm(S.sp))
          er(t("app.ui.principalApplicantsSame"));
        P.forEach(([n, o]) => {
          o.ppe
            ? o.ppe > C.ref
              ? ok(t("app.ui.passportValid", { person: n }))
              : er(t("app.ui.passportExpires", { person: n, date: fmtD(C.ref) }))
            : wa(t("app.ui.passportExpiryMissing", { person: n }));
          o.email
            ? ok(t("app.ui.emailAdded", { person: n }))
            : wa(t("app.ui.emailMissing", { person: n }));
          if (lowEdu(o) && o.exp !== "yes")
            er(t("app.ui.educationMissing", { person: n }));
          else
            o.edu
              ? ok(t("app.ui.educationComplete", { person: n }))
              : wa(t("app.ui.educationMissingLevel", { person: n }));
        });
        [
          [t("app.ui.me"), S.me],
          ...(hasSp() ? [[t("app.ui.spouse"), S.sp]] : []),
          ...S.kids.map((k, i) => [`${t("app.ui.childLabel")} ${i + 1}`, k]),
        ].forEach(([n, o]) => {
          const e = phIssues(o);
          e.length
            ? wa(t("app.ui.photoWarning", { person: n, issues: e.join(", ") }))
            : ok(t("app.ui.photoOk", { person: n }));
        });
        S.kids.forEach((k, i) =>
          k.dob
            ? under21(k.dob, S.entry)
              ? ok(t("app.ui.childUnder21", { number: i + 1 }))
              : er(t("app.ui.childAdult", { number: i + 1 }))
            : wa(t("app.ui.childBirthMissing", { number: i + 1 })),
        );
        if (dbl())
          ok(t("app.ui.familyCopied"));
        const p = pct();
        p < 1
          ? wa(t("app.ui.completion", { percent: Math.round(p * 100) }))
          : ok(t("app.ui.allComplete"));
        return c;
      }
      function chk() {
        const L = CHK.filter((x) => x[1] === 1 || dbl()),
          d = L.filter((x) => S.chk[x[0]]).length;
        return (
          card(
            t("app.ui.checksTitle"),
            checks()
              .map(
                ([l, m]) =>
                  `<div class="ck ${l}"><b>${{ ok: "✔", wa: "⚠", er: "✖" }[l]}</b> ${esc(m)}</div>`,
              )
              .join(""),
          ) +
          card(
            t("app.ui.checklistTitle", { percent: Math.round((100 * d) / L.length) }),
            L.map(
              ([id, label]) =>
                `<label class="sw"><input type="checkbox" data-p="chk.${id}" data-r ${S.chk[id] ? "checked" : ""}><span>${label}</span></label>`,
            ).join(""),
          )
        );
      }
      function rowsOf(r, o) {
        const rows = fl(r).map((x) => [
          t(`app.fields.${x.label}.${lang === "fr" ? "fr" : "en"}`),
          x.t === "date" ? fmtD(o[x.k]) : o[x.k],
        ]);
        rows.push([t("app.photo.file"), o.photo && o.photo.name]);
        return rows.filter((a) => a[1]);
      }
      const grp = (title, rows) =>
        `<details open><summary>${title}</summary>${rows.map(([l, v]) => `<button class="cp" data-cp="${esc(v)}"><span>${l}</span><b>${esc(v)}</b></button>`).join("") || `<div class="mu">${t("app.ui.noData")}</div>`}</details>`;
      function rec() {
        const E = [[1, S.me, "me", hasSp() ? S.sp : null]];
        if (dbl()) E.push([2, S.sp, "sp", S.me]);
        return (
          E.map(([n, p, r, s]) =>
            card(
              `${t("app.ui.entry")} ${n} · ${t("app.ui.principal")}: ${r === "me" ? t("app.ui.me") : t("app.ui.spouse")}`,
              grp(t("app.ui.principal"), rowsOf(r, p)) +
                (s ? grp(t("app.ui.listedSpouse"), rowsOf("spouse", s)) : "") +
                S.kids
                  .map((k, i) => grp(`${t("app.ui.childLabel")} ${i + 1}`, rowsOf("kid", k)))
                  .join("") +
                `<h4>${t("app.ui.submissionTitle")}</h4><div class="g"><label class="f"><span>${t("app.ui.confirmationNumber")}</span><input data-p="ent.${n}.conf" value="${esc(S.ent[n].conf || "")}"></label><label class="f"><span>${t("app.ui.submissionDate")}</span><input type="date" data-p="ent.${n}.sd" value="${esc(S.ent[n].sd || "")}"></label><label class="f"><span>${t("app.ui.result")}</span><select data-p="ent.${n}.res">${[["pending", t("app.ui.statusPending")], ["selected", t("app.ui.statusSelected")], ["not_selected", t("app.ui.statusNotSelected")]].map(([key, label]) => `<option value="${key}"${S.ent[n].res === key ? " selected" : ""}>${label}</option>`).join("")}</select></label></div><label class="sw"><input type="checkbox" data-p="ent.${n}.paid" ${S.ent[n].paid ? "checked" : ""}><span>${t("app.ui.feePaid")}</span></label>`,
            ),
          ).join("") +
          `<p class="mu">${t("app.ui.copyHint")}</p>`
        );
      }
      function tabs() {
        const steps = [
          ["gd", t("app.steps.guide")],
          ["sit", t("app.steps.situation")],
          ["me", t("app.steps.me")],
        ];
        if (hasSp()) steps.push(["sp", t("app.steps.spouse")]);
        if (S.nk > 0) steps.push(["kid", t("app.steps.children")]);
        steps.push(["chk", t("app.steps.checks")], ["rec", t("app.steps.summary")]);
        return steps;
      }
      function meta() {
        const p = Math.round(pct() * 100);
        $("#pb").style.width = p + "%";
        $("#pt").textContent = t("app.ui.profileProgress", { percent: p });
        const v = {
          me: comp("me", S.me),
          sp: hasSp() ? comp("sp", S.sp) : 0,
          kid: pk(),
        };
        for (const k in v) {
          const e = $("#b-" + k);
          if (e)
            e.textContent =
              Math.round(v[k] * 100) + (lang === "fr" ? "\u00a0%" : "%");
        }
      }
      function render() {
        syncKids();
        const steps = tabs();
        if (!steps.some((x) => x[0] === S.tab)) S.tab = "gd";
        if (location.hash) {
          const hashTab = decodeURIComponent(location.hash.slice(1));
          if (steps.some((item) => item[0] === hashTab)) S.tab = hashTab;
        }
        $("#nav").innerHTML = steps
          .map(
            ([k, l]) =>
              `<button data-t="${k}" class="${S.tab === k ? "on" : ""}">${l}${["me", "sp", "kid"].includes(k) ? `<em id="b-${k}"></em>` : ""}</button>`,
          )
          .join("");
        $("#lh").innerHTML = switcher(t("app.ui.languageAria"));
        const B = {
          gd: guide,
          sit,
          me: () => person("me"),
          sp: () => person("sp"),
          kid: kids,
          chk,
          rec,
        };
        const banner = configuredText(C.banner);
        $("#m").innerHTML =
          (banner ? `<div class="note wa">📢 ${esc(banner)}</div>` : "") +
          B[S.tab]() +
          nb(steps) +
          "";
        $("#ft").innerHTML = foot();
        meta();
        save();
      }
      let dialogTrigger = null;
      function openDialog(dialog) {
        dialogTrigger = document.activeElement;
        document.body.classList.add("dialog-open");
        dialog.hidden = false;
        requestAnimationFrame(() =>
          dialog.querySelector(
            "button:not(:disabled), a[href], textarea, input, [tabindex='0']",
          )?.focus(),
        );
      }
      function closeDialog(dialog) {
        if (!dialog || dialog.hidden) return;
        dialog.hidden = true;
        if (!document.querySelector(".dlg:not([hidden])")) {
          document.body.classList.remove("dialog-open");
          if (dialogTrigger?.isConnected) dialogTrigger.focus();
          dialogTrigger = null;
        }
      }
      document.addEventListener("keydown", (event) => {
        const dialog = document.querySelector(".dlg:not([hidden]) [role='dialog']");
        if (!dialog) return;
        if (event.key === "Escape") {
          closeDialog(dialog.closest(".dlg"));
          return;
        }
        if (event.key !== "Tab") return;
        const focusable = [
          ...dialog.querySelectorAll(
            "a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [tabindex='0']",
          ),
        ].filter((element) => element.getClientRects().length);
        if (!focusable.length) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      document.addEventListener("click", (event) => {
        if (event.target.matches(".dlg")) closeDialog(event.target);
      });
      function onEv(e) {
        const t = e.target,
          p = t.dataset.p;
        if (!p) return;
        let v = t.type === "checkbox" ? t.checked : t.value;
        if (t.type === "number")
          v = Math.max(0, Math.min(10, Math.floor(+v || 0)));
        put(p, v);
        save();
        if (e.type === "change" && t.dataset.r !== undefined) render();
        else meta();
      }
      document.addEventListener("input", onEv);
      document.addEventListener("change", onEv);
      document.addEventListener("change", (e) => {
        const t = e.target,
          pre = t.dataset.ph;
        if (!pre) return;
        const f = t.files[0];
        if (!f) return;
        const im = new Image(),
          u = URL.createObjectURL(f);
        im.onload = () => {
          put(pre + ".photo", {
            name: f.name,
            t: f.type,
            w: im.naturalWidth,
            h: im.naturalHeight,
            kb: Math.round(f.size / 1024),
          });
          URL.revokeObjectURL(u);
          render();
        };
        im.onerror = () => {
          put(pre + ".photo", {
            name: f.name,
            t: "invalide",
            w: 0,
            h: 0,
            kb: Math.round(f.size / 1024),
          });
          render();
        };
        im.src = u;
      });
      document.addEventListener("click", async (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.t) {
          S.tab = b.dataset.t;
          history.replaceState(null, "", `#${S.tab}`);
          render();
          scrollTo(0, 0);
          track("tab_view", { tab: S.tab });
        } else if (b.dataset.cp !== undefined) {
          try {
            await navigator.clipboard.writeText(b.dataset.cp);
            b.style.outline = "2px solid var(--ok)";
            setTimeout(() => (b.style.outline = ""), 700);
          } catch (x) {}
        } else if (b.id === "bk") {
          msg("");
          openDialog($("#dlg"));
        } else if (b.id === "sh") {
          shareUI();
          openDialog($("#dl2"));
        } else if (b.dataset.close !== undefined)
          closeDialog(b.closest(".dlg"));
        else if (b.dataset.x) exp(b.dataset.x);
        else if (b.dataset.go) {
          const t = tabs().map((x) => x[0]),
            i = t.indexOf(S.tab) + +b.dataset.go;
          if (t[i]) {
            S.tab = t[i];
            history.replaceState(null, "", `#${S.tab}`);
            render();
            scrollTo(0, 0);
            track("tab_view", { tab: S.tab });
          }
        } else if (b.dataset.c) {
          try {
            localStorage.setItem("dv-consent", b.dataset.c);
          } catch (x) {}
          $("#cs").hidden = true;
          boot();
        } else if (b.dataset.lk) {
          try {
            await navigator.clipboard.writeText(b.dataset.lk);
            b.textContent = t("app.ui.copied");
          } catch (x) {}
          track("share", { method: "copy" });
        } else if (b.dataset.nat) {
          try {
            await navigator.share({
              title: document.title,
              url: b.dataset.nat,
            });
          } catch (x) {}
          track("share", { method: "native" });
        } else if (b.id === "rst") {
          try {
            S = migrate(JSON.parse($("#ta").value));
            closeDialog($("#dlg"));
            render();
          } catch (x) {
            msg(t("app.ui.invalidRestore"));
          }
        } else if (b.id === "rs") {
          if (b.dataset.s) {
            S = structuredClone(D);
            delete b.dataset.s;
            $("#rs-label").textContent = t("app.buttons.reset");
            render();
          } else {
            b.dataset.s = 1;
            $("#rs-label").textContent = t("app.buttons.confirmReset");
            setTimeout(() => {
              delete b.dataset.s;
              $("#rs-label").textContent = t("app.buttons.reset");
            }, 4000);
          }
        }
      });
      const msg = (text) => {
        $("#msg").textContent = text;
        $("#msg").classList.toggle(
          "is-error",
          text === t("app.ui.invalidRestore"),
        );
      };
      const nb = (steps) => {
        const a = steps.map((x) => x[0]),
          i = a.indexOf(S.tab);
        return `<div class="row noprint"><button data-go="-1"${i ? "" : " disabled"}>${t("app.buttons.previous")}</button><button data-go="1" class="pri"${i < a.length - 1 ? "" : " disabled"}>${t("app.buttons.next")}</button></div>`;
      };
      function guide() {
        const G = Array.from({ length: 9 }, (_, i) => [
          t(`app.guide.${i}.0`),
          t(`app.guide.${i}.1`),
        ]);
        return card(
          t("app.ui.guideTitle"),
          G.map(
            ([t, d]) =>
              `<div class="ck"><b>${t}</b><div class="mu">${d}</div></div>`,
          ).join(""),
          `<div class="note">${t("app.ui.officialWarning")}</div>`,
        );
      }
      function flat() {
        const row = (entry, person, field, official, value) => [
          entry,
          person,
          field,
          ...(lang === "fr" ? [official] : []),
          value,
        ];
        const R = [
          [
            t("app.ui.entry"),
            t("app.ui.person"),
            t("app.ui.column"),
            ...(lang === "fr" ? [t("app.ui.field")] : []),
            t("app.ui.value"),
          ],
          row(
            "",
            t("app.ui.status"),
            t("app.ui.marital"),
            t("app.ui.maritalOfficial"),
            MAR[S.marital][0],
          ),
        ];
        const add = (c, n, r, o) =>
          fl(r).forEach((x) => {
            const v = o[x.k];
            if (v)
              R.push(
                row(
                  c,
                  n,
                  t(`app.fields.${x.label}.${lang === "fr" ? "fr" : "en"}`),
                  t(`app.fields.${x.label}.en`),
                  x.t === "date" ? fmtD(v) : v,
                ),
              );
          });
        const E = [
          [
            1,
            S.me,
            "me",
            hasSp() ? S.sp : null,
            t("app.ui.mePrincipal"),
            t("app.ui.spouse"),
          ],
        ];
        if (dbl())
          E.push([2, S.sp, "sp", S.me, t("app.ui.spousePrincipal"), t("app.ui.me")]);
        E.forEach(([n, p, r, q, a, b]) => {
          add(`${t("app.ui.entry")} ${n}`, a, r, p);
          if (q) add(`${t("app.ui.entry")} ${n}`, b, "spouse", q);
          S.kids.forEach((k, i) =>
            add(`${t("app.ui.entry")} ${n}`, `${t("app.ui.childLabel")} ${i + 1}`, "kid", k),
          );
        });
        return R;
      }
      function trackingRows() {
        const rows = [
          [
            t("app.ui.entry"),
            t("app.ui.confirmationNumber"),
            t("app.ui.submissionDate"),
            t("app.ui.result"),
            t("app.ui.feePaid"),
          ],
        ];
        for (const number of dbl() ? [1, 2] : [1]) {
          const entry = S.ent[number] || {};
          rows.push([
            `${t("app.ui.entry")} ${number}`,
            entry.conf || "",
            fmtD(entry.sd),
            t(
              {
                pending: "app.ui.statusPending",
                selected: "app.ui.statusSelected",
                not_selected: "app.ui.statusNotSelected",
              }[entry.res] || "app.ui.statusPending",
            ),
            entry.paid ? t("app.ui.reportFeeYes") : t("app.ui.reportFeeNo"),
          ]);
        }
        return rows;
      }
      function checklistRows() {
        return [
          [t("app.ui.reportChecklist"), t("app.ui.reportValue")],
          ...CHK.filter((item) => item[2] === 1 || dbl()).map(([id, label]) => [
            label,
            S.chk[id] ? t("app.ui.reportDone") : t("app.ui.reportTodo"),
          ]),
        ];
      }
      function reportTable(rows) {
        return `<table><thead><tr>${rows[0]
          .map((heading) => `<th scope="col">${esc(heading)}</th>`)
          .join("")}</tr></thead><tbody>${rows
          .slice(1)
          .map(
            (row) =>
              `<tr>${row
                .map((cell) => `<td>${esc(cell) || `<span class="report-empty">${t("app.ui.reportNotProvided")}</span>`}</td>`)
                .join("")}</tr>`,
          )
          .join("")}</tbody></table>`;
      }
      function applicantName() {
        return [S.me.first, S.me.last]
          .filter((part) => typeof part === "string" && part.trim())
          .map((part) => part.trim())
          .join(" ");
      }
      function exportFilename(extension) {
        const name = applicantName()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^[.-]+|[.-]+$/g, "")
          .toLocaleLowerCase(lang);
        const fallback = t("app.ui.unnamedFile");
        return `${t("app.ui.fileBase")}-${name || fallback}.${extension}`;
      }
      function buildPrintReport() {
        const rows = flat();
        const groups = new Map();
        for (const row of rows.slice(2)) {
          if (!groups.has(row[0])) groups.set(row[0], new Map());
          const people = groups.get(row[0]);
          if (!people.has(row[1])) people.set(row[1], []);
          people.get(row[1]).push(row);
        }
        const profiles = [...groups.entries()]
          .map(
            ([entry, people]) =>
              `<section class="report-section"><h2>${esc(entry)}</h2>${[
                ...people.entries(),
              ]
                .map(
                  ([person, values]) =>
                    `<h3>${esc(person)}</h3><table><thead><tr><th>${t("app.ui.reportField")}</th><th>${t("app.ui.reportValue")}</th></tr></thead><tbody>${values
                      .map(
                        (value) =>
                          `<tr><th scope="row">${esc(value[2])}${lang === "fr" && value[3] ? `<small>${esc(value[3])}</small>` : ""}</th><td>${esc(value[value.length - 1])}</td></tr>`,
                      )
                      .join("")}</tbody></table>`,
                )
                .join("")}</section>`,
          )
          .join("");
        const overview = reportTable([
          [t("app.ui.reportField"), t("app.ui.reportValue")],
          [t("app.ui.marital"), MAR[S.marital][0]],
          [
            t("app.ui.childrenCount"),
            String(S.nk),
          ],
          [
            t("app.ui.plannedEntryDate"),
            fmtD(S.entry) || t("app.ui.reportNotProvided"),
          ],
          [
            t("app.ui.referenceDate"),
            fmtD(C.ref) || t("app.ui.reportNotProvided"),
          ],
        ]);
        const entries = dbl() ? [1, 2] : [1];
        const tracking = entries
          .map(
            (number) =>
              `<section class="report-section"><h3>${t("app.ui.entry")} ${number}</h3>${reportTable([
                [t("app.ui.reportField"), t("app.ui.reportValue")],
                [
                  t("app.ui.confirmationNumber"),
                  S.ent[number]?.conf || t("app.ui.reportNotProvided"),
                ],
                [
                  t("app.ui.submissionDate"),
                  fmtD(S.ent[number]?.sd) || t("app.ui.reportNotProvided"),
                ],
                [
                  t("app.ui.result"),
                  t(
                    {
                      pending: "app.ui.statusPending",
                      selected: "app.ui.statusSelected",
                      not_selected: "app.ui.statusNotSelected",
                    }[S.ent[number]?.res] || "app.ui.statusPending",
                  ),
                ],
                [
                  t("app.ui.feePaid"),
                  S.ent[number]?.paid
                    ? t("app.ui.reportFeeYes")
                    : t("app.ui.reportFeeNo"),
                ],
              ])}</section>`,
          )
          .join("");
        const date = fmtD(new Date().toISOString().slice(0, 10));
        const name = applicantName() || t("app.ui.reportNotProvided");
        $("#print-report").innerHTML = `<header class="report-header"><div class="report-brand"><img src="/logo.svg" alt=""><div><strong>Atelier DV</strong><span>${t("app.ui.brandSubtitle")}</span></div></div><span class="report-session">${esc(C.session)}</span></header><section class="report-cover"><p class="report-eyebrow">${t("app.ui.reportSubtitle", { session: esc(C.session) })}</p><div class="report-applicant"><span>${t("app.ui.reportPreparedFor")}</span><strong>${esc(name)}</strong></div><p class="report-generated">${t("app.ui.reportGenerated", { date: esc(date) })}</p></section><p class="report-privacy">${t("app.ui.reportPrivacy")}</p><section class="report-section"><h2>${t("app.ui.reportOverview")}</h2>${overview}</section><section class="report-section report-profiles"><h2>${t("app.ui.reportProfiles")}</h2>${profiles || `<p>${t("app.ui.noData")}</p>`}</section><section class="report-section"><h2>${t("app.ui.reportTracking")}</h2>${tracking}</section><section class="report-section"><h2>${t("app.ui.reportChecklist")}</h2>${reportTable(checklistRows())}</section><footer class="report-disclaimer"><span>Atelier DV</span><p>${t("app.ui.reportDisclaimer")}</p></footer>`;
      }
      const csv = (R) =>
        "\ufeff" +
        R.map((r) =>
          r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
        ).join("\n");
      function dl(n, m, d) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([d], { type: m }));
        a.download = n;
        document.body.append(a);
        a.click();
        a.remove();
      }
      function workbookExportData() {
        const text = {
          title: t("app.workbook.title", {
            name: applicantName() || t("app.ui.reportNotProvided"),
          }),
          legend: t("app.workbook.legend"),
          notProvided: t("app.workbook.notProvided"),
          notCollected: t("app.workbook.notCollected"),
          fieldGuidance: t("app.workbook.fieldGuidance"),
          passportGuidance: t("app.workbook.passportGuidance"),
          photoGuidance: t("app.workbook.photoGuidance"),
          ageGuidance: t("app.workbook.ageGuidance"),
          progress: t("app.workbook.progress"),
          verification: t("app.workbook.verification"),
          secondProgress: t("app.workbook.secondProgress"),
          childrenProgress: t("app.workbook.childrenProgress"),
          checklistProgress: t("app.workbook.checklistProgress"),
          dayLabel: t("app.workbook.dayLabel"),
          monthLabel: t("app.workbook.monthLabel"),
          yearLabel: t("app.workbook.yearLabel"),
          careOfLabel: t("app.workbook.careOfLabel"),
          passportScanLabel: t("app.workbook.passportScanLabel"),
          photoNameLabel: t("app.workbook.photoNameLabel"),
          photoDimensionsLabel: t("app.workbook.photoDimensionsLabel"),
          photoSizeLabel: t("app.workbook.photoSizeLabel"),
          photoDateLabel: t("app.workbook.photoDateLabel"),
          passportStatusLabel: t("app.workbook.passportStatusLabel"),
          photoStatusLabel: t("app.workbook.photoStatusLabel"),
          childMaritalLabel: t("app.workbook.childMaritalLabel"),
          entryDateLabel: t("app.workbook.entryDateLabel"),
          ageStatusLabel: t("app.workbook.ageStatusLabel"),
          ageUnknown: t("app.workbook.ageUnknown"),
          ageUnder21: t("app.workbook.ageUnder21"),
          age21OrOlder: t("app.workbook.age21OrOlder"),
          childStatusSection: t("app.workbook.childStatusSection"),
          childPassportSection: t("app.workbook.childPassportSection"),
          childPhotoSection: t("app.workbook.childPhotoSection"),
          passportOk: t("app.workbook.passportOk"),
          passportReview: t("app.workbook.passportReview"),
          photoOk: t("app.workbook.photoOk"),
          photoReview: t("app.workbook.photoReview"),
          noChildren: t("app.workbook.noChildren"),
          referenceLabel: t("app.workbook.referenceLabel"),
          referenceNote: t("app.workbook.referenceNote"),
          checklistTitle: t("app.workbook.checklistTitle"),
          checklistNote: t("app.workbook.checklistNote"),
          checklistSection: t("app.workbook.checklistSection"),
          preparation: t("app.workbook.preparation"),
          allEntries: t("app.workbook.allEntries"),
          checklistGuidance: t("app.workbook.checklistGuidance"),
          trackingTitle: t("app.workbook.trackingTitle"),
          trackingNote: t("app.workbook.trackingNote"),
          trackingSection: t("app.workbook.trackingSection"),
          entrySheetName: (number) =>
            number === 1
              ? t("app.ui.sheetName")
              : `${t("app.ui.entry")} ${number}`,
          childSheetName: (number) =>
            `${t("app.workbook.childTabName")} ${number}`,
          checklistSheetName: t("app.ui.sheetChecklistName"),
          trackingSheetName: t("app.ui.sheetTrackingName"),
          headers: Object.fromEntries(
            Object.entries({
              official: "official",
              local: "local",
              value: "value",
              example: "example",
              required: "required",
              guidance: "guidance",
              verified: "verified",
            }).map(([key, value]) => [
              key,
              t(`app.workbook.headers.${value}`),
            ]),
          ),
          sections: Object.fromEntries(
            Object.entries({
              identity: "identity",
              address: "address",
              education: "education",
              passport: "passport",
              photo: "photo",
              spouse: "spouse",
              spouseNone: "spouseNone",
              children: "children",
            }).map(([key, value]) => [
              key,
              t(`app.workbook.sections.${value}`),
            ]),
          ),
          checklistHeaders: Object.fromEntries(
            Object.entries({
              number: "number",
              phase: "phase",
              item: "item",
              applies: "applies",
              guidance: "guidance",
              status: "status",
              evidence: "evidence",
              notes: "notes",
            }).map(([key, value]) => [
              key,
              t(`app.workbook.checklistHeaders.${value}`),
            ]),
          ),
          trackingHeaders: Object.fromEntries(
            Object.entries({
              entry: "entry",
              confirmation: "confirmation",
              date: "date",
              result: "result",
              fee: "fee",
            }).map(([key, value]) => [
              key,
              t(`app.workbook.trackingHeaders.${value}`),
            ]),
          ),
        };
        const locale = lang === "fr" ? "fr" : "en";
        const fieldNames = Object.fromEntries(
          Object.entries({
            last: "last",
            first: "first",
            middle: "middle",
            gender: "gender",
            birthDate: "birthDate",
            birthCity: "birthCity",
            birthCountry: "birthCountry",
            eligibility: "eligibility",
            address1: "address1",
            address2: "address2",
            city: "city",
            region: "region",
            postal: "postal",
            country: "country",
            residence: "residence",
            phone: "phone",
            email: "email",
            education: "education",
            passportNumber: "passportNumber",
            passportCountry: "passportCountry",
            passportExpiry: "passportExpiry",
            relationship: "relationship",
          }).map(([key, field]) => [
            key,
            t(`app.fields.${field}.${locale}`),
          ]),
        );
        Object.assign(fieldNames, {
          marital: t("app.ui.marital"),
          children: t("app.ui.childrenCount"),
          careOf: text.careOfLabel,
          passportScan: text.passportScanLabel,
          passportStatus: text.passportStatusLabel,
          photoName: text.photoNameLabel,
          photoDimensions: text.photoDimensionsLabel,
          photoSize: text.photoSizeLabel,
          photoDate: text.photoDateLabel,
          photoStatus: text.photoStatusLabel,
          childMarital: text.childMaritalLabel,
          entryDate: text.entryDateLabel,
          ageStatus: text.ageStatusLabel,
        });
        const fieldGuidance = Object.fromEntries(
          Object.keys(fieldNames).map((key) => [key, text.fieldGuidance]),
        );
        const officialMarital = {
          unmarried: "Unmarried",
          married:
            "Married and my spouse is NOT a U.S. citizen or U.S. LPR",
          marriedus:
            "Married and my spouse IS a U.S. citizen or U.S. LPR",
          divorced: "Divorced",
          widowed: "Widowed",
          separated: "Legally Separated",
        };
        const makeProfile = (number, role, person, spouse) => {
          const name = [person.last, person.first, person.mid]
            .filter(Boolean)
            .join(" ") || text.notProvided;
          return {
            person,
            spouse: spouse ? { person: spouse } : null,
            title: t("app.workbook.entryTitle", { number, name }),
            progress: comp(role, person),
            marital: officialMarital[S.marital] || "",
            passportStatus:
              person.ppe && C.ref && person.ppe > C.ref
                ? text.passportOk
                : text.passportReview,
            photoStatus: phIssues(person).length
              ? text.photoReview
              : text.photoOk,
          };
        };
        const entries = [
          makeProfile(1, "me", S.me, hasSp() ? S.sp : null),
        ];
        if (dbl()) entries.push(makeProfile(2, "sp", S.sp, S.me));
        const children = S.kids.slice(0, S.nk).map((person, index) => ({
          person,
          title: t("app.workbook.childTitle", { number: index + 1 }),
          progress: comp("kid", person),
          ageStatus: !person.dob
            ? text.ageUnknown
            : under21(person.dob, S.entry)
              ? text.ageUnder21
              : text.age21OrOlder,
          passportStatus: text.passportReview,
          photoStatus: phIssues(person).length
            ? text.photoReview
            : text.photoOk,
        }));
        const results = {
          pending: "app.ui.statusPending",
          selected: "app.ui.statusSelected",
          not_selected: "app.ui.statusNotSelected",
        };
        const tracking = (dbl() ? [1, 2] : [1]).map((number) => {
          const entry = S.ent[number] || {};
          return {
            label: `${t("app.ui.entry")} ${number}`,
            confirmation: entry.conf || "",
            date: fmtD(entry.sd) || "",
            result: t(results[entry.res] || results.pending),
            fee: entry.paid
              ? t("app.ui.reportFeeYes")
              : t("app.ui.reportFeeNo"),
          };
        });
        return {
          templateUrl: "/assets/dv-lottery-preparation-template.xlsx",
          text,
          fieldNames,
          fieldGuidance,
          yes: t("app.ui.yes"),
          no: t("app.ui.no"),
          done: t("app.ui.reportDone"),
          todo: t("app.ui.reportTodo"),
          referenceDate: C.ref,
          entryDate: S.entry,
          entries,
          children,
          checklist: CHK.filter((item) => item[2] === 1 || dbl()).map(
            ([id, label]) => ({ id, label, done: Boolean(S.chk[id]) }),
          ),
          tracking,
        };
      }
      async function exp(f) {
        track("export", { format: f });
        const R = flat();
        const filename = exportFilename(f === "pdf" ? "pdf" : "xlsx");
        if (f === "csv") dl(exportFilename("csv"), "text/csv;charset=utf-8", csv(R));
        else if (f === "json")
          dl(exportFilename("json"), "application/json", JSON.stringify(S, null, 2));
        else if (f === "tsv") {
          const text = R.map((r) => r.join("\t")).join("\n");
          try {
            await navigator.clipboard.writeText(text);
            msg(t("app.ui.copySheetsHelp"));
          } catch (e) {
            $("#ta").value = text;
            msg(t("app.ui.copyBlocked"));
          }
        } else if (f === "pdf") {
          const previousTab = S.tab;
          const previousUrl = location.href;
          const previousScroll = window.scrollY;
          const previousTitle = document.title;
          closeDialog($("#dlg"));
          buildPrintReport();
          document.title = filename;
          document.body.classList.add("printing-report");
          let cleanupTimer;
          const finishPrint = () => {
            window.clearTimeout(cleanupTimer);
            document.body.classList.remove("printing-report");
            document.title = previousTitle;
            window.removeEventListener("afterprint", finishPrint);
            if (location.href !== previousUrl) {
              history.replaceState(null, "", previousUrl);
            }
            if (S.tab !== previousTab) {
              S.tab = previousTab;
              render();
            }
            window.scrollTo(0, previousScroll);
          };
          window.addEventListener("afterprint", finishPrint);
          cleanupTimer = window.setTimeout(finishPrint, 120000);
          setTimeout(() => window.print(), 150);
        } else {
          try {
            if (!window.XLSX)
              await new Promise((ok, ko) => {
                const s = document.createElement("script");
                s.src =
                  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
                s.onload = ok;
                s.onerror = ko;
                document.head.append(s);
              });
            const workbook = await window.DV_WORKBOOK_EXPORT.build(
              workbookExportData(),
            );
            dl(
              filename,
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              workbook,
            );
          } catch (e) {
            console.error("Excel workbook export failed.", e);
            dl(exportFilename("csv"), "text/csv;charset=utf-8", csv(R));
            msg(t("app.ui.excelFallback"));
          }
        }
      }
      function shareUI() {
        const configuredUrl = C.siteUrl || location.origin,
          shareUrl = new URL(configuredUrl);
        shareUrl.pathname = lang === "en" ? "/en/index.html" : "/";
        const u = shareUrl.href,
          shareText = t("app.ui.shareMessage"),
          e = encodeURIComponent;
        const L = [
          ["WhatsApp", "https://wa.me/?text=" + e(shareText + u)],
          ["Telegram", "https://t.me/share/url?url=" + e(u) + "&text=" + e(shareText)],
          ["Facebook", "https://www.facebook.com/sharer/sharer.php?u=" + e(u)],
          [
            "X",
            "https://twitter.com/intent/tweet?text=" + e(shareText) + "&url=" + e(u),
          ],
          [
            "LinkedIn",
            "https://www.linkedin.com/sharing/share-offsite/?url=" + e(u),
          ],
          [
            "E-mail",
            "mailto:?subject=" +
            e(t("app.ui.shareSubject")) +
              "&body=" +
            e(shareText + u),
          ],
        ];
        $("#chs").innerHTML =
          L.map(
            ([n, h]) =>
              `<a class="share-option" data-sh="${n}" href="${h}" target="_blank" rel="noopener"><span class="share-brand" data-brand="${n}" aria-hidden="true">${n === "E-mail" ? "@" : n === "WhatsApp" ? "wa" : n === "Telegram" ? "tg" : n === "Facebook" ? "f" : n === "LinkedIn" ? "in" : "𝕏"}</span><span class="share-copy"><strong>${n}</strong><small>${t("app.ui.shareOpenDesc")}</small></span><span class="export-arrow" aria-hidden="true">↗</span></a>`,
          ).join("") +
          `<button class="share-option share-copy-link" data-lk="${esc(u)}"><span class="share-brand copy-brand" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 8h11v13H8zM5 16H3V3h12v2"/></svg></span><span class="share-copy"><strong>${t("app.ui.copyLink")}</strong><small>${t("app.ui.copyLinkDesc")}</small></span><span class="export-arrow" aria-hidden="true">↗</span></button>` +
          (navigator.share
            ? `<button class="share-option share-native" data-nat="${esc(u)}"><span class="share-brand native-brand" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V3m-5 5 5-5 5 5M4 14v6h16v-6"/></svg></span><span class="share-copy"><strong>${t("app.ui.otherShare")}</strong><small>${t("app.ui.otherShareDesc")}</small></span><span class="export-arrow" aria-hidden="true">↗</span></button>`
            : "") +
          `<div class="share-url"><span>${t("app.ui.shareUrlLabel")}</span><code>${esc(u)}</code></div>`;
      }
      document.addEventListener("click", (e) => {
        const a = e.target.closest("[data-sh]");
        if (a) track("share", { method: a.dataset.sh });
      });
      window.addEventListener("dv-language-switch", (event) => {
        track("language_switch", {
          from_lang: event.detail.from,
          to_lang: event.detail.to,
        });
      });
      const consent = () => {
        try {
          return localStorage.getItem("dv-consent");
        } catch (e) {
          return null;
        }
      };
      function track(n, p) {
        try {
          const props = { ...(p || {}), lang };
          if (window.gtag && consent() === "yes") gtag("event", n, props);
          if (window.plausible) plausible(n, { props });
        } catch (e) {}
      }
      function boot() {
        const sc = (u) => {
          const s = document.createElement("script");
          s.async = true;
          s.src = u;
          return s;
        };
        if (C.plausible && !window.plausible) {
          window.plausible = function () {
            (plausible.q = plausible.q || []).push(arguments);
          };
          const s = sc("https://plausible.io/js/script.js");
          const domain = plausibleSiteDomain(C.plausible);
          if (domain) {
            s.dataset.domain = domain;
            document.head.append(s);
          }
        }
        if (C.ga) {
          if (consent() === "yes") {
            if (!window.gtag) {
              window.dataLayer = window.dataLayer || [];
              window.gtag = function () {
                dataLayer.push(arguments);
              };
              gtag("js", new Date());
              gtag("config", C.ga, { anonymize_ip: true });
              document.head.append(
                sc(
                  "https://www.googletagmanager.com/gtag/js?id=" +
                    encodeURIComponent(C.ga),
                ),
              );
            }
          } else if (!consent()) $("#cs").hidden = false;
        }
      }
      const languagePaths = {
        "/": { fr: "/", en: "/en/index.html" },
        "/index.html": { fr: "/index.html", en: "/en/index.html" },
        "/confidentialite.html": { fr: "/confidentialite.html", en: "/en/privacy.html" },
        "/mentions-legales.html": { fr: "/mentions-legales.html", en: "/en/legal-notice.html" },
        "/404.html": { fr: "/404.html", en: "/en/404.html" },
      };
      const switcher = (ariaLabel) => {
        const current = languagePaths[location.pathname] || languagePaths["/"];
        return `<nav class="language-switch" aria-label="${ariaLabel}"><a href="${current.fr}${location.hash}" lang="fr" hreflang="fr"${lang === "fr" ? ' aria-current="true"' : ""} data-lang="fr">FR</a><a href="${current.en}${location.hash}" lang="en" hreflang="en"${lang === "en" ? ' aria-current="true"' : ""} data-lang="en">EN</a></nav>`;
      };
      const authorTitle = configuredText(C.authorTitle);
      const foot = () =>
        `<footer class="mu noprint"><p>${t("app.ui.footerDisclaimer")}</p><p>© 2026 ${authorHref ? `<a href="${esc(authorHref)}" rel="author noopener">${esc(C.author)}</a>` : esc(C.author)} · ${esc(authorTitle)}. ${t("app.ui.rights")} <a href="${lang === "fr" ? "/confidentialite.html" : "/en/privacy.html"}">${t("app.ui.privacy")}</a> · <a href="${lang === "fr" ? "/mentions-legales.html" : "/en/legal-notice.html"}">${t("app.ui.legal")}</a>${C.ga ? ` · <a href="#" data-consent>${t("app.ui.analytics")}</a>` : ""}${C.contactEmail ? ` · <a href="mailto:${esc(C.contactEmail)}">${t("app.ui.contact")}</a>` : ""}</p></footer>`;
      document.addEventListener("click", (e) => {
        const a = e.target.closest("[data-consent]");
        if (a) {
          e.preventDefault();
          try {
            localStorage.removeItem("dv-consent");
          } catch (x) {}
          $("#cs").hidden = false;
        }
      });
      render();
      boot();
      try {
        if ("serviceWorker" in navigator && /^https?:/.test(location.protocol))
          navigator.serviceWorker.register("/sw.js").catch((error) => {
            console.error("Unable to register the offline service worker", error);
          });
      } catch (e) {}
}).catch((error) => {
  console.error("Atelier DV failed to load its translations", error);
  const main = document.querySelector("#m");
  if (main) main.textContent = "Unable to load translations. Please refresh the page.";
});
