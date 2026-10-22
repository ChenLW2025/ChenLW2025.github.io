# Linwei Chen · 陈林蔚

A buildless, bilingual research homepage for https://chenlw2025.github.io/.

## Preview

Run `py -m http.server 4173 --bind 127.0.0.1` in this directory, then visit http://127.0.0.1:4173/. Opening index.html directly also displays the page; clipboard support depends on a secure browser context.

## Content

- `index.html`: complete default English content, with a profile sidebar and sections for introduction, recent news, research, education, publications, and interests beyond research. Chinese translations use `data-zh`; accessible labels use `data-aria-zh` and `data-alt-zh`. ProfilePage, Person and ScholarlyArticle JSON-LD describe the same published information as the visible page.
- `styles.css`: desktop, mobile, keyboard, reduced-motion, and print layouts, following the AcadHomepage reference. Asset provenance and the template license are recorded in `assets/SOURCES.md`.
- `script.js`: browser-language detection, saved language preference, clipboard actions, navigation state, and a width-aware overflow menu. Share `?lang=zh` or `?lang=en` to select a language; section anchors such as `#publications` are preserved. Switching languages preserves the current reading position, including at the top or bottom of the page. If clipboard access is unavailable, the text is selected for manual copying with a visible notice; copying, pressing Escape, or switching languages clears the notice. Content and citation downloads remain available without JavaScript.
- `citations/`: individual BibTeX downloads and the combined `publications.bib`. Keep all downloads synchronized with the corresponding inline citation blocks.
- `robots.txt` and `sitemap.xml`: crawling policy and canonical homepage URL. Update the sitemap date when public content changes.

Publication metadata comes from the linked publisher pages. The Springer chapter was published online in July 2026; its publisher-specified citation year is 2027. The page explains both dates. Show published work only. Add new projects, profiles, photos, or journal entries only with source material. External links must match a source already cited by the publication.

## Deployment

The existing GitHub Pages workflow deploys on pushes to `main`. It stages the root HTML, CSS, JavaScript, favicon and search discovery files, plus the complete `assets/` and `citations/` directories in `_site`; repository documentation is not deployed. The `assets/seerad/` research dashboard has its own pages and regularly updated data. Preserve its updates when syncing and publishing homepage changes. Review English and Chinese at desktop and mobile widths before pushing. The homepage requires no build, external fonts or external JavaScript dependencies.
