#!/usr/bin/env python3
"""Configure both language versions: python configure.py https://example.com email@example.com"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def set_if_blank(path, pattern, replacement):
    text = path.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, text, count=1)
    if count and updated != text:
        path.write_text(updated, encoding="utf-8")


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    origin, email = sys.argv[1].rstrip("/"), sys.argv[2].strip()
    if not re.fullmatch(r"https?://[^/]+", origin):
        raise SystemExit("The canonical site URL must be an http(s) origin without a path.")
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise SystemExit("Provide a valid contact email address.")

    for path in [
        ROOT / "templates" / "index.html",
        ROOT / "templates" / "privacy.html",
        ROOT / "templates" / "legal-notice.html",
    ]:
        text = path.read_text(encoding="utf-8")
        text = re.sub(r"https://win-dv\.onrender\.com", origin, text)
        text = text.replace("CONTACT_EMAIL", email)
        path.write_text(text, encoding="utf-8")

    config = ROOT / "config.js"
    set_if_blank(
        config,
        r'siteUrl:\s*""',
        f'siteUrl: "{origin}"',
    )
    set_if_blank(
        config,
        r'contactEmail:\s*""',
        f'contactEmail: "{email}"',
    )

    robots = ROOT / "robots.txt"
    robots_text = robots.read_text(encoding="utf-8")
    robots.write_text(
        re.sub(r"(?m)^Sitemap: .*", f"Sitemap: {origin}/sitemap.xml", robots_text),
        encoding="utf-8",
    )

    security = ROOT / ".well-known" / "security.txt"
    security_text = security.read_text(encoding="utf-8")
    security_text = re.sub(r"(?m)^Contact: .*", f"Contact: mailto:{email}", security_text)
    security_text = re.sub(r"(?m)^Canonical: .*", f"Canonical: {origin}/.well-known/security.txt", security_text)
    security.write_text(security_text, encoding="utf-8")

    for template in [
        ROOT / "templates" / "privacy.html",
        ROOT / "templates" / "legal-notice.html",
    ]:
        text = template.read_text(encoding="utf-8")
        text = re.sub(r'href="mailto:[^"]+"', f'href="mailto:{email}"', text)
        text = re.sub(r">[^<>\s]+@[^<>\s]+</a>", f">{email}</a>", text)
        template.write_text(text, encoding="utf-8")

    subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "build-i18n.py"),
            "--origin",
            origin,
            "--email",
            email,
        ],
        cwd=ROOT,
        check=True,
    )
    print(f"Configured French and English pages for {origin}; contact: {email}")


if __name__ == "__main__":
    main()
