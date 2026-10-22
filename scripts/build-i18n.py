#!/usr/bin/env python3
"""Generate the committed French and English static pages from templates and language files."""
import html
import json
import argparse
import re
from pathlib import Path
from urllib.parse import urljoin
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "templates"
LOCALES = ROOT / "lang"


def load_locale(code):
    return json.loads((LOCALES / f"{code}.json").read_text(encoding="utf-8"))


def replace_once(source, pattern, replacement, flags=re.S):
    result, count = re.subn(pattern, replacement, source, count=1, flags=flags)
    if count != 1:
        raise ValueError(f"Expected one template match for {pattern!r}, found {count}")
    return result


def json_ld(locale, canonical):
    app = locale["meta"]
    questions = [
        {
            "@type": "Question",
            "name": question,
            "acceptedAnswer": {"@type": "Answer", "text": answer},
        }
        for question, answer in locale["app"]["faq"]
    ]
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "WebApplication",
                    "name": "Atelier DV",
                    "url": canonical,
                    "applicationCategory": "UtilitiesApplication",
                    "operatingSystem": "Web",
                    "inLanguage": locale["language"],
                    "description": app["description"],
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "EUR",
                    },
                    "author": {
                        "@type": "Person",
                        "name": "Remy A.",
                        "jobTitle": "Cybersecurity Analyst & Developer",
                    },
                    "copyrightHolder": {
                        "@type": "Person",
                        "name": "Remy A.",
                    },
                    "copyrightYear": 2026,
                },
                {
                    "@type": "FAQPage",
                    "mainEntity": questions,
                },
            ],
        },
        ensure_ascii=False,
        indent=2,
    )


def canonical_and_alternates(source, code, routes, base):
    canonical = urljoin(base, routes[code])
    source = replace_once(
        source,
        r'<link rel="canonical" href="[^"]*"\s*/?>',
        f'<link rel="canonical" href="{html.escape(canonical, quote=True)}" />',
    )
    alternate_tags = "\n".join(
        f'    <link rel="alternate" hreflang="{alternate}" '
        f'href="{html.escape(urljoin(base, routes[key]), quote=True)}" />'
        for alternate, key in [("fr", "fr"), ("en", "en"), ("x-default", "fr")]
    )
    source = replace_once(
        source,
        r'(<link rel="canonical" href="[^"]*"\s*/?>)',
        r"\1\n" + alternate_tags,
    )
    return source, canonical


def switcher(code, page, aria_label):
    paths = {
        "index": {"fr": "/", "en": "/en/index.html"},
        "privacy": {"fr": "/confidentialite.html", "en": "/en/privacy.html"},
        "legal": {"fr": "/mentions-legales.html", "en": "/en/legal-notice.html"},
        "404": {"fr": "/404.html", "en": "/en/404.html"},
    }[page]
    links = []
    for language in ("fr", "en"):
        current = ' aria-current="true"' if code == language else ""
        links.append(
            f'<a href="{paths[language]}" lang="{language}" '
            f'hreflang="{language}"{current} data-lang="{language}">'
            f"{language.upper()}</a>"
        )
    return (
        f'<nav class="language-switch" aria-label="{html.escape(aria_label, quote=True)}">'
        + "".join(links)
        + "</nav>"
    )


def replace_visible_text(source, original, translated):
    pattern = re.compile(r"\s+".join(re.escape(part) for part in original.split()))
    return pattern.sub(lambda _: html.escape(translated, quote=True), source)


def app_copyright(locale):
    return locale["app"]["ui"]["copyright"]


def save_dialog(app):
    ui, buttons = app["ui"], app["buttons"]
    return f'''<div class="dlg" id="dlg" hidden>
      <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dlg-title" tabindex="-1">
        <header class="dialog-head">
          <span class="dialog-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/></svg></span>
          <div><p class="dialog-kicker">{html.escape(ui["saveKicker"])}</p><h2 id="dlg-title">{html.escape(ui["saveTitle"])}</h2></div>
          <button class="dialog-close" type="button" data-close aria-label="{html.escape(buttons["close"], quote=True)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </header>
        <p class="dialog-intro">{html.escape(ui["saveHelp"])}</p>
        <div class="export-grid" aria-label="{html.escape(ui["exportOptions"], quote=True)}">
          <button class="export-option export-featured export-wide" data-x="pdf">
            <span class="export-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/></svg></span>
            <span class="export-copy"><strong>{html.escape(ui["print"])}</strong><small>{html.escape(ui["printDesc"])}</small></span><span class="export-arrow" aria-hidden="true">↗</span>
          </button>
          <button class="export-option export-wide" data-x="xlsx">
            <span class="export-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 9h16M4 14h16M10 4v16M15 4v16"/></svg></span>
            <span class="export-copy"><strong>{html.escape(ui["excel"])}</strong><small>{html.escape(ui["excelDesc"])}</small></span><span class="export-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
        <p class="dialog-message" id="msg" role="status" aria-live="polite"></p>
      </section>
    </div>'''


def share_dialog(app):
    ui, buttons = app["ui"], app["buttons"]
    return f'''<div class="dlg" id="dl2" hidden>
      <section class="dialog-card share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title" tabindex="-1">
        <header class="dialog-head">
          <span class="dialog-mark share-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/></svg></span>
          <div><p class="dialog-kicker">{html.escape(ui["shareKicker"])}</p><h2 id="share-title">{html.escape(ui["shareTitle"])}</h2></div>
          <button class="dialog-close" type="button" data-close aria-label="{html.escape(buttons["close"], quote=True)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </header>
        <p class="dialog-intro">{html.escape(ui["shareHelp"])}</p>
        <p class="share-privacy"><span aria-hidden="true">✓</span>{html.escape(ui["sharePrivacy"])}</p>
        <div class="share-grid" id="chs" aria-label="{html.escape(ui["shareOptions"], quote=True)}"></div>
        <div class="dialog-footer"><img src="/logo.svg" alt="" /><span>{html.escape(ui["brandSubtitle"])}</span></div>
      </section>
    </div>'''


def consent_dialog(app):
    ui = app["ui"]
    return f'''<div class="cs" id="cs" hidden>
      <span>{html.escape(ui["consent"])}</span>
      <button data-c="yes" class="pri">{html.escape(ui["accept"])}</button>
      <button data-c="no">{html.escape(ui["decline"])}</button>
    </div>'''


def build_index(code, locale, origin):
    source = (TEMPLATES / "index.html").read_text(encoding="utf-8")
    routes = {"fr": "/", "en": "/en/index.html"}
    base = origin.rstrip("/") + "/"
    source = replace_once(source, r'<html lang="[^"]*">', f'<html lang="{code}">')
    source = replace_once(source, r"<title>.*?</title>", f"<title>{html.escape(locale['meta']['title'])}</title>")
    source = replace_once(source, r'(<meta\s+name="description"\s+content=")[^"]*(")', rf'\g<1>{html.escape(locale["meta"]["description"], quote=True)}\2')
    source = replace_once(
        source,
        r'<meta\s+name="copyright"\s+content="[^"]*"\s*/?>',
        f'<meta name="copyright" content="{html.escape(app_copyright(locale), quote=True)}" />',
    )
    source, canonical = canonical_and_alternates(source, code, routes, base)

    source = replace_once(
        source,
        r'<meta property="og:locale" content="[^"]*"\s*/?>',
        f'<meta property="og:locale" content="{"fr_FR" if code == "fr" else "en_US"}" />',
    )
    active_locale = "fr_FR" if code == "fr" else "en_US"
    source = source.replace(
        f'<meta property="og:locale" content="{active_locale}" />',
        f'<meta property="og:locale" content="{active_locale}" />\n'
        + f'<meta property="og:locale:alternate" content="{"en_US" if code == "fr" else "fr_FR"}" />',
        1,
    )
    for prop in ('property="og:title"', 'name="twitter:title"'):
        source = replace_once(
            source,
            rf'<meta\s+{prop}\s+content="[^"]*"\s*/?>',
            f'<meta {prop} content="{html.escape(locale["meta"]["title"], quote=True)}" />',
        )
    for prop in ('property="og:description"', 'name="twitter:description"'):
        source = replace_once(
            source,
            rf'<meta\s+{prop}\s+content="[^"]*"\s*/?>',
            f'<meta {prop} content="{html.escape(locale["meta"]["description"], quote=True)}" />',
        )
    for prop in ('property="og:url"',):
        source = replace_once(source, rf'<meta\s+{prop}\s+content="[^"]*"\s*/?>', f'<meta {prop} content="{canonical}" />')
    image = urljoin(base, "og-image.png" if code == "fr" else "og-image-en.png")
    for prop in ('property="og:image"', 'name="twitter:image"'):
        source = replace_once(
            source,
            rf'<meta\s+{prop}\s+content="[^"]*"\s*/?>',
            f'<meta {prop} content="{image}" />',
        )
    source = replace_once(
        source,
        r'<script type="application/ld\+json">.*?</script>',
        '<script type="application/ld+json">\n'
        + json_ld({**locale, "language": code}, canonical)
        + "\n</script>",
    )

    app = locale["app"]
    text_map = {
        "Aller au contenu": app["ui"]["skip"],
        "Préparation Diversity Visa": app["ui"]["brandSubtitle"],
        "Atelier DV, accueil": app["ui"]["brandAria"],
        "Logo Atelier DV": app["ui"]["logoAria"],
        "Partager": app["buttons"]["share"],
        "Sauvegarder": app["buttons"]["save"],
        "Réinitialiser": app["buttons"]["reset"],
        "Étapes": app["ui"]["stepsAria"],
        "Fermer": app["buttons"]["close"],
    }
    for original, translated in sorted(text_map.items(), key=lambda entry: len(entry[0]), reverse=True):
        source = replace_visible_text(source, original, translated)
    source = replace_once(
        source,
        r'<div class="dlg" id="dlg" hidden>.*?(?=<div class="dlg" id="dl2")',
        save_dialog(app),
    )
    source = replace_once(
        source,
        r'<div class="dlg" id="dl2" hidden>.*?(?=<div class="cs" id="cs")',
        share_dialog(app),
    )
    source = replace_once(
        source,
        r'<div class="cs" id="cs" hidden>.*?</div>',
        consent_dialog(app),
    )
    source = source.replace(
        '<div id="lh">\n          <nav class="language-switch" aria-label="Langue">\n'
        '            <a href="/" lang="fr" hreflang="fr" aria-current="true">FR</a>\n'
        '            <a href="/en/index.html" lang="en" hreflang="en">EN</a>\n'
        "          </nav>\n        </div>",
        f'<div id="lh">{switcher(code, "index", app["ui"]["languageAria"])}</div>',
    )
    source = source.replace(
        'aria-label="Étapes"',
        f'aria-label="{html.escape(app["ui"]["stepsAria"], quote=True)}"',
    )
    source = replace_once(
        source,
        r"<noscript\s*>(.*?)</noscript\s*>",
        f'<noscript><div class="card" style="margin: 12px">{html.escape(app["ui"]["noScript"])}</div></noscript>',
    )
    faq_items = app["faq"]
    faq = (
        '    <section class="faq">\n'
        f'      <h2>{html.escape(app["ui"]["faqTitle"])}</h2>\n'
        + "\n".join(
            f'      <details><summary>{html.escape(question)}</summary>'
            f"<p>{html.escape(answer)}</p></details>"
            for question, answer in faq_items
        )
        + "\n    </section>"
    )
    source = replace_once(source, r'<section class="faq">.*?</section>', faq)

    prefix = "../" if code == "en" else ""
    source = source.replace('href="manifest.webmanifest"', 'href="manifest.webmanifest"')
    for asset in ("favicon.svg", "icon-192.png", "apple-touch-icon.png", "app.css", "config.js", "i18n.js", "workbook-export.js", "app.js"):
        source = source.replace(f'"{asset}"', f'"{prefix}{asset}"')
    source = source.replace(
        '<script src="config.js"></script>',
        f'<script src="{prefix}config.js"></script>',
    )
    destination = ROOT / ("index.html" if code == "fr" else "en/index.html")
    destination.write_text(source, encoding="utf-8")


def configure_page(source, code, page, title, description, canonical, origin):
    source = replace_once(source, r'<html lang="[^"]*">', f'<html lang="{code}">')
    source = replace_once(source, r"<title>.*?</title>", f"<title>{html.escape(title)}</title>")
    source = replace_once(
        source,
        r'(<meta\s+name="description"\s+content=")[^"]*(")',
        rf'\g<1>{html.escape(description, quote=True)}\2',
    )
    routes = {
        "privacy": {"fr": "/confidentialite.html", "en": "/en/privacy.html"},
        "legal": {"fr": "/mentions-legales.html", "en": "/en/legal-notice.html"},
        "404": {"fr": "/404.html", "en": "/en/404.html"},
    }[page]
    source = replace_once(
        source,
        r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>',
        f'<link rel="canonical" href="{html.escape(canonical, quote=True)}" />',
    )
    alternate_tags = "\n".join(
        f'<link rel="alternate" hreflang="{hreflang}" href="{urljoin(origin, route)}" />'
        for hreflang, route in [("fr", routes["fr"]), ("en", routes["en"]), ("x-default", routes["fr"])]
    )
    source = source.replace("</head>", f"    {alternate_tags}\n  </head>", 1)
    source = source.replace("<body>", f"<body>\n    {switcher(code, page, 'Langue' if code == 'fr' else 'Language')}", 1)
    source = source.replace("href=\"./\"", f'href="{"/" if code == "fr" else "/en/index.html"}"')
    source = source.replace('href="confidentialite.html"', 'href="/confidentialite.html"' if code == "fr" else 'href="/en/privacy.html"')
    source = source.replace('href="mentions-legales.html"', 'href="/mentions-legales.html"' if code == "fr" else 'href="/en/legal-notice.html"')
    prefix = "../" if code == "en" else ""
    source = source.replace('href="favicon.svg"', f'href="{prefix}favicon.svg"')
    source = source.replace('src="logo.svg"', f'src="{prefix}logo.svg"')
    if code == "en":
        source = replace_visible_text(source, "Tous droits réservés.", "All rights reserved.")
    source = source.replace(
        "</head>",
        f'    <script src="{"../" if code == "en" else ""}i18n.js"></script>\n'
        f'    <meta property="og:title" content="{html.escape(title, quote=True)}" />\n'
        '    <meta property="og:type" content="website" />\n'
        '    <meta property="og:site_name" content="Atelier DV" />\n'
        f'    <meta property="og:description" content="{html.escape(description, quote=True)}" />\n'
        f'    <meta property="og:url" content="{html.escape(canonical, quote=True)}" />\n'
        f'    <meta property="og:locale" content="{"fr_FR" if code == "fr" else "en_US"}" />\n'
        f'    <meta property="og:locale:alternate" content="{"en_US" if code == "fr" else "fr_FR"}" />\n'
        f'    <meta property="og:image" content="{urljoin(origin, "og-image.png" if code == "fr" else "og-image-en.png")}" />\n'
        '    <meta name="twitter:card" content="summary_large_image" />\n'
        f'    <meta name="twitter:title" content="{html.escape(title, quote=True)}" />\n'
        f'    <meta name="twitter:description" content="{html.escape(description, quote=True)}" />\n'
        f'    <meta name="twitter:image" content="{urljoin(origin, "og-image.png" if code == "fr" else "og-image-en.png")}" />\n'
        "  </head>",
        1,
    )
    return source


def legal_content(page, code, email):
    if page == "privacy" and code == "en":
        return f"""
        <h1>Privacy Policy</h1>
        <div class="card">
          <p class="mu">Last updated: October 21, 2026.</p>
          <h2>1. Publisher</h2>
          <p>Atelier DV is published by Remy A. (Cybersecurity Analyst &amp; Developer). Contact: <a href="mailto:{html.escape(email, quote=True)}">{html.escape(email)}</a>.</p>
          <h2>2. Your entry information stays with you</h2>
          <p>Everything you enter (identity, family, address, passport, etc.) is stored only in your browser’s local storage. It is not sent to our servers, and we cannot access it. Photos are analyzed on your device (format, dimensions and file size): the file is neither uploaded nor retained; only its technical characteristics are stored. The “Reset” button or clearing this site’s data in your browser erases everything.</p>
          <h2>3. Exports, backups and sharing</h2>
          <p>Exports (Excel, CSV, PDF and JSON) are generated on your device. Excel export loads the SheetJS library from the cdnjs (Cloudflare) CDN, which exposes your IP address to that service. These files contain personal information; protect them. Sharing buttons send only the tool’s link, never your entry information; they open the relevant third-party services (WhatsApp, Telegram, etc.), which are governed by their own policies.</p>
          <h2>4. Analytics</h2>
          <p>If enabled, analytics (Google Analytics 4 or cookie-free Plausible) is loaded only after your consent for Google Analytics. Only anonymous events are collected (tab viewed, export, share and language switch), including the active language; never the contents of your entry information, with IP anonymization. You can change your choice at any time using the “Analytics” link at the bottom of the page.</p>
          <h2>5. Hosting and technical logs</h2>
          <p>The hosting provider may record technical logs (IP address, date and pages requested) to ensure the service’s security and operation.</p>
          <h2>6. Your rights</h2>
          <p>Under Togolese Law No. 2019-014 of October 29, 2019 on the protection of personal data and, where applicable, the GDPR, you have rights of access, rectification, erasure and objection. Because the publisher does not hold your entry information, you exercise these rights directly on your device; for analytics data, contact us. You may contact the data-protection authority in your country.</p>
          <h2>7. Security</h2>
          <p>The site is served over HTTPS with security headers. Preferably use a personal device and do not share exported files.</p>
        </div>"""
    if page == "legal" and code == "en":
        return f"""
        <h1>Legal Notice &amp; Terms of Use</h1>
        <div class="card">
          <p class="mu">Last updated: October 22, 2026.</p>
          <h2>Publisher</h2>
          <p>Remy A., Cybersecurity Analyst &amp; Developer. Publication director: Remy A. — <span class="todo">Lomé, Togo</span>. Contact: <a href="mailto:{html.escape(email, quote=True)}">{html.escape(email)}</a>.</p>
          <h2>Hosting provider</h2>
          <p><span class="todo">Render Services, Inc., 525 Brannan Street, Suite 300, San Francisco, CA 94107, United States</span></p>
          <h2>Purpose of the tool and non-affiliation</h2>
          <p>Atelier DV is a preparation aid. It does not submit an entry, collect any draw-related payment or guarantee selection. It is not affiliated with, endorsed by or sponsored by the U.S. Department of State or the U.S. government. The only official entry website is dvprogram.state.gov: beware of anyone promising to “guarantee” or “increase” your chances.</p>
          <h2>No legal advice</h2>
          <p>The information provided is general, may change and does not constitute legal advice. The official instructions for each program year take precedence. For an individual situation, consult a qualified attorney.</p>
          <h2>Intellectual property</h2>
          <p>© 2026 Remy A. All rights reserved. Atelier DV’s code, text, logo and visual identity are protected by copyright. Reproduction, modification or distribution without prior written permission is prohibited. Names and trademarks mentioned belong to their respective owners. Third-party component: SheetJS (Apache-2.0 license), loaded on demand for Excel export.</p>
          <h2>Terms of use</h2>
          <p>The tool is provided free of charge, “as is,” without any guarantee of accuracy or completeness. You remain solely responsible for the accuracy of information you declare and for following the official instructions. The publisher cannot be held liable for a refusal, disqualification or loss resulting from use of the tool. External links do not imply the publisher’s endorsement.</p>
          <h2>Applicable law</h2>
          <p>Togolese law, subject to mandatory consumer-protection provisions applicable in your country of residence. <span class="todo">[to be confirmed by the publisher]</span></p>
        </div>"""
    return None


def build_legal_pages(origin, email):
    sources = {
        "privacy": ("privacy.html", "confidentialite.html", "privacy", "Privacy Policy"),
        "legal": ("legal-notice.html", "mentions-legales.html", "legal", "Legal Notice & Terms of Use"),
    }
    locales = {
        "privacy": {
            "fr": ("Politique de confidentialité", "Comment Atelier DV traite vos données : stockage local, mesure d’audience anonyme, vos droits."),
            "en": ("Privacy Policy", "How Atelier DV handles your data: local storage, anonymous analytics and your rights."),
        },
        "legal": {
            "fr": ("Mentions légales et conditions d’utilisation", "Éditeur, propriété intellectuelle, non-affiliation et conditions d’utilisation d’Atelier DV."),
            "en": ("Legal Notice & Terms of Use", "Publisher, intellectual property, non-affiliation and terms of use for Atelier DV."),
        },
    }
    routes = {
        "privacy": {"fr": "/confidentialite.html", "en": "/en/privacy.html"},
        "legal": {"fr": "/mentions-legales.html", "en": "/en/legal-notice.html"},
    }
    for page, (filename, french_filename, page_key, _) in sources.items():
        for code in ("fr", "en"):
            template = (TEMPLATES / filename).read_text(encoding="utf-8")
            title, description = locales[page][code]
            template = template.replace("CONTACT_EMAIL", email)
            if code == "en":
                content = legal_content(page, code, email)
                template = replace_once(template, r'<h1>.*?</h1>\s*<div class="card">.*?</div>', content)
                template = template.replace("© 2026 Remy A. · Cybersecurity Analyst & Developer. Tous droits réservés.", "© 2026 Remy A. · Cybersecurity Analyst & Developer. All rights reserved.")
                template = template.replace("Retour à l’outil", "Back to the tool")
                template = template.replace("Confidentialité", "Privacy")
                template = template.replace("Mentions légales et conditions", "Legal Notice &amp; Terms of Use")
            template = configure_page(
                template,
                code,
                page_key,
                title,
                description,
                urljoin(origin, routes[page][code]),
                origin,
            )
            destination = ROOT / (
                french_filename if code == "fr" else f"en/{filename}"
            )
            destination.write_text(template, encoding="utf-8")


def build_404(origin):
    source = (TEMPLATES / "404.html").read_text(encoding="utf-8")
    text = {
        "fr": ("Page introuvable", "Cette page n’existe pas ou a été déplacée.", "Retour à l’outil"),
        "en": ("Page not found", "This page does not exist or has been moved.", "Back to the tool"),
    }
    routes = {"fr": "/404.html", "en": "/en/404.html"}
    for code, (title, description, back) in text.items():
        page = replace_once(source, r'<html lang="[^"]*">', f'<html lang="{code}">')
        page = page.replace("Page introuvable", title)
        page = page.replace("Cette page n’existe pas ou a été déplacée.", description)
        page = page.replace("Retour à l’outil", back)
        page = page.replace("Page introuvable · Atelier DV", f"{title} · Atelier DV")
        page = page.replace('href="./"', f'href="{"/" if code == "fr" else "/en/index.html"}"')
        page = page.replace(
            'src="logo.svg"',
            f'src="{"../" if code == "en" else ""}logo.svg"',
        )
        page = page.replace('href="favicon.svg"', f'href="{"../" if code == "en" else ""}favicon.svg"')
        page = page.replace(
            "</head>",
            f'<link rel="canonical" href="{urljoin(origin, routes[code])}" />'
            f'<meta name="description" content="{description}" />'
            f'<meta property="og:locale" content="{"fr_FR" if code == "fr" else "en_US"}" />'
            f'<meta property="og:locale:alternate" content="{"en_US" if code == "fr" else "fr_FR"}" />'
            f'<meta property="og:title" content="{title} · Atelier DV" />'
            f'<meta property="og:description" content="{description}" />'
            f'<meta property="og:url" content="{urljoin(origin, routes[code])}" />'
            f'<meta property="og:image" content="{urljoin(origin, "og-image.png" if code == "fr" else "og-image-en.png")}" />'
            f'<meta name="twitter:card" content="summary_large_image" />'
            f'<meta name="twitter:title" content="{title} · Atelier DV" />'
            f'<meta name="twitter:description" content="{description}" />'
            f'<meta name="twitter:image" content="{urljoin(origin, "og-image.png" if code == "fr" else "og-image-en.png")}" />\n</head>',
        )
        page = page.replace(
            "</head>",
            f'<script src="{"../" if code == "en" else ""}i18n.js"></script>\n'
            f'<link rel="alternate" hreflang="fr" href="{urljoin(origin, "/404.html")}" />'
            f'<link rel="alternate" hreflang="en" href="{urljoin(origin, "/en/404.html")}" />'
            f'<link rel="alternate" hreflang="x-default" href="{urljoin(origin, "/404.html")}" />\n</head>',
        )
        page = page.replace("<body>", f'<body>\n{switcher(code, "404", "Language" if code == "en" else "Langue")}')
        privacy_path = "/confidentialite.html" if code == "fr" else "/en/privacy.html"
        legal_path = "/mentions-legales.html" if code == "fr" else "/en/legal-notice.html"
        privacy_label = "Confidentialité" if code == "fr" else "Privacy"
        legal_label = "Mentions légales et conditions" if code == "fr" else "Legal Notice &amp; Terms of Use"
        rights_label = "Tous droits réservés." if code == "fr" else "All rights reserved."
        page = page.replace(
            "    </main>",
            f'      <footer class="mu">© 2026 Remy A. · Cybersecurity Analyst &amp; Developer. {rights_label} '
            f'<a href="{privacy_path}">{privacy_label}</a> · '
            f'<a href="{legal_path}">{legal_label}</a>'
            '</footer>\n    </main>',
        )
        destination = ROOT / ("404.html" if code == "fr" else "en/404.html")
        destination.write_text(page, encoding="utf-8")


def build_manifests():
    data = json.loads((TEMPLATES / "manifest.webmanifest").read_text(encoding="utf-8"))
    for code, name, short, description, prefix in [
        ("fr", "Atelier DV · Préparation Diversity Visa", "Atelier DV", load_locale("fr")["meta"]["description"], ""),
        ("en", "Atelier DV · Diversity Visa preparation", "Atelier DV", load_locale("en")["meta"]["description"], "../"),
    ]:
        manifest = dict(data)
        manifest.update(
            name=name,
            short_name=short,
            description=description,
            lang=code,
            start_url="./" if code == "fr" else "./index.html",
            scope="./",
            icons=[
                {**icon, "src": prefix + icon["src"]}
                for icon in data["icons"]
            ],
        )
        output = ROOT / ("manifest.webmanifest" if code == "fr" else "en/manifest.webmanifest")
        output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_sitemap(origin):
    pairs = [
        ("/", "/en/index.html", "weekly", "1.0"),
        ("/confidentialite.html", "/en/privacy.html", "yearly", "0.3"),
        ("/mentions-legales.html", "/en/legal-notice.html", "yearly", "0.3"),
    ]
    rows = ['<?xml version="1.0" encoding="UTF-8"?>']
    rows.append(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    )
    for fr_path, en_path, frequency, priority in pairs:
        for language, path in [("fr", fr_path), ("en", en_path)]:
            rows.extend(
                [
                    "  <url>",
                    f"    <loc>{html.escape(urljoin(origin, path))}</loc>",
                    f'    <xhtml:link rel="alternate" hreflang="fr" href="{html.escape(urljoin(origin, fr_path))}" />',
                    f'    <xhtml:link rel="alternate" hreflang="en" href="{html.escape(urljoin(origin, en_path))}" />',
                    f'    <xhtml:link rel="alternate" hreflang="x-default" href="{html.escape(urljoin(origin, fr_path))}" />',
                    f"    <changefreq>{frequency}</changefreq>",
                    f"    <priority>{priority}</priority>",
                    "  </url>",
                ]
            )
    rows.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(rows) + "\n", encoding="utf-8")
    ElementTree.parse(ROOT / "sitemap.xml")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin")
    parser.add_argument("--email")
    args = parser.parse_args()
    origin = args.origin
    if not origin:
        canonical = re.search(
            r'<link rel="canonical" href="(https?://[^"]+)/?"',
            (TEMPLATES / "index.html").read_text(encoding="utf-8"),
        )
        origin = canonical.group(1).rstrip("/") if canonical else "https://win-dv.onrender.com"
    origin = origin.rstrip("/") + "/"
    email_match = re.search(
        r'href="mailto:([^"]+)"',
        (TEMPLATES / "privacy.html").read_text(encoding="utf-8"),
    )
    email = args.email or (email_match.group(1) if email_match else "CONTACT_EMAIL")
    for code in ("fr", "en"):
        build_index(code, load_locale(code), origin)
    build_legal_pages(origin, email)
    build_404(origin)
    build_manifests()
    build_sitemap(origin)


if __name__ == "__main__":
    main()
