# GRAND THEFT AIdol / $GTA — cinematic website

A full, responsive **single-page static site** with 20 original illustrated / cinematic assets from the Grand Theft AIdol design session. It takes inspiration from the mood and section pacing of the reference site supplied in the conversation, but the page layout, CSS, markup and interaction code here are new.

**No videos. No wallet connect. No backend. No build command.** Works as a static website.

## Quick start — Windows / Cursor

1. Extract the ZIP. Keep the folder structure intact.
2. Open `grand-theft-aidol-site/index.html` in Chrome to preview it immediately.
3. To edit in Cursor, choose **File → Open Folder** and select `grand-theft-aidol-site`.
4. To run through a local server (optional), open a terminal in the folder and run `py -m http.server 4173`. Visit `http://localhost:4173` in Chrome. If `py` is unavailable, try `python -m http.server 4173`.

No `npm install` is required. The optional online Google Fonts request can fail offline; system fonts are included as fallbacks, and all core functionality works without internet access.

## Important: configure before going live

Edit **`js/config.js`**. Fill these public values:

```js
window.GTA_SITE_CONFIG = Object.freeze({
  tokenName: 'Grand Theft AIdol',
  ticker: 'GTA',
  chain: 'ethereum',
  contractAddress: '',  // Public deployed Ethereum contract address, 0x + 40 hex chars
  xUrl: '',             // Your official X account URL, beginning with https://
  telegramUrl: '',      // Your official Telegram URL, beginning with https://
  uniswapUrl: ''         // Optional. Auto-constructed when contractAddress exists
});
```

The site deliberately leaves the contract address and community links unconfigured. It does **not** invent an address or pretend the token has launched. If you supply a valid public Ethereum address, the **Copy CA** button becomes active, and the Uniswap CTA automatically resolves to an ETH-to-token swap link (or uses your custom `uniswapUrl` if supplied). The user must independently verify the exact Uniswap pool and contract address. No wallet-connect code is included.

The figures in `index.html` are proposed placeholders based on the selected design defaults: **1,000,000,000 total supply**, **0% tax**, **Ethereum**, **Uniswap V4 planned**, and **liquidity lock planned**. Confirm them against the deployed contract, pool, and actual LP-lock proof before announcing a launch. The website intentionally describes the LP plan as *planned and not yet verified*.

**Social sharing:** update the `og:image` in `index.html` to an absolute URL once you have a production domain, for example `https://your-domain.example/assets/images/social-preview.jpg`. Most social crawlers expect an absolute image URL.

## What's in the site

| Area | Experience |
|---|---|
| Boot | Short timed cinematic startup sequence (skipped for reduced-motion users) |
| Hero | Panoramic city backdrop, independent transparent Claudia portrait, subtle cursor/scroll depth |
| Origin story | Hologram reveal and character narrative |
| Evidence | Interactive cinematic story cards and image lightbox |
| Wanted | Fictional police casefile / character profile |
| Tokenomics | Supply, tax, chain, DEX plan, contract status, copy/trade controls |
| AIdol | Full-bleed performance scene |
| Missions | Four keyboard-accessible, switchable roadmap/story chapters |
| Gallery | Fullscreen image browser with left/right arrow and Escape support |
| Crew | Final community scene with configurable X/Telegram links |
| Footer | Dedicated night panorama and back-to-top navigation |

### Technical features

- Semantic HTML5, readable standalone CSS and vanilla JavaScript.
- Desktop, tablet and mobile styles, including narrow phones.
- Native image lazy loading, WebP imagery, and tiny gallery thumbnails for speed.
- Scroll reveals with `IntersectionObserver` and no heavy animation libraries.
- Accessible buttons, alt text, keyboard tabs, dialogs, and focus states.
- Reduced motion: OS preference and manual header toggle; saves preference locally if permitted.
- Sticky responsive navigation and scroll-progress indicator.
- No fake visitor counters and no public analytics scripts. A private, password-protected visitor dashboard records real visits for the site owner. No private-key or wallet permissions.
- Browser-compatible static files, without hydration or a framework runtime.

## Asset organization

- `assets/images/` — optimized full-resolution **WebP** files used by the website, thumbnail variants, and a social-preview JPG.
- `artwork/original-png/` — **all 20 original PNG masters**, in descriptive numbered-project naming.
- `ARTWORK-MANIFEST.md` — explicit original-filename mapping.

The brand logo and existing square banner are included even though the primary animated landing page uses a real DOM headline over a layered panoramic scene, preserving sharper text across devices.

## Customize / deploy

**Change copy and layout:** edit `index.html` and `css/styles.css`. The visual structure is grouped into clear sections with descriptive classes. Mission text is in `js/app.js` under the `missions` array. Update the 4 mission cards and mission data together if you rename any chapter.

**Netlify:** drag the extracted `grand-theft-aidol-site` folder to Netlify's manual deploy area. Use no build command; publish directory is the project root.

**GitHub Pages:** the live site is [https://grandtheftaidol.xyz](https://grandtheftaidol.xyz). The repository root is published from the `main` branch. Pushing to `main` publishes the update. The private dashboard is [https://grandtheftaidol.xyz/dashboard/](https://grandtheftaidol.xyz/dashboard/). Visit data is stored by the analytics server on this machine (`scripts/start-analytics.ps1`, port 8798), which Caddy exposes for the public site.

**Amplify / other static hosting:** publish the entire folder with `index.html` as the entry point. No server-side functions required.

## Verify

Run `python tools/audit_site.py` from the project folder to verify the image paths and original artwork coverage. You do not need Python for the website itself.

## A note on identity and affiliation

This is independently developed meme artwork and a creative site concept. The brand should not imply an official connection to Rockstar Games, GTA VI, Anthropic, Claude, or the creator of the Claudia character. Check commercial-use and publicity rights before monetizing or advertising with recognizable characters, logos, or identities.
