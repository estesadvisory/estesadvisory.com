# estesadvisory.com

Static marketing site for **Estes Advisory LLC** — blueprint / architectural drafting aesthetic.

## Stack

- Pure static HTML / CSS / JS (no build step required for content edits)
- Cal.com inline embed for scheduling
- Designed for **Amazon S3** (static website hosting) or any object store / CDN

## Local preview

```bash
npx serve . -l 8080
# or: npm run dev
```

## Deploy to S3

```bash
aws s3 sync . s3://YOUR-BUCKET --delete \
  --exclude ".git/*" --exclude "node_modules/*" --exclude "README.md" --exclude "package.json" --exclude ".github/*"
```

## Cal.com

1. Create a Cal.com account and event type (e.g. “Intro call”).
2. Update `js/main.js` → `ESTES_CONFIG.calLink` to `your-username/event-slug`.
3. Update the “Open Cal.com” button href in `index.html` to match.

## Design

See GitHub issue #2: light blueprint paper, thin cyan drafting lines, dark ink, restrained amber pops.

## Issues tracked

- #1 Cal.com integration
- #2 Blueprint look & feel
