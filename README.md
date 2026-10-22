# Atelier DV — DV Lottery preparation tool

© 2026 Remy A. (Cybersecurity Analyst & Developer). All rights reserved; see `LICENSE`.

Atelier DV is a free, static, bilingual (French and English) preparation tool. It uses vanilla JavaScript and has no client-side framework or runtime dependency. Generated HTML and manifests are committed, so Vercel and Render serve the site directly without a build step. Personal case information stays in the visitor’s browser. Form edits are saved to local storage as they are made and restored on reload; if the browser refuses a write, the app displays a warning.

## Structure

- `index.html`, `confidentialite.html`, `mentions-legales.html`, `404.html`: French pages at the site root.
- `en/index.html`, `en/privacy.html`, `en/legal-notice.html`, `en/404.html`: English equivalents.
- `templates/`: source HTML templates used to generate the committed pages.
- `lang/fr.json`, `lang/en.json`: application, page metadata, FAQ, guidance, form, and interface translations.
- `app.js`, `app.css`, `i18n.js`, `workbook-export.js`: shared application, styles, language/date helpers, and the styled Excel template exporter.
- `assets/dv-lottery-preparation-template.xlsx`: local Excel template used to create the formatted dossier workbook.
- `config.js`: administrator settings such as the reference date, announcement banner, analytics and contact details.
- `manifest.webmanifest`, `en/manifest.webmanifest`, `sw.js`: installable/offline versions and bilingual cache.
- `scripts/build-i18n.py`: generate the static language versions, manifests and bilingual sitemap.
- `scripts/make-og.py`, `og-image.png`, `og-image-en.png`: French and English social preview images.
- `scripts/check-i18n.mjs`: translation parity, usage, residual French, FAQ and JSON-LD checks.
- `configure.py`: configure the canonical site origin, contact email and both language versions in one call.
- `robots.txt`, `sitemap.xml`, `.well-known/security.txt`: indexing and security contact.
- `vercel.json`, `render.yaml`: static hosting and HTTP security headers.

## Add or update a language

1. Add a locale JSON file with the same hierarchical keys and array lengths as `lang/fr.json`.
2. Add the language’s page routes and source templates under `templates/`.
3. Extend `scripts/build-i18n.py`, the language switcher route map in `app.js`, and the service worker precache.
4. Add the language’s manifest, legal-page translations and social-preview image.
5. Run the checks below. Confirm canonical URLs, reciprocal `hreflang`, sitemap entries, offline navigation and keyboard/screen-reader behavior before deployment.

## Regenerate and configure

From the repository root:

```powershell
python scripts/build-i18n.py
python -m pip install Pillow # first time only; required by the image generator
python scripts/make-og.py
```

To set both canonical URL families and the contact email in one call:

```powershell
python configure.py https://your-domain.example contact@your-domain.example
```

The generated HTML, manifests and sitemap are committed as static files. Hosting does not run these commands at deploy time.

## Test locally

```powershell
node --check app.js
node --check i18n.js
node --check workbook-export.js
node --check sw.js
node --check scripts/check-i18n.mjs
python -m py_compile configure.py scripts/build-i18n.py scripts/make-og.py
node scripts/check-i18n.mjs
python -m http.server 8000
```

Open `http://localhost:8000/` and `http://localhost:8000/en/` in a browser. Test the tips, every marital status, each form tab, child age checks, checklist and result states, save/share dialogs, analytics consent, and FR↔EN switching with populated data. Confirm the save dialog offers PDF/print and Excel only, with no CSV, JSON backup, Google Sheets or backup restoration controls in either language. Test offline mode after each language has been visited once.

The save dialog offers a print-ready, branded A4 PDF report with a personalized cover, profile details, entry tracking and checklist; choose “Save as PDF” in the browser print dialog. The PDF document title and Excel filename include the principal applicant’s first and/or last name (with a localized fallback when no name is entered). Excel exports use the local template and include sheets for applicants and children, plus localized checklist and entry-tracking sheets. CSV, JSON backup, Google Sheets actions and backup restoration are not offered in the dialog. After printing, the app restores the tab, URL and scroll position that were open before printing.

## Bilingual SEO and release checklist

- In Google Search Console, submit `/sitemap.xml`.
- Inspect each French and English URL and verify that canonical points to that language’s URL and that reciprocal `hreflang="fr"`, `hreflang="en"` and `hreflang="x-default"` links are present.
- Check the sitemap XML and both language manifests after running `scripts/build-i18n.py`.
- Confirm social previews select `og-image.png` for French and `og-image-en.png` for English.
- Run Lighthouse SEO and accessibility on `/` and `/en/`; target at least 95. Also test language controls by keyboard and a screen reader.
- Keep the static deployment’s security headers. The application’s external scripts are loaded from self-hosted files; existing inline styles and the optional third-party XLSX/analytics integrations account for the current CSP allowances. No new CSP exception is required for i18n.

## Hosting

- **Vercel:** Framework “Other”, no build command, project root `./`.
- **Render:** Static Site / Blueprint, publish directory `.`, no application build step.

## Analytics and legal review

Google Analytics 4 is loaded only after consent. Anonymous events include the active language; no case information is sent. Plausible can be enabled through `config.js`.

Have a qualified human review the English legal translations and the eligibility/education wording before launch. The legal pages intentionally retain the Togolese Law No. 2019-014 and GDPR references and the publisher’s highlighted fields to complete; no additional legal facts are asserted here. Official program-year instructions at `dvprogram.state.gov` and `travel.state.gov` take precedence. Atelier DV is not affiliated with or endorsed by the U.S. government and does not promise improved selection odds.
