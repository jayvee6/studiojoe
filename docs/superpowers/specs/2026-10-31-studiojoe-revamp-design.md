# studiojoe.dev revamp — design

Date: 2026-10-31 · Status: draft for Joey's approval

## Intent

studiojoe.dev becomes the home base for **Studio Joe the channel**: a creative, absurdist fan-art and meme outlet where Joey exercises generative AI video, 3D modeling and audio (TikTok @studio_joe). The current site reads as a toolkit storefront plus a process essay. It never shows the video work that people actually come for, and it never says who Joey is.

The structure is **proof first**: finished work leads, credentials come last, and process gets one line.

The primary visitor is someone who just tapped the link in Joey's TikTok bio. In the first screen they should see the 3D and video work itself. Joey's video and motion-graphics skills have grown, and the site should show that immediately.

## Goals

- First screen = the work. A clip wall of Joey's most popular TikToks, ranked by real views.
- Show the playable side (apps, games, visualizers made with Claude) as the studio's second kind of output.
- Give professional visitors (recruiters, resume readers) a short credentialed About and a way to reach Joey.
- One consistent identity across pages.

## Non-goals

- Not a recruiter-first portfolio. The homepage is not shaped around hiring.
- Not a storefront for sj-design or the toolkit.
- No blog, no "coming soon" sections.
- No change to the resume's content in this project (see Open decisions).

## Anti-goals (failure even if it works)

- The first screen shows code art or explanation instead of Joey's clips.
- The page names Joey's **current** employer, or says which of Apple/Adobe is current.
- Any "coming soon", "store later" or other dead-end copy.
- Heavy video that makes the page slow on a phone (the wall must stay light; see Constraints).
- Anything that breaks the zero-build rule (no framework, no npm, no build step).

## Page structure (homepage, in order)

### 1. Header
Wordmark **Studio Joe**. Nav: **Watch · Play · About**, plus **@studio_joe ↗** linking to https://www.tiktok.com/@studio_joe. LinkedIn is removed from the nav and the footer on every page.

### 2. Watch (first screen) — clip wall
Six vertical 9:16 tiles, one per piece (only the top Shabang cut; the 91K Broadway version is left out so the wall shows six different pieces, which Joey approved in the mockup), in one row on desktop, wrapping on narrow screens. Each tile is a short muted autoplay loop cut from Joey's own master render, with the title, view count and a small credit to the original creators overlaid, matching the TikTok captions: King Willonius (Shabang), @rashnakut (Lucia), Freddie Gibbs and COLORS (Frozone), @boyceyjr (Luigi), Polyphony Digital (Fried Chicken Hour), Jhené Aiko and Kendrick Lamar (So Good). *(Claude's call: this is fan art, and the credits already appear on TikTok.)* Tapping a tile opens the full video on TikTok in a new tab.

Clips, ranked by lifetime views from the TikTok Content export of 2026-10-30 (archived at `~/joeOS/joeOS/Projects/TikTok Channel/data/2026-10-31/`):

| # | Tile title | Views | Master file | TikTok link |
|---|---|---|---|---|
| 1 | Shabang the Musical | 433K | `/Volumes/JDrive/PremiereProjs/Shabang-faded.mp4` (1920×1088, needs a 9:16 reframe) | https://www.tiktok.com/@studio_joe/video/7672946936768433422 |
| 2 | Lucia's bob | 147K | `/Volumes/JDrive/Offload/Comfy/lucia_bob4_scail_v2/lucia_bob4_scail_v2_FINAL_1080.mp4` | https://www.tiktok.com/@studio_joe/video/7679737136869870861 |
| 3 | Freddie × Frozone | 129K | `/Volumes/JDrive/PremiereProjs/FreddieFrozoneFullLength.mp4` (864×1536) | https://www.tiktok.com/@studio_joe/video/7669575386832866573 |
| 4 | Boycey as Luigi | 123K | `/Volumes/JDrive/Offload/Comfy/luigi_boyce/luigi_boyce_kling.mp4` | https://www.tiktok.com/@studio_joe/video/7698940487155207437 |
| 5 | Fried Chicken Hour | 111K | `/Volumes/JDrive/Offload/Comfy/fried_chicken_hour/final/FRIED_CHICKEN_HOUR_tiktok_1080x1920.mp4` (the Oct 20 original, not the Oct 22 remix) | https://www.tiktok.com/@studio_joe/video/7698963987257380110 |
| 6 | So Good | 82K | `/Volumes/JDrive/PremiereProjs/SOGOOD_9x16_human_edit.mp4` | https://www.tiktok.com/@studio_joe/video/7684776115277188366 |

The Lucia and So Good masters were matched by date and format and are Claude's best guess. Joey should glance at both tiles.

Below the wall:
- Headline (draft): "Fan art, memes and weird experiments in AI video, 3D and sound."
- Sub-line (draft): "1.4 million views on TikTok. Everything here was made with ComfyUI, Blender and Claude." (1.4M = 1,397,350, the sum of daily views in the Overview export covering Oct 30 2025 → Oct 29 2026.)
- Credit badge: "Featured on Know Your Meme: Shabang: The Musical", linking to that entry. Joey's Drake-as-Gaston TikTok is embedded on the entry (channel notes, 2026-09-09). The builder confirms the exact URL and that the embed is still there before shipping; if it isn't, the badge is dropped.

### 3. Play — things to play with
Four cards, each linking out to the live project:
- **Emoji Arcade**: three WebGPU games → https://emojiarcade.io. The card hosts the existing **emoji fireworks sandbox** as a live preview, so visitors can set off fireworks on the card itself. Code comes from the current Sandbox zone in `index.html` and the vendored `/lib/`.
- **Music Nerd**: 110+ audio-reactive visualizers → https://musicnerd.studiojoe.dev/
- **Ripple**: breathing app → https://ripplebreath.app
- **Star Speller**: spelling game → https://starspeller.app

Savers (`/savers.html`) stays reachable as a page but doesn't get a Play card. *(Claude's call. Joey can add it as a fifth card.)*

### 4. About — for professional visitors
A short bio (3–4 lines). Credentials phrasing: **"has worked at Apple and Adobe"**. Never "now at" or "currently". One line can mention co-engineering with Claude, replacing the current Workbench zone. Contact: **jvilla@studiojoe.dev**, shown as selectable text as well as a `mailto:` link. **"Resume available on request."**

### 5. Footer
© Studio Joe · jvilla@studiojoe.dev · @studio_joe ↗ · GitHub ↗.

## Removed from the homepage

- **Black-hole WebGPU hero**: removed from the page. The code stays in git history. Joey isn't attached to it.
- **Sandbox as its own zone**: moves into the Emoji Arcade card.
- **Shelf**: replaced by Play. The sj-design, sj-audio and GitHub cards go. GitHub moves to the footer.
- **Workbench** (loop diagram, four contract cards, "Blog & video — coming"): removed. Process gets one line in About.
- **"Crack it open" panels**: these existed to sell the toolkit, so they go with the Shelf and Workbench. *(Claude's call, consistent with the non-goals.)*
- **LinkedIn links**: removed site-wide (index nav and footer, savers.html).

## Constraints

- **Zero build** (repo CLAUDE.md): plain HTML/CSS/JS, GSAP from the pinned CDN, no npm, no framework.
- **Visual system:** follow `DESIGN.md` (13 tokens, dark only, type and motion rules). Use at most two accents. The current eight-accent spread was flagged in review.
- **Clip loops must be light.** Muted, 6–8 s, H.264 MP4. Target ≤1.5 MB each and ≤9 MB for the whole wall. Each tile gets a poster image so the wall looks complete before the video loads. Lazy-load tiles that start off-screen. Under `prefers-reduced-motion`, show posters and don't autoplay.
- **Make the loops with the neural-vfx-toolkit `vfx` CLI**, not hand-rolled ffmpeg: `vfx cut` for the range, `vfx panscan`/`crop` for Shabang's 16:9→9:16 reframe, `vfx editpoint` to find a clean loop join, `vfx conform` for the delivery size. Pick a loop moment that shows the character, which is usually the payoff beat.
- **Accessibility:** controls at least 44 px tall, visible `:focus-visible`, muted-text contrast ≥4.5:1 (raise `--label-3`), tile links labeled with the video title.
- **Repo workflow** *(Claude's call)*: a feature branch off `main`, with a PR to `main`. Vercel's PR preview takes the place of staging. Don't go through `staging`: it's behind `main` and carries unmerged pages (`resume-comfy.html` names the current employer) that must not ship with this project. CI (HTMLHint and Lychee) must pass. The Lychee config needs `tiktok.com` and `knowyourmeme.com` excluded or allowed if they block bots.
- **Hygiene while touching the page:** add a favicon and OG/Twitter tags, with the share image taken from the clip wall.
- **Keep docs off the live site.** Vercel serves the repo root, so this spec would be public at `/docs/...`. Add a `.vercelignore` with `docs/` and `.superpowers/`.

## Resume (Joey's decision, 2026-10-31)

`/resume.html` is **unlisted**. The file stays and the URL still works when Joey sends it on request, but nothing on the site links to it: remove the links from the `savers.html` nav and footer and anywhere else. Add `<meta name="robots" content="noindex">` to the page. Its content isn't changed in this project. `resume-comfy.html` on `staging` stays unmerged.

## Other pages *(Claude's call)*

The homepage gets the new header and footer. `savers.html` gets the same header and footer so it can be reached from the new site. `ipod.html`, `musicplayer/` and `vfx/` aren't touched in this project. LinkedIn is removed everywhere it appears.

## Left to the builder

- Exact loop in/out points per clip (show the character; avoid caption-heavy frames).
- Tile hover/focus treatment, overlay typography and grid breakpoints, within DESIGN.md.
- Final headline and bio wording (keep the meaning; Joey reviews copy).
- Where the loop files live in the repo (for example `media/wall/`).
- Whether the Emoji Arcade card's sandbox runs immediately or starts on tap.

## Open decisions

None. All of Joey's decisions are recorded above.
