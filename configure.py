#!/usr/bin/env python3
"""Usage : python3 configure.py https://votre-domaine.tld contact@votre-domaine.tld
Remplace les valeurs provisoires (URL canonique, sitemap, robots, e-mail de contact) dans tous les fichiers."""
import sys, os
if len(sys.argv) != 3: sys.exit(__doc__)
dom, mail = sys.argv[1].rstrip('/'), sys.argv[2]
for root, _, files in os.walk('.'):
    for f in files:
        if f.endswith(('.html', '.xml', '.txt', '.webmanifest', '.js', '.md')) and f != 'configure.py':
            p = os.path.join(root, f); t = open(p, encoding='utf-8').read(); n = t.replace('https://win-dv.onrender.com', dom).replace('CONTACT_EMAIL', mail)
            if f == 'config.js': n = n.replace('siteUrl: ""', 'siteUrl: "%s"' % dom).replace('contactEmail: ""', 'contactEmail: "%s"' % mail)
            if n != t: open(p, 'w', encoding='utf-8').write(n)
print('OK : ', dom, mail)
