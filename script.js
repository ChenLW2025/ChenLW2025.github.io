(() => {
  "use strict";
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
  const languageButton = document.querySelector(".language-switch");
  const translations = [...document.querySelectorAll("[data-zh]")].map(element => ({element, english: element.innerHTML}));
  const accessibleTranslations = [...document.querySelectorAll("[data-aria-zh], [data-alt-zh]")].map(element => ({element, label: element.getAttribute("aria-label"), alt: element.getAttribute("alt")}));
  const descriptions = {
    en: "Linwei Chen (陈林蔚), master's student at Nanjing University. Research in robust multimodal learning, robot perception, and smart agriculture.",
    zh: "陈林蔚，南京大学控制科学与智能工程硕士研究生。研究方向包括稳健多模态学习、机器人感知与智慧农业。"
  };
  let language = "en";
  function setLanguage(next, updateUrl = false) {
    language = next === "zh" ? "zh" : "en";
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    translations.forEach(({element, english}) => {
      if (language === "zh") element.textContent = element.dataset.zh;
      else element.innerHTML = english;
    });
    accessibleTranslations.forEach(({element, label, alt}) => {
      if (label) element.setAttribute("aria-label", language === "zh" ? element.dataset.ariaZh : label);
      if (alt) element.setAttribute("alt", language === "zh" ? element.dataset.altZh : alt);
    });
    const degree = document.querySelector(".hero-name span[lang]");
    if (degree) degree.lang = language === "zh" ? "zh-CN" : "en";
    languageButton.textContent = language === "zh" ? "EN ↗" : "中文 ↗";
    languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文 / Switch to Chinese");
    languageButton.lang = language === "zh" ? "en" : "zh-CN";
    document.title = language === "zh" ? "陈林蔚 · Linwei Chen | 南京大学" : "Linwei Chen · 陈林蔚 | Nanjing University";
    document.querySelector('meta[name="description"]').content = descriptions[language];
    if (updateUrl) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", language);
        history.replaceState(null, "", url);
      } catch { /* Direct file previews still work without URL updates. */ }
    }
    try { localStorage.setItem("site-language", language); } catch { /* Storage is optional. */ }
    updateActiveSection();
  }
  if (languageButton) {
    languageButton.hidden = false;
    let savedLanguage;
    try { savedLanguage = localStorage.getItem("site-language"); } catch { /* Default to English. */ }
    const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
    const browserLanguage = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
    const initialLanguage = [requestedLanguage, savedLanguage, browserLanguage].find(value => value === "zh" || value === "en");
    languageButton.addEventListener("click", () => setLanguage(language === "en" ? "zh" : "en", true));
    // Initialize after navigation references have been collected below.
    language = initialLanguage;
  }
  const status = document.querySelector("#copy-status");
  document.querySelectorAll("[data-copy], [data-copy-text]").forEach(button => {
    if (!navigator.clipboard?.writeText) return;
    button.hidden = false;
    button.addEventListener("click", async () => {
      const value = button.dataset.copyText || document.getElementById(button.dataset.copy)?.textContent;
      if (!value) return;
      status.textContent = "";
      try {
        await navigator.clipboard.writeText(value.trim());
        status.textContent = language === "zh" ? "已复制到剪贴板。" : "Copied to clipboard.";
        button.textContent = language === "zh" ? "已复制 ✓" : "Copied ✓";
      } catch {
        status.textContent = language === "zh" ? "复制未成功，请手动选择文本或下载引用。" : "Copy unavailable. Select the text or download the citation.";
        button.textContent = language === "zh" ? "请手动复制" : "Select text to copy";
      }
      window.setTimeout(() => {
        const original = translations.find(item => item.element === button);
        button.textContent = language === "zh" ? button.dataset.zh : original.english;
      }, 2200);
    });
  });
  const links = [...document.querySelectorAll(".main-nav a")];
  const sections = links.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const header = document.querySelector(".site-header");
  let scheduled = false;
  function updateActiveSection() {
    const headerHeight = header?.getBoundingClientRect().height || 94;
    document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    let current = null;
    sections.forEach(section => { if (section.getBoundingClientRect().top <= headerHeight + 32) current = section.id; });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 12) current = "contact";
    links.forEach(link => {
      if (link.hash === `#${current}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    scheduled = false;
  }
  window.addEventListener("scroll", () => {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateActiveSection); }
  }, {passive: true});
  window.addEventListener("resize", updateActiveSection);
  window.addEventListener("load", updateActiveSection);
  window.addEventListener("hashchange", updateActiveSection);
  if ("ResizeObserver" in window && header) new ResizeObserver(updateActiveSection).observe(header);
  if (languageButton) setLanguage(language);
  updateActiveSection();
})();
