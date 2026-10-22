(() => {
  const lang = document.documentElement.lang === "en" ? "en" : "fr";
  let messages = {};
  const load = async (locale) => {
    const response = await fetch(new URL(`/lang/${locale}.json`, location.origin));
    if (!response.ok) throw new Error(`Unable to load ${locale} translations`);
    return response.json();
  };
  const ready = Promise.all([load(lang), load("fr")]).then(([active, french]) => {
    messages = active;
    window.DV_I18N_LEGACY_CHECKLIST = french.app.checklist;
    window.DV_I18N_LEGACY = french.app.legacy;
  });
  const lookup = (key) =>
    key.split(".").reduce((value, part) => value?.[part], messages);
  const t = (key, vars = {}) => {
    const value = lookup(key);
    if (typeof value !== "string") {
      throw new Error(`Missing ${lang} translation: ${key}`);
    }
    const translated = value.replace(
      /\{(\w+)\}/g,
      (_, name) => String(vars[name] ?? ""),
    );
    return lang === "fr"
      ? translated
          .replace(/[ \t]+([:;!?%])/g, "\u00a0$1")
          .replace(/[ \t]+«/g, "\u00a0«")
          .replace(/»[ \t]+/g, "»\u00a0")
      : translated;
  };
  const plural = (key, n, vars = {}) => {
    const category = new Intl.PluralRules(lang).select(n);
    return t(`${key}.${category}`, { ...vars, count: n });
  };
  const fmtDate = (iso) => {
    if (!iso) return "";
    const date = new Date(`${iso}T00:00:00`);
    return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", {
      day: "2-digit",
      month: lang === "fr" ? "2-digit" : "short",
      year: "numeric",
    }).format(date);
  };
  window.DV_I18N = { lang, t, plural, fmtDate };
  window.DV_I18N_READY = ready;
  let preferredLanguage = null;
  try {
    preferredLanguage = localStorage.getItem("dv-lang");
  } catch (error) {
    console.warn("Unable to read the saved language preference", error);
  }
  if (preferredLanguage === "en" && lang === "fr") {
    const pageMap = {
      "/": "/en/index.html",
      "/index.html": "/en/index.html",
      "/confidentialite.html": "/en/privacy.html",
      "/mentions-legales.html": "/en/legal-notice.html",
      "/404.html": "/en/404.html",
    };
    const target = pageMap[location.pathname];
    if (target) location.replace(`${target}${location.hash}`);
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-lang]");
    if (!link) return;
    try {
      localStorage.setItem("dv-lang", link.dataset.lang);
    } catch (error) {
      console.warn("Unable to save the language preference", error);
    }
    if (location.hash && !link.hash) {
      link.href += location.hash;
    }
    window.dispatchEvent(
      new CustomEvent("dv-language-switch", {
        detail: { from: lang, to: link.dataset.lang },
      }),
    );
  });
})();
