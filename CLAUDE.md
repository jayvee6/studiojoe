# Studio Joe — Claude instructions

This is a plain static HTML/CSS/JS site. There is no framework, no build step, and no package.json. Do not introduce any.

## Key files

- `index.html` — main site (homepage)
- `resume.html` — resume page
- `public/` — static assets
- `vercel.json` — Vercel deployment config (`outputDirectory: "."`, no build command)

## Tech

- Vanilla HTML, CSS, and JavaScript
- GSAP 3 loaded via CDN for animations; `resume.html` also loads the ScrollTrigger 3.12.5 plugin via CDN
- Dark/light theme toggling via `data-theme` attribute on `<html>`

## Working on the site

Edit `index.html` or `resume.html` directly. Preview by opening the file in a browser — no server required. There is nothing to install or compile.

See README.md for full project context.
