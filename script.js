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
    resetCopyFeedback();
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
    const alternateName = document.querySelector("#alternate-name");
    if (alternateName) alternateName.lang = language === "zh" ? "en" : "zh-CN";
    const languageLabel = languageButton.querySelector("#language-label");
    languageLabel.textContent = language === "zh" ? "EN" : "中文";
    languageLabel.lang = language === "zh" ? "en" : "zh-CN";
    languageButton.setAttribute("aria-label", language === "zh" ? "切换为英文" : "Switch to Chinese");
    languageButton.lang = document.documentElement.lang;
    document.title = language === "zh" ? "陈林蔚 · Linwei Chen | 南京大学" : "Linwei Chen · 陈林蔚 | Nanjing University";
    document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach(meta => {
      meta.content = descriptions[language];
    });
    document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach(meta => {
      meta.content = document.title;
    });
    const locale = document.querySelector('meta[property="og:locale"]');
    const alternateLocale = document.querySelector('meta[property="og:locale:alternate"]');
    if (locale) locale.content = language === "zh" ? "zh_CN" : "en_US";
    if (alternateLocale) alternateLocale.content = language === "zh" ? "en_US" : "zh_CN";
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
  const copyButtons = [...document.querySelectorAll("[data-copy], [data-copy-text]")];
  let statusTimer;
  let copyRequest = 0;
  const buttonTimers = new WeakMap();
  function clearCopyStatus() {
    window.clearTimeout(statusTimer);
    if (status) status.textContent = "";
  }
  function restoreCopyButton(button) {
    const original = translations.find(item => item.element === button);
    if (language === "zh" && button.dataset.zh) button.textContent = button.dataset.zh;
    else if (original) button.innerHTML = original.english;
  }
  function resetCopyFeedback() {
    copyRequest += 1;
    clearCopyStatus();
    copyButtons.forEach(button => {
      window.clearTimeout(buttonTimers.get(button));
      buttonTimers.delete(button);
      restoreCopyButton(button);
    });
  }
  document.addEventListener("copy", clearCopyStatus);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") clearCopyStatus();
  });
  copyButtons.forEach(button => {
    button.hidden = false;
    button.addEventListener("click", async () => {
      const value = button.dataset.copyText || document.getElementById(button.dataset.copy)?.textContent;
      if (!value) return;
      resetCopyFeedback();
      const request = copyRequest;
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(value.trim());
        if (request !== copyRequest) return;
        status.textContent = language === "zh" ? "已复制到剪贴板。" : "Copied to clipboard.";
        button.textContent = language === "zh" ? "已复制 ✓" : "Copied ✓";
        statusTimer = window.setTimeout(clearCopyStatus, 2800);
      } catch {
        if (request !== copyRequest) return;
        const target = document.getElementById(button.dataset.copy || button.dataset.copySelect);
        const selection = window.getSelection();
        if (target && selection) {
          const range = document.createRange();
          range.selectNodeContents(target);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        status.textContent = language === "zh" ? "自动复制不可用，文本已选中。请使用系统复制。" : "Automatic copy unavailable. Text selected: use your device's Copy command.";
        if (button.dataset.copy) status.textContent += language === "zh" ? "也可下载 .bib 文件。" : " You can also download the .bib file.";
        button.textContent = language === "zh" ? "文本已选中" : "Text selected";
      }
      buttonTimers.set(button, window.setTimeout(() => {
        if (request === copyRequest) restoreCopyButton(button);
        buttonTimers.delete(button);
      }, 2800));
    });
  });
  const links = [...document.querySelectorAll(".main-nav a")];
  const sections = links.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const header = document.querySelector(".site-header");
  let scheduled = false;
  function updateActiveSection() {
    const headerHeight = header?.getBoundingClientRect().height || 78;
    document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    const positions = sections.map(section => ({section, rect: section.getBoundingClientRect()}));
    positions.sort((a, b) => a.rect.top - b.rect.top);
    let current = null;
    if (window.scrollY > 1) {
      positions.forEach(({section, rect}) => { if (rect.top <= headerHeight + 32) current = section.id; });
      const contact = positions.find(({section}) => section.id === "contact");
      const contactVisible = contact && contact.rect.top < window.innerHeight && contact.rect.bottom > headerHeight;
      if (contactVisible && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 12) current = "contact";
    }
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
