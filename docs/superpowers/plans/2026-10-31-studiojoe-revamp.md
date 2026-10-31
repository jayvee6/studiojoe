# studiojoe.dev Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-zone toolkit homepage with a studio-as-channel page: a six-clip wall (Watch), four project cards (Play), a short professional About, and matching header and footer.

**Architecture:** `index.html` is rewritten in place. It keeps the inline token block and inline CSS, as the repo does today. Behavior moves into two small plain scripts, `js/clip-wall.js` and `js/fireworks-card.js`, so each can be tested on its own. Clip loops and posters are committed under `media/wall/`. Tests are plain Node scripts that drive system Chrome through `playwright-core`, installed **outside** the repo, so the repo stays zero-build.

**Tech Stack:** HTML/CSS/vanilla JS, no GSAP on the new homepage, the neural-vfx-toolkit `vfx` CLI and ffmpeg for media, `playwright-core` + Chrome for tests, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-31-studiojoe-revamp-design.md` (read it before starting).

## Global Constraints

- Zero build: no `package.json`, no framework, and no npm install **inside the repo** (repo `CLAUDE.md`).
- Branch `revamp/studio-channel` off `main`, merged by PR to `main`. Never through `staging`.
- Visual system per `DESIGN.md`: the 13 token names, dark only, at most two accents (`--accent` #2DD4BF plus one warm accent).
- `--label-3` must reach ≥4.5:1 on `--bg` (#060608). Use `rgba(255,255,255,0.46)` or brighter.
- Never name Joey's current employer. Copy says "has worked at Apple and Adobe". No "now at", "currently" or "present".
- No "coming", "soon" or "store later" copy anywhere.
- Contact: `jvilla@studiojoe.dev`, as selectable text plus a `mailto:` link.
- No links to `/resume.html` and no LinkedIn links anywhere on the site.
- Clip loops: muted H.264 MP4, 9:16, 6–8 s, each ≤1.5 MB, all six ≤9 MB total, each with a JPEG poster.
- Controls are ≥44 px tall and show a visible `:focus-visible` ring.
- `prefers-reduced-motion: reduce` means no autoplaying video and no animated canvas.

## Review Focus

1. **The video fails or is slow** (blocked, 404 or slow network): the tile still shows its poster, title and credit, and the link still works. → test in Task 4.
2. **iOS Safari autoplay** needs `muted`, `playsinline` and `loop` set as attributes in the markup, not only from JS. → test in Task 3.
3. **Battery and data when off-screen:** videos pause when the wall leaves the viewport or the tab is hidden. → test in Task 4.
4. **GSAP CDN outage:** the new homepage must not depend on GSAP. With cdnjs blocked there are no page errors and the wall plays. → test in Task 4.
5. **Narrow phones (320 px):** no horizontal scroll, the tiles wrap, and titles don't clip. → test in Task 3.

---

## File Structure

| Path | Responsibility |
|---|---|
| `tests/harness.cjs` | Static server on a free port, Chrome launcher, `check(name, cond, detail)` reporter. Exits 1 on any failure |
| `tests/site.test.cjs` | All browser tests, grouped by task (`--only <group>`) |
| `tests/media.test.sh` | ffprobe checks on `media/wall/*` |
| `tests/README.md` | One-time setup and run commands |
| `media/wall/<slug>.mp4`, `<slug>.jpg` | Six loops and posters |
| `media/og.jpg` | 1200×630 share image |
| `js/clip-wall.js` | Autoplay, pause and reduced-motion behavior for the wall |
| `js/fireworks-card.js` | Fireworks-only sandbox, extracted from the old `index.html` |
| `index.html` | New homepage (rewritten) |
| `savers.html` | New header and footer; LinkedIn and resume links removed |
| `resume.html` | `noindex` meta only |
| `favicon.svg`, `apple-touch-icon.png` | Icons |
| `.vercelignore` | Excludes `docs/`, `.superpowers/`, `tests/` |
| `.github/workflows/ci.yml` | Lychee excludes for tiktok.com and knowyourmeme.com |

Clip slugs, in wall order: `shabang`, `lucia-bob`, `frozone`, `luigi`, `fried-chicken-hour`, `so-good`.

---

### Task 1: Test harness and repo hygiene

**Files:**
- Create: `tests/harness.cjs`, `tests/site.test.cjs`, `tests/README.md`, `.vercelignore`
- Modify: `.github/workflows/ci.yml` (lychee `args`)

**Interfaces:**
- Produces: `harness.cjs` exports `async withSite(fn)`, where `fn` receives `{ base, browser }`. It serves the repo root over Node `http` with correct MIME types for `.mp4/.jpg/.svg/.png/.js/.css/.html` and Range support for video, and launches Chrome from `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (headless). It also exports `check(name: string, ok: boolean, detail?: any)` and `done()` (prints a PASS/FAIL summary and sets the exit code). `playwright-core` is resolved from `process.env.SJ_TEST_MODULES || ~/.cache/studiojoe-tests/node_modules`.
- Produces: `site.test.cjs` CLI is `node tests/site.test.cjs [--only <group>]`. Groups: `smoke`, `media`, `structure`, `wall`, `play`, `head`, `pages`.

- [ ] **Step 1:** Install once, outside the repo: `npm i --prefix ~/.cache/studiojoe-tests playwright-core@1.49.1`. Write the same command into `tests/README.md`.
- [ ] **Step 2: Write the failing smoke test** (group `smoke`): load `/index.html`, then `check('smoke: page title', (await page.title()).length > 0)` and `check('smoke: deliberate fail', false)`.
- [ ] **Step 3:** Run `node tests/site.test.cjs --only smoke`. Expected: exit 1, with one PASS and one FAIL line.
- [ ] **Step 4:** Remove the deliberate fail. Run again. Expected: exit 0.
- [ ] **Step 5:** Create `.vercelignore` with the three lines `docs/`, `.superpowers/` and `tests/`. Add `--exclude "https://www.tiktok.com"` and `--exclude "https://knowyourmeme.com"` to the lychee args in `ci.yml`.
- [ ] **Step 6: Commit:** `git add tests .vercelignore .github/workflows/ci.yml && git commit -m "Add browser test harness, vercelignore, lychee excludes"`

### Task 2: Clip loops and posters

Invoke the `neural-vfx-expert` skill first (repo hook requirement), then use the `vfx` CLI. Run `vfx <op> --help` for flags. The ops are `cut` (`-o --start --end`), `panscan` (`--aspect 9:16`), `editpoint` (`--loop LO-HI` finds a clean loop join) and `conform` (`--spec tiktok` / `--width --height --crf`).

**Files:**
- Create: `media/wall/{shabang,lucia-bob,frozone,luigi,fried-chicken-hour,so-good}.{mp4,jpg}`, `tests/media.test.sh`

**Interfaces:**
- Produces: the twelve files above. Later tasks reference them only as `/media/wall/<slug>.mp4` and `/media/wall/<slug>.jpg`.

Sources (from the spec table, verbatim):

| slug | master |
|---|---|
| shabang | `/Volumes/JDrive/PremiereProjs/Shabang-faded.mp4` (16:9 → `vfx panscan --aspect 9:16`, framed on Gaston) |
| lucia-bob | `/Volumes/JDrive/Offload/Comfy/lucia_bob4_scail_v2/lucia_bob4_scail_v2_FINAL_1080.mp4` |
| frozone | `/Volumes/JDrive/PremiereProjs/FreddieFrozoneFullLength.mp4` |
| luigi | `/Volumes/JDrive/Offload/Comfy/luigi_boyce/luigi_boyce_kling.mp4` |
| fried-chicken-hour | `/Volumes/JDrive/Offload/Comfy/fried_chicken_hour/final/FRIED_CHICKEN_HOUR_tiktok_1080x1920.mp4` |
| so-good | `/Volumes/JDrive/PremiereProjs/SOGOOD_9x16_human_edit.mp4` |

- [ ] **Step 1: Write the failing test** `tests/media.test.sh`. For each slug, use `ffprobe` to assert:
  - the `.mp4` and `.jpg` both exist
  - the video codec is `h264`
  - there is **no** audio stream
  - width:height is 9:16 (width×16 == height×9)
  - duration is between 6.0 and 8.0 s
  - the file is ≤1,572,864 bytes

  Also assert the sum of all six `.mp4` sizes is ≤9,437,184 bytes. Print PASS/FAIL per check and exit 1 on any failure.
- [ ] **Step 2:** Run `bash tests/media.test.sh`. Expected: FAIL (no files yet).
- [ ] **Step 3:** For each slug, pick a 6–8 s window showing the character at a payoff beat with no caption-heavy frames. Use `vfx editpoint --loop` to choose the in/out points for a seamless loop. Then `vfx cut` → (`vfx panscan` for shabang) → conform to 540×960, strip audio, CRF chosen to meet the size cap. Export the poster as the first frame of the loop at 540×960, JPEG quality 82.
- [ ] **Step 4:** Run `bash tests/media.test.sh`. Expected: all PASS, exit 0.
- [ ] **Step 5:** Build a contact sheet with `vfx montage` of the six loops and look at it. Every tile must show the character clearly. Note any loop to recut, and recut it before committing.
- [ ] **Step 6: Commit:** `git add media/wall tests/media.test.sh && git commit -m "Add clip-wall loops and posters"`

### Task 3: Homepage structure and copy

**Files:**
- Modify (rewrite): `index.html`. Drop the Showroom, Sandbox, Shelf and Workbench zones, the crack-open aside and backdrop, every inline script, and the GSAP and `/lib/*` script tags. Keep the `:root` token block (lines 16–53 today) with `--label-3` raised and the zone-shift accents removed.
- Test: `tests/site.test.cjs` group `structure`

**Interfaces:**
- Produces: markup contracts that Tasks 4 and 5 bind to:
  - `<section id="watch">` contains `<ul class="wall">` with six `<li class="tile" data-slug="<slug>">`, in slug order. Each `li` wraps `<a class="tile-link" href="<tiktok url>" target="_blank" rel="noopener" aria-label="<Title> on TikTok">`. Inside the link: `<video class="tile-video" muted playsinline loop preload="none" poster="/media/wall/<slug>.jpg" data-src="/media/wall/<slug>.mp4">`, then `<span class="tile-title">`, `<span class="tile-views">` and `<span class="tile-credit">`.
  - `<section id="play">` contains `<ul class="play-grid">` with four `<li class="play-card" data-app="arcade|musicnerd|ripple|starspeller">`. The arcade card contains `<canvas id="fwCanvas">`.
  - `<section id="about">` contains `<a class="contact" href="mailto:jvilla@studiojoe.dev">jvilla@studiojoe.dev</a>`.
- Tile data (title / views / credit / href), copied from the spec:
  - Shabang the Musical / 433K / King Willonius / …7672946936768433422
  - Lucia's bob / 147K / @rashnakut / …7679737136869870861
  - Freddie × Frozone / 129K / Freddie Gibbs · COLORS / …7669575386832866573
  - Boycey as Luigi / 123K / @boyceyjr / …7698940487155207437
  - Fried Chicken Hour / 111K / Polyphony Digital / …7698963987257380110
  - So Good / 82K / Jhené Aiko · Kendrick Lamar / …7684776115277188366
  - Every href is prefixed `https://www.tiktok.com/@studio_joe/video/`.
- Fixed copy (spec drafts, used verbatim; Joey reviews at the PR):
  - Headline: "Fan art, memes and weird experiments in AI video, 3D and sound."
  - Sub-line: "1.4 million views on TikTok. Everything here was made with ComfyUI, Blender and Claude."
  - Badge: "Featured on Know Your Meme: Shabang: The Musical"
  - About: 3–4 lines that include "has worked at Apple and Adobe", one line about co-engineering with Claude, and "Resume available on request."

- [ ] **Step 1: Write the failing tests** (group `structure`):
  - `nav labels`: the header nav text is exactly `["Watch","Play","About","@studio_joe ↗"]`, and the last link's href is `https://www.tiktok.com/@studio_joe`.
  - `wall tiles`: there are 6 `.tile` elements, the `data-slug` order matches, every `.tile-link` has `target=_blank` and an href starting with `https://www.tiktok.com/@studio_joe/video/`, and every `.tile-credit` is non-empty.
  - `video attrs` (Review Focus 2): every `.tile-video` has the `muted`, `playsinline` and `loop` attributes present in the served HTML. Check the source text, not just the DOM properties.
  - `copy`: the body text contains "Apple and Adobe", "jvilla@studiojoe.dev" and "Resume available on request". It matches none of `/\b(currently|now at|present)\b/i`, `/coming|soon|store/i` or `/linkedin/i`. There is no `a[href*="resume"]`.
  - `contrast`: the computed color of `.tile-views` over `--bg` is ≥4.5:1. Composite the rgba, then compute the WCAG ratio.
  - `targets`: every `a, button` in the header, `#about` and the footer has a bounding height ≥44.
  - `one row desktop`: at 1440×900, all six `.tile` elements share the same `offsetTop`.
  - `footer`: the footer contains `jvilla@studiojoe.dev`, a link to `https://www.tiktok.com/@studio_joe` and a link to `https://github.com/jayvee6`.
  - `focus ring`: after `.tile-link.focus()` via the keyboard (Tab from the nav), the computed `outline-width` is ≥2px and `outline-style` isn't `none`.
  - `narrow 320` (Review Focus 5): at viewport 320×640, `document.documentElement.scrollWidth === 320`, and no `.tile-title` has `scrollWidth > clientWidth`.
- [ ] **Step 2:** Run `node tests/site.test.cjs --only structure`. Expected: FAIL.
- [ ] **Step 3:** Rewrite `index.html` to these contracts, following DESIGN.md (glass cards for Play only; the tiles are image-led, not glass). Load `js/clip-wall.js` and `js/fireworks-card.js` with `defer`. Tasks 4 and 5 create those files, so add empty stubs now. Before adding the badge, open the Know Your Meme "Shabang: The Musical" entry and confirm Joey's video is still embedded. If it is, link the badge to the entry URL. If it isn't, leave the badge out and note that in the PR.
- [ ] **Step 4:** Run `node tests/site.test.cjs --only structure`. Expected: PASS.
- [ ] **Step 5: Commit:** `git add index.html js && git commit -m "Rewrite homepage: Watch / Play / About"`

### Task 4: Clip wall behavior

**Files:**
- Create: `js/clip-wall.js`
- Test: `tests/site.test.cjs` group `wall`

**Interfaces:**
- Consumes: the `.tile-video[data-src]` markup from Task 3.
- Produces: `window.__wall = { playing(): number }`, the number of tile videos currently playing (for tests).

Behavior: on load, unless reduced motion is on, set `src` from `data-src` for tiles that intersect the viewport and `play()` them. An `IntersectionObserver` plays tiles as they enter and pauses them as they leave. On `visibilitychange` to hidden, pause all. Under `prefers-reduced-motion: reduce`, never set `src`, so posters stay. Swallow `play()` rejections; the poster stays visible.

- [ ] **Step 1: Write the failing tests** (group `wall`):
  - `autoplay`: at 1440×900, `__wall.playing() === 6` within 3 s.
  - `reduced motion`: in a context with `reducedMotion: 'reduce'`, `__wall.playing() === 0` after 3 s, and every `.tile-video` has no `src` attribute.
  - `offscreen pause` (Review Focus 3): scroll `#about` into view; `__wall.playing() === 0` within 1 s.
  - `video blocked` (Review Focus 1): with `page.route('**/media/wall/*.mp4', r => r.abort())`, every tile still shows its poster (`getComputedStyle(video).visibility !== 'hidden'` and `poster` set), `.tile-title` is visible, and there are no page errors.
  - `no gsap` (Review Focus 4): with `page.route('https://cdnjs.cloudflare.com/**', r => r.abort())`, there are zero `pageerror` events and `__wall.playing() === 6`.
- [ ] **Step 2:** Run `node tests/site.test.cjs --only wall`. Expected: FAIL (`__wall` undefined).
- [ ] **Step 3:** Implement `js/clip-wall.js`.
- [ ] **Step 4:** Run `node tests/site.test.cjs --only wall`. Expected: PASS.
- [ ] **Step 5: Commit:** `git add js/clip-wall.js tests/site.test.cjs && git commit -m "Clip wall: lazy autoplay, offscreen pause, reduced motion"`

### Task 5: Play cards and the fireworks card

**Files:**
- Create: `js/fireworks-card.js`. Extract it from `git show main:index.html`: the `Sandbox` IIFE (lines 1614–2131), keeping only the fireworks pieces (theme and rocket data, the emoji atlas at 1682–1727, the debris cap, the Fireworks section at 1745–1827, `drawFireworks` from 1877, and the rAF loop at 2115–2131). Inline a local copy of `fitObserve` (lines 774–785). Drop the spiral, mandala and galaxy modes, the mode buttons and the accent picker.
- Test: `tests/site.test.cjs` group `play`

**Interfaces:**
- Consumes: `#fwCanvas` inside `.play-card[data-app="arcade"]` (Task 3).
- Produces: `window.__fireworks = { rockets(): number }`, the total rockets launched so far.

Card links: arcade → `https://emojiarcade.io`, musicnerd → `https://musicnerd.studiojoe.dev/`, ripple → `https://ripplebreath.app`, starspeller → `https://starspeller.app`. Each opens in a new tab. Card subtitles: "Three WebGPU games", "110+ audio-reactive visualizers", "Breathing app", "Spelling game". The fireworks auto-launch one rocket every ~2 s while the card is on screen, and a pointerdown on the canvas launches one at the pointer. The canvas tap must not follow the card link; the card's link is its title and a "Play ↗" button.

- [ ] **Step 1: Write the failing tests** (group `play`):
  - `play links`: the four cards' primary links have the four exact hrefs above and `target=_blank`.
  - `fireworks run`: scroll `#play` into view, then `__fireworks.rockets() >= 1` within 3 s.
  - `fireworks tap`: one `page.mouse.click` on `#fwCanvas` increases `rockets()` by ≥1 and does not navigate (`page.url()` unchanged).
  - `fireworks reduced`: with reduced motion, `rockets() === 0` after 3 s on screen.
- [ ] **Step 2:** Run `node tests/site.test.cjs --only play`. Expected: FAIL.
- [ ] **Step 3:** Implement `js/fireworks-card.js` and complete the four Play cards in `index.html`.
- [ ] **Step 4:** Run `node tests/site.test.cjs --only play`. Expected: PASS.
- [ ] **Step 5: Commit:** `git add js/fireworks-card.js index.html tests/site.test.cjs && git commit -m "Play: four project cards, fireworks live on Emoji Arcade"`

### Task 6: Head, icons and share card

**Files:**
- Create: `favicon.svg` (the "SJ" wordmark in `--accent` on `--bg`), `apple-touch-icon.png` (180×180, rendered from the SVG), `media/og.jpg` (1200×630: four posters side by side plus the wordmark, built with `vfx montage` or ffmpeg)
- Modify: `index.html` `<head>`
- Test: group `head`

**Interfaces:** none consumed or produced beyond the files above.

- [ ] **Step 1: Write the failing tests** (group `head`):
  - `meta`: `<title>` is "Studio Joe". The description meta contains "AI video". `og:title`, `og:description`, `og:image` (absolute `https://studiojoe.dev/media/og.jpg`), `twitter:card=summary_large_image` and `link[rel=icon][href="/favicon.svg"]` are all present.
  - `icons serve`: `/favicon.svg`, `/apple-touch-icon.png` and `/media/og.jpg` each return 200, and there are zero console 404s on page load.
  - `og size`: the decoded `media/og.jpg` is 1200×630. Load it in the page via `new Image()`.
- [ ] **Step 2:** Run `node tests/site.test.cjs --only head`. Expected: FAIL.
- [ ] **Step 3:** Add the files and meta tags.
- [ ] **Step 4:** Run `node tests/site.test.cjs --only head`. Expected: PASS.
- [ ] **Step 5: Commit:** `git add favicon.svg apple-touch-icon.png media/og.jpg index.html tests/site.test.cjs && git commit -m "Add icons, OG/Twitter share card"`

### Task 7: Other pages

**Files:**
- Modify: `savers.html` (header lines ~203–210 and footer ~314–320: use the same header and footer as the new homepage; remove the LinkedIn and Resume links), `resume.html` (add `<meta name="robots" content="noindex">` in the `<head>`, nothing else)
- Test: group `pages`

- [ ] **Step 1: Write the failing tests** (group `pages`):
  - `savers header`: on `/savers.html`, the nav text matches the homepage nav exactly.
  - `no linkedin, no resume links`: on every top-level `*.html` and `savers/*.html` page, no `a[href*="linkedin"]` and no `a[href*="resume"]`. Skip `resume.html`'s links to itself.
  - `resume unlisted`: `/resume.html` returns 200 and has `meta[name=robots][content*=noindex]`.
- [ ] **Step 2:** Run `node tests/site.test.cjs --only pages`. Expected: FAIL.
- [ ] **Step 3:** Make the edits.
- [ ] **Step 4:** Run the full suite with `node tests/site.test.cjs && bash tests/media.test.sh`. Expected: all PASS.
- [ ] **Step 5: Commit:** `git add savers.html resume.html tests/site.test.cjs && git commit -m "Savers gets the new chrome; resume unlisted; LinkedIn removed site-wide"`

### Task 8: Ship check

- [ ] **Step 1:** Push the branch and open a PR to `main`. Put the copy (headline, sub-line, About) in the PR body for Joey's review.
- [ ] **Step 2:** CI is green: HTMLHint and Lychee.
- [ ] **Step 3: Vercel preview checks.** On the preview URL:
  - `/docs/superpowers/specs/2026-10-31-studiojoe-revamp-design.md` returns 404.
  - `/tests/harness.cjs` returns 404.
  - `/resume.html` returns 200.
- [ ] **Step 4: Visible-browser check.** Open the preview URL in visible Chrome via `claude-in-chrome`; the hidden preview pane produces no frames. Check that the wall is playing, the fireworks run, and phone width (420 px) has no horizontal scroll. Take one screenshot of each for the PR.
- [ ] **Step 5:** Merge only on Joey's word.
