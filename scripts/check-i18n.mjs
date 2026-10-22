import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJson = async (file) =>
  JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), "utf8"));
const [fr, en, app, generator, css] = await Promise.all([
  readJson("lang/fr.json"),
  readJson("lang/en.json"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("./build-i18n.py", import.meta.url), "utf8"),
  readFile(new URL("../app.css", import.meta.url), "utf8"),
]);

const flatten = (value, prefix = "") => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flatten(item, `${prefix}.${index}`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      flatten(item, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
};
const frenchKeys = flatten(fr).sort();
const englishKeys = flatten(en).sort();
assert.deepEqual(englishKeys, frenchKeys, "French and English locale keys differ");

const source = `${app}\n${generator}`;
const dynamicPrefixes = [
  "meta.",
  "app.checklist.",
  "app.guide.",
  "app.faq.",
  "app.legacy.",
  "app.fields.",
  "app.education.",
  "app.status.",
  "app.ui.child.",
];
const keys = flatten(fr);
const unused = keys.filter((key) => {
  if (dynamicPrefixes.some((prefix) => key.startsWith(prefix))) return false;
  const leaf = key.split(".").at(-1);
  return !source.includes(key) && !new RegExp(`["']${leaf}["']`).test(source);
});
assert.deepEqual(unused, [], `Unused translation keys: ${unused.join(", ")}`);

assert.equal(fr.app.checklist.length, 11, "Checklist must contain 11 entries");
assert.equal(en.app.checklist.length, 11, "English checklist must contain 11 entries");
assert.equal(fr.app.guide.length, 9, "Tips must contain 9 entries");
assert.equal(en.app.guide.length, 9, "English tips must contain 9 entries");
assert.equal(fr.app.faq.length, 6, "FAQ must contain 6 entries");
assert.equal(en.app.faq.length, 6, "English FAQ must contain 6 entries");
assert.ok(fr.app.workbook.title.includes("{name}"), "French workbook title must be personalized");
assert.ok(en.app.workbook.title.includes("{name}"), "English workbook title must be personalized");
assert.match(app, /function applicantName\(\)/, "Export naming must read the principal applicant name");
assert.match(app, /function exportFilename\(extension\)/, "Export filenames must include a safe name");
assert.match(css, /@page\s*\{\s*size:\s*A4 portrait;/, "PDF print layout must use A4 portrait");
assert.match(css, /body\.printing-report > header/, "Print stylesheet must preserve the report header");

const frenchPatterns = [
  /[àâçéèêëîïôùûüÿœæ]/i,
  /\b(?:candidature|conjoint|enfant|passeport|dossier|données|obligatoire|renseigner|sélectionné|inscription|sauvegarde|réinitialiser|précédent|suivant|études|adresse|contrôles|partager|affilié|conseils)\b/i,
];
const residual = app
  .split(/\r?\n/)
  .map((line, index) => ({ line, index: index + 1 }))
  .filter(({ line }) => frenchPatterns.some((pattern) => pattern.test(line)));
assert.deepEqual(
  residual,
  [],
  `French text remains in app.js:\n${residual.map(({ index, line }) => `${index}: ${line}`).join("\n")}`,
);

for (const [file, language] of [
  ["index.html", "fr"],
  ["en/index.html", "en"],
]) {
  const html = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  assert.match(html, new RegExp(`<html lang="${language}">`), `${file}: language`);
  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  assert.ok(jsonLd, `${file}: JSON-LD missing`);
  JSON.parse(jsonLd[1]);
  for (const hreflang of ["fr", "en", "x-default"]) {
    assert.match(
      html,
      new RegExp(`rel="alternate" hreflang="${hreflang}"`),
      `${file}: missing ${hreflang}`,
    );
  }
}

console.log("i18n checks passed: key parity, usage, translations, FAQ, JSON-LD and hreflang.");
