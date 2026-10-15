# Linwei Chen · 陈林蔚

A buildless, bilingual research homepage for https://chenlw2025.github.io/.

## Preview

Run `py -m http.server 4173 --bind 127.0.0.1` in this directory, then visit http://127.0.0.1:4173/. Opening index.html directly also displays the page; clipboard support depends on a secure browser context.

## Content

- `index.html`: complete default English content. Chinese translations use `data-zh`; accessible labels use `data-aria-zh` and `data-alt-zh`.
- `styles.css`: desktop, mobile, keyboard, reduced-motion, and print layouts.
- `script.js`: browser-language detection, saved language preference, clipboard actions, and navigation state. Share `?lang=zh` or `?lang=en` to select a language; section anchors such as `#contact` are preserved. If clipboard access is unavailable, the text is selected for manual copying with a visible notice; copying, pressing Escape, or switching languages clears the notice. Content and citation downloads remain available without JavaScript.
- `citations/`: individual BibTeX downloads and the combined `publications.bib`. Keep all downloads synchronized with the corresponding inline citation blocks.

Publication metadata comes from the linked publisher pages. The Springer chapter was published online in July 2026; its publisher-specified citation year is 2027. The page explains both dates. Show published work only. Add new projects, profiles, photos, or journal entries only with source material.

## Deployment

The existing GitHub Pages workflow deploys on pushes to `main`. It stages only the HTML, CSS, JavaScript, favicon, avatar and citation assets in `_site`; repository documentation is not deployed. Review the local preview before pushing. No build or external JavaScript dependencies are required.
