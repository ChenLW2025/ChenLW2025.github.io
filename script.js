(() => {
  "use strict";
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
  // Older shared links still open the English page without a language option.
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.delete("lang");
      history.replaceState(history.state, "", url);
    }
  } catch { /* Direct file previews still work without URL updates. */ }
  const status = document.querySelector("#copy-status");
  const copyButtons = [...document.querySelectorAll("[data-copy], [data-copy-text]")];
  const copyButtonLabels = new Map(copyButtons.map(button => [button, button.innerHTML]));
  let statusTimer;
  let copyRequest = 0;
  const buttonTimers = new WeakMap();
  function clearCopyStatus() {
    window.clearTimeout(statusTimer);
    if (status) status.textContent = "";
  }
  function restoreCopyButton(button) {
    const original = copyButtonLabels.get(button);
    if (original !== undefined) button.innerHTML = original;
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
        status.textContent = "Copied to clipboard.";
        button.textContent = "Copied ✓";
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
        status.textContent = "Automatic copy unavailable. Text selected: use your device's Copy command.";
        if (button.dataset.copy) status.textContent += " You can also download the .bib file.";
        button.textContent = "Text selected";
      }
      buttonTimers.set(button, window.setTimeout(() => {
        if (request === copyRequest) restoreCopyButton(button);
        buttonTimers.delete(button);
      }, 2800));
    });
  });

  const frameworkDialog = document.querySelector("#framework-dialog");
  if (frameworkDialog && typeof frameworkDialog.showModal === "function") {
    let figureTrigger = null;
    let previousBodyOverflow = null;
    let pointerStartedOutside = false;
    const overflowProperties = ["overflow", "overflow-x", "overflow-y"];

    function restoreFigureState() {
      if (frameworkDialog.open || previousBodyOverflow === null) return;
      document.body.style.removeProperty("overflow");
      previousBodyOverflow.forEach(([property, value, priority]) => {
        document.body.style.setProperty(property, value, priority);
      });
      previousBodyOverflow = null;
      pointerStartedOutside = false;
      const trigger = figureTrigger;
      figureTrigger = null;
      if (trigger?.isConnected) {
        trigger.focus({preventScroll: true});
        const rect = trigger.getBoundingClientRect();
        const headerBottom = Math.max(0, document.querySelector(".site-header")?.getBoundingClientRect().bottom || 0);
        // Preserve the reading position unless reflow has left the trigger out of view.
        if (rect.bottom <= headerBottom || rect.top >= window.innerHeight) {
          trigger.scrollIntoView({block: "center", inline: "nearest", behavior: "instant"});
        }
      }
    }

    function closeFigure() {
      if (frameworkDialog.open) frameworkDialog.close();
      restoreFigureState();
    }

    function isOutsideFigure(event) {
      const rect = frameworkDialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    }

    document.querySelectorAll("[data-figure-open]").forEach(trigger => {
      trigger.addEventListener("click", event => {
        if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (frameworkDialog.open) {
          event.preventDefault();
          return;
        }
        restoreFigureState();
        try { frameworkDialog.showModal(); }
        catch { return; /* Keep the original image link usable if opening fails. */ }
        event.preventDefault();
        figureTrigger = trigger;
        previousBodyOverflow = Array.from(document.body.style)
          .filter(property => overflowProperties.includes(property))
          .map(property => [property, document.body.style.getPropertyValue(property), document.body.style.getPropertyPriority(property)]);
        document.body.style.setProperty("overflow", "hidden", "important");
      });
    });
    frameworkDialog.querySelectorAll("[data-figure-close]").forEach(button => button.addEventListener("click", closeFigure));
    frameworkDialog.addEventListener("cancel", event => {
      event.preventDefault();
      closeFigure();
    });
    frameworkDialog.addEventListener("close", restoreFigureState);
    frameworkDialog.addEventListener("pointerdown", event => {
      pointerStartedOutside = event.button === 0 && event.target === frameworkDialog && isOutsideFigure(event);
    });
    frameworkDialog.addEventListener("pointercancel", () => { pointerStartedOutside = false; });
    frameworkDialog.addEventListener("click", event => {
      // A backdrop click starts and ends outside the dialog's border box.
      // Dialog padding and drags that begin on the figure stay inside.
      const clickedOutside = pointerStartedOutside && event.target === frameworkDialog && isOutsideFigure(event);
      pointerStartedOutside = false;
      if (clickedOutside) closeFigure();
    });
  }

  const links = [...document.querySelectorAll(".main-nav a")];
  const sections = links.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const header = document.querySelector(".site-header");
  const sidebar = document.querySelector(".sidebar");
  const sidebarTopGap = 40;
  const sidebarBottomGap = 16;

  function updateSidebarSticky() {
    if (!sidebar) return;
    const top = (header?.getBoundingClientRect().height || 62) + sidebarTopGap;
    const fits = sidebar.getBoundingClientRect().height + top + sidebarBottomGap <= window.innerHeight;
    const topValue = `${top}px`;
    // Neither property changes the sidebar's size, so observing its height
    // does not create a resize loop when sticky is enabled or disabled.
    if (sidebar.style.getPropertyValue("--sidebar-sticky-top") !== topValue) {
      sidebar.style.setProperty("--sidebar-sticky-top", topValue);
    }
    sidebar.toggleAttribute("data-sticky", fits);
  }

  const navigation = document.querySelector(".main-nav");
  const visibleLinks = navigation?.querySelector(".visible-links");
  const overflowLinks = navigation?.querySelector(".hidden-links");
  const navigationToggle = navigation?.querySelector(".nav-toggle");
  const navigationItems = visibleLinks ? [...visibleLinks.children] : [];

  function closeNavigation(restoreFocus = false) {
    if (!navigationToggle || !overflowLinks) return;
    const wasOpen = navigationToggle.getAttribute("aria-expanded") === "true";
    overflowLinks.hidden = true;
    navigationToggle.setAttribute("aria-expanded", "false");
    if (restoreFocus && wasOpen && !navigationToggle.hidden) navigationToggle.focus();
  }

  function layoutNavigation() {
    if (!navigation || !visibleLinks || !overflowLinks || !navigationToggle) return;
    const activeElement = document.activeElement;
    const hadNavigationFocus = navigation.contains(activeElement);
    const wasOpen = navigationToggle.getAttribute("aria-expanded") === "true";
    document.body.classList.remove("no-nav-overflow");
    // Start with every link in its original order, then measure the real flex
    // layout. This includes font changes and link margins.
    navigationItems.forEach(item => visibleLinks.append(item));
    navigationToggle.hidden = true;
    overflowLinks.hidden = true;
    if (visibleLinks.scrollWidth > visibleLinks.clientWidth + 1) {
      navigationToggle.hidden = false;
      while (visibleLinks.children.length > 1 && visibleLinks.scrollWidth > visibleLinks.clientWidth + 1) {
        overflowLinks.prepend(visibleLinks.lastElementChild);
      }
    }
    const hasOverflow = overflowLinks.children.length > 0;
    navigationToggle.hidden = !hasOverflow;
    overflowLinks.hidden = !hasOverflow || !wasOpen;
    navigationToggle.setAttribute("aria-expanded", String(hasOverflow && wasOpen));
    // Moving a focused node between lists can clear focus in the browser.
    if (hadNavigationFocus) {
      if (overflowLinks.hidden && overflowLinks.contains(activeElement)) navigationToggle.focus({preventScroll: true});
      else if (activeElement === navigationToggle && navigationToggle.hidden) visibleLinks.querySelector("a")?.focus({preventScroll: true});
      else activeElement.focus({preventScroll: true});
      if (!overflowLinks.hidden && overflowLinks.contains(activeElement)) {
        const menuRect = overflowLinks.getBoundingClientRect();
        const focusRect = activeElement.getBoundingClientRect();
        const menuStyle = getComputedStyle(overflowLinks);
        const top = menuRect.top + overflowLinks.clientTop + parseFloat(menuStyle.paddingTop);
        const bottom = menuRect.top + overflowLinks.clientTop + overflowLinks.clientHeight - parseFloat(menuStyle.paddingBottom);
        // Keep the restored focus outline inside this scrollport without moving the page.
        if (focusRect.top < top) overflowLinks.scrollTop += focusRect.top - top;
        else if (focusRect.bottom > bottom) overflowLinks.scrollTop += focusRect.bottom - bottom;
      }
    }
  }

  if (navigationToggle && overflowLinks) {
    navigationToggle.addEventListener("click", () => {
      const expanded = navigationToggle.getAttribute("aria-expanded") === "true";
      overflowLinks.hidden = expanded;
      navigationToggle.setAttribute("aria-expanded", String(!expanded));
    });
    navigation.addEventListener("click", event => {
      if (event.target.closest("a")) closeNavigation();
    });
    document.addEventListener("click", event => {
      if (!navigation.contains(event.target)) closeNavigation();
    });
    document.addEventListener("focusin", event => {
      if (!navigation.contains(event.target)) closeNavigation();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeNavigation(true);
    });
  }
  let scheduled = false;
  function updateActiveSection() {
    const headerHeight = header?.getBoundingClientRect().height || 78;
    document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    const positions = sections.map(section => ({section, rect: section.getBoundingClientRect()}));
    positions.sort((a, b) => a.rect.top - b.rect.top);
    let current = positions[0]?.section.id || null;
    if (window.scrollY > 1) {
      positions.forEach(({section, rect}) => { if (rect.top <= headerHeight + 32) current = section.id; });
      const last = positions.at(-1);
      const lastVisible = last && last.rect.top < window.innerHeight && last.rect.bottom > headerHeight;
      if (lastVisible && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 12) current = last.section.id;
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
  function updateLayout() {
    layoutNavigation();
    updateActiveSection();
    updateSidebarSticky();
  }
  window.addEventListener("resize", updateLayout);
  window.addEventListener("load", updateLayout);
  window.addEventListener("hashchange", updateActiveSection);
  if ("ResizeObserver" in window && header) new ResizeObserver(() => {
    updateActiveSection();
    updateSidebarSticky();
  }).observe(header);
  if ("ResizeObserver" in window && navigation) new ResizeObserver(updateLayout).observe(navigation);
  if ("ResizeObserver" in window && sidebar) new ResizeObserver(updateSidebarSticky).observe(sidebar);
  if (document.fonts?.ready) document.fonts.ready.then(updateLayout);
  updateLayout();
})();
