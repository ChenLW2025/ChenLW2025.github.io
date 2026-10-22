# Linwei Chen

A buildless, English-language research homepage for https://chenlw2025.github.io/.

## Preview

Run `py -m http.server 4173 --bind 127.0.0.1` in this directory, then visit http://127.0.0.1:4173/. Opening index.html directly also displays the page; clipboard support depends on a secure browser context.

## Content

- `index.html`: English content, with a profile sidebar and sections for introduction, recent news, research, education, publications, and interests beyond research. ProfilePage, Person and ScholarlyArticle JSON-LD describe the same published information as the visible page.
- `styles.css`: desktop, mobile, keyboard, reduced-motion, and print layouts, following the AcadHomepage reference. The profile wraps naturally at larger text sizes, and secondary text keeps sufficient contrast on white. Asset provenance and the template license are recorded in `assets/SOURCES.md`.
- Publication titles come before authors and venue information. On small screens the featured paper's text precedes its figure; on desktop the figure sits beside the text. The framework opens in a keyboard-accessible native dialog, with the original-image link as a fallback when JavaScript or dialog support is unavailable.
- `script.js`: clipboard actions, navigation state, and a width-aware overflow menu. Previous `?lang=zh` and `?lang=en` links display the English page; JavaScript removes the obsolete language parameter while preserving other parameters and the section anchor. Legacy `#about` and `#contact` links still lead to education and profile contact details. If clipboard access is unavailable, the text is selected for manual copying with a visible notice; copying or pressing Escape clears the notice. Content and citation downloads remain available without JavaScript.
- `citations/`: individual BibTeX downloads and the combined `publications.bib`. Keep all downloads synchronized with the corresponding inline citation blocks.
- `assets/education/` and `assets/publications/`: prebuilt lossless WebP images with the original PNGs retained as `<picture>` fallbacks and direct image links. Inline and dialog views share the same framework image. No image conversion runs in the browser or deployment workflow.
- `robots.txt` and `sitemap.xml`: crawling policy and canonical homepage URL. Update the sitemap date when public content changes.

Publication metadata comes from the linked publisher pages. The Springer chapter was published online in July 2026; its publisher-specified citation year is 2027. The page explains both dates. Show published work only. Add new projects, profiles, photos, or journal entries only with source material. External links must match a source already cited by the publication.

The mobile navigation closes when keyboard focus moves outside it, keeping focus on the next control. Citation controls and individual downloads include the paper name in their accessible labels so they can be distinguished outside the article's reading order.

Print styles retain the email address and show the full GitHub URL alongside the profile. Navigation and interactive citation controls stay hidden, while publication DOI text remains visible.

## Deployment

The existing GitHub Pages workflow deploys on pushes to `main`. It stages the root HTML, CSS, JavaScript, favicon and search discovery files, plus the complete `assets/` and `citations/` directories in `_site`; repository documentation is not deployed. The `assets/seerad/` research dashboard has its own pages and regularly updated data. Preserve its updates when syncing and publishing homepage changes. Review desktop and mobile widths before pushing. The homepage requires no build, external fonts or external JavaScript dependencies.
