# QA summary — Grand Theft AIdol cinematic website

Prepared 2026-11-10 (US/Pacific project build context).

## Automated source checks

- HTML, CSS and JS image references audited; **no missing image paths**.
- **20 original PNG masters** and **20 full-size WebP conversions** included, plus WebP gallery thumbnails.
- No `<video>` elements or video embeds. No wallet-connect / `eth_requestAccounts` code.
- `node --check js/app.js` passes.
- Playwright/Chromium in-memory rendering reported no JavaScript exceptions.
- Mission tab switching and gallery open/next/close were exercised in the rendering check.
- Responsive document-width audit passed at 320, 360, 390, 430, 600, 768, 1024, 1280 and 1440 CSS pixels.

## Visual inspection

- Desktop 1440 × 900 first screen and a full-page capture inspected.
- Mobile 390 × 844 first screen and full-page capture inspected.
- Verified the scenic hero, transparent portrait layer, casefile, evidence images, tokenomics grid, concert stage, roadmap image, archive, and crew composition.

## What still needs owner-provided information

- An actual Ethereum token contract address.
- Official X and Telegram links.
- Verification of final token economics, Uniswap V4 pool, liquidity lock, and any public launch claims.
- Final live-hosting test once the website is deployed under a real domain.
- Absolute production `og:image` URL for social cards.

The test environment blocked ordinary navigation to `localhost` and `file://` in the headless browser; for visual QA, an equivalent self-contained HTML snapshot (with the same CSS, DOM, JS and images) was rendered using `page.set_content`. The files in this ZIP are normal relative-path static files intended for Chrome, Netlify, GitHub Pages and similar hosts.
