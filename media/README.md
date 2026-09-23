# Media hosting

Site is on **Vercel**. Video and posters are on **Cloudflare R2**, served from
`media.studiojoe.dev`. The repo stays small: masters are never committed, and
built derivatives are gitignored.

```
masters (~/Documents/Comfy, JDrive)
        │  media/sources.tsv   ← declarative build list
        ▼
   media/build.sh              → media/dist/   (gitignored, ~10 MB)
        ▼
   media/sync.sh               → R2 bucket, prefix v1/
        ▼
   https://media.studiojoe.dev/v1/…
```

## Why R2

`studiojoe.dev` already runs on Cloudflare nameservers, so this is a bucket in an
account we own, not a new vendor. The deciding factor is **egress**: R2 charges
nothing for it, on any plan, permanently. Free tier is 10 GB storage, 1M Class A
and 10M Class B operations per month.

Two options were rejected:

- **Committing to git.** Works today at 10 MB, but every re-encode leaves a dead
  blob in history forever. The repo is currently 135 KB packed.
- **Git LFS.** Vercel does support it now (Project Settings → Git toggle), but
  GitHub's free LFS allowance is **1 GB of bandwidth per month**. At ~1.5 MB per
  visit that is roughly 700 visits before assets stop loading — one good TikTok
  would break the site.

## One-time setup

1. **Create the bucket.** Cloudflare dashboard → R2 → *Create bucket* →
   `studiojoe-media`. Location: Automatic.
2. **Attach the domain.** Bucket → Settings → *Public access* → **Connect custom
   domain** → `media.studiojoe.dev`. Cloudflare writes the DNS record itself
   because the zone is already there. This is what makes objects publicly
   readable — do **not** enable the `r2.dev` development URL.
3. **CORS.** Bucket → Settings → CORS policy:
   ```json
   [{ "AllowedOrigins": ["https://studiojoe.dev", "https://staging.studiojoe.dev", "http://localhost:4801"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["Range"],
      "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"],
      "MaxAgeSeconds": 86400 }]
   ```
   `Range` matters: without it Safari will not scrub or seek video.
4. **Credentials.** R2 → *Manage API Tokens* → Create API Token → **Object Read &
   Write**, scoped to `studiojoe-media`. Copy the Access Key ID and Secret.
5. **Local env.** `cp media/.env.example media/.env` and fill in `R2_ACCOUNT_ID`
   (R2 Overview, right-hand panel), the two keys, and `R2_BUCKET`.
6. Optional but worth it: `brew install rclone` — makes uploads incremental
   instead of re-pushing every object.

## Everyday use

```bash
bash media/build.sh          # rebuild derivatives that changed
bash media/sync.sh --dry-run # see what would upload
bash media/sync.sh           # push to R2
```

Then flip the page over to the CDN — in `redesign/v3-compositor.html`:

```js
var MEDIA_BASE = 'https://media.studiojoe.dev/v1/';
```

Leave it as `/media/dist/` while working locally.

## Adding a shot

Append a row to `media/sources.tsv`, rerun `build.sh`, then `sync.sh`. Columns are
`out_name · source · scale · crf · trim`. House default is CRF 30 at native height;
drop to 26 for passes with thin lines on flat backgrounds (the pose pass smears
otherwise). `trim` is `START:DURATION` in seconds, or `-` for the whole clip.

A shot that autoplays should also ship a short `-loop` cut. Both sides of a wipe
**must be trimmed to the identical window**, or the comparison is a lie.

## Cache busting

Objects are uploaded with `Cache-Control: public, max-age=31536000, immutable`, so
edits to an existing filename will not be picked up. To publish changed assets,
bump `MEDIA_VERSION` in `media/.env` (`v1` → `v2`), re-sync, and update
`MEDIA_BASE` to match. Old prefix can be deleted once the new one is live.

## Gotchas hit while building this

- `~/Documents/Comfy` is a **symlink into JDrive**. Mount the volume or `build.sh`
  exits early; plain `find` also silently skips it without `-L`.
- `ffmpeg` inside a `while read` loop eats the loop's stdin and swallows the rest
  of the input file. Every call here uses `-nostdin`.
- ffprobe 8.x rejects `-of csv=p=0:s=' '` ("Failed to parse option string"). Use
  the default comma separator.
- macOS ships bash 3.2, which errors on empty array expansion under `set -u`.
  Hence the `${arr[@]+"${arr[@]}"}` guard.
- `serve.js` at the repo root has no `.mp4` MIME type, so it cannot serve these
  correctly. Use `python3 -m http.server 4801` locally, or add the type.
