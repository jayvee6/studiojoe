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

## Branching & deployment

- `main` → auto-deploys to https://studiojoe.dev (production)
- `staging` → auto-deploys to https://staging.studiojoe.dev (preview)

**Workflow:**
1. Make changes on `staging` (or a feature branch off `staging`)
2. Verify at the staging URL
3. Open a PR: `staging` → `main`
4. CI runs automatically: HTML validation, link check, accessibility audit
5. Merge → prod deploys

Direct pushes to `main` are blocked — go through a PR.

See README.md for full project context.

## Working with local models (Gemma, Qwen, etc.)

This project is intentionally simple. Do not apply multi-agent patterns, orchestration frameworks, or complex auditor roles. There is no pipeline. There are two HTML files.

**Default behavior:**
- Read files first, then respond. Do not ask clarifying questions before reading.
- Be concise. One issue per bullet. No preamble.
- Do not summarize what you just did.

**Code review — do this:**
1. Read `index.html`
2. Read `resume.html`
3. List issues found: broken markup, accessibility gaps, inline style inconsistencies, JS errors, missing alt text, dead links
4. Stop. Do not propose rewrites unless asked.
