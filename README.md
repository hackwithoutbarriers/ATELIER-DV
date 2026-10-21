# Atelier DV, outil de préparation Diversity Visa
© 2026 Remy A. (Cybersecurity Analyst & Developer). Tous droits réservés (voir `LICENSE`).

Site statique (HTML + JS, sans build), installable (PWA) et utilisable hors ligne. Les données saisies restent dans le navigateur de chaque utilisateur.

## Contenu
- `index.html` : l’application (+ FAQ visible par les moteurs de recherche, données structurées)
- `config.js` : réglages réservés à l’administrateur (date repère, bandeau d’annonce, analytics, auteur, contact)
- `confidentialite.html`, `mentions-legales.html`, `404.html` : pages légales
- `logo.svg`, `favicon.svg`, `favicon.ico`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `og-image.png` : identité visuelle
- `manifest.webmanifest`, `sw.js` : application installable et hors ligne
- `robots.txt`, `sitemap.xml`, `.well-known/security.txt` : référencement et sécurité
- `vercel.json`, `render.yaml` : déploiement et en-têtes de sécurité (CSP, HSTS…)
- `configure.py` : remplace l’URL et l’e-mail provisoires

## Mise en ligne en 5 étapes
1. Déployez (voir ci-dessous) pour obtenir votre URL (ou branchez votre nom de domaine).
2. Lancez : `python3 configure.py https://votre-domaine.tld contact@votre-domaine.tld`
3. Complétez les champs surlignés dans `mentions-legales.html` (statut, adresse, hébergeur) et gardez l’hébergeur réellement utilisé.
4. Dans `config.js`, renseignez au besoin `ga` (G-XXXXXXXXXX) ou `plausible`, et `authorUrl`.
5. Commit + push : le site se redéploie.

### Vercel
Import du dépôt GitHub > Framework « Other » > aucune commande de build > dossier racine `./` > Deploy.
### Render
New > Static Site (ou Blueprint avec `render.yaml`) > build command vide > publish directory `.`

## Référencement
- Google Search Console : ajoutez la propriété, vérifiez le domaine, soumettez `/sitemap.xml`. Faites de même dans Bing Webmaster Tools.
- Testez l’aperçu de partage (WhatsApp, Facebook Sharing Debugger) après avoir lancé `configure.py` : l’image `og-image.png` doit être accessible en HTTPS.
- Les données structurées (WebApplication, FAQPage) sont dans `index.html`.

## Identité visuelle
- Couleurs : bleu principal `#1f4e9c`, bleu profond `#143a75`, accent ambre `#f2a900`, fond clair `#f3f5f9`.
- Logo : boussole (orientation dans la démarche) sur carré arrondi dégradé bleu ; aiguille ambre.
- Typographie : police système (rapide, sans dépendance externe).

## Mettre à jour la date repère ou l’annonce officielle
Modifiez `ref` et/ou `banner` dans `config.js`, commit, push.

## Analytics
- Google Analytics 4 : collez l’ID dans `ga`. Chargé uniquement après consentement (bandeau intégré, lien « Mesure d’audience » en pied de page). Événements anonymes : `tab_view`, `export`, `share`.
- Alternative sans cookie : Plausible (`plausible: "votre-domaine"`).

## À faire valider
- Les pages légales sont des modèles à relire (idéalement par un juriste) : loi togolaise n° 2019-014, RGPD, droit applicable.
- Si vous collectez des dossiers d’autres personnes, obtenez leur consentement ; l’e-mail et le numéro de confirmation doivent rester ceux du candidat.
