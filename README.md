# Studio Joe

Static website for [studiojoe.dev](https://studiojoe.dev). Personal site covering code, camera, and everything in between.

## File structure

```
index.html      Homepage
resume.html     Resume page
public/         Static assets (SVGs, images)
vercel.json     Vercel deployment config
```

## Working locally

No build step. Just open `index.html` directly in a browser:

```
open index.html
```

Or serve with any static file server if you need relative paths to resolve correctly:

```
npx serve .
```

## Deployment

Deployed on Vercel. `vercel.json` sets `outputDirectory` to `.` and `framework` to `null`, so Vercel serves the repo root as a plain static site with no build command.
