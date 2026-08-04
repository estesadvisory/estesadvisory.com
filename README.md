# Estes Advisory — static site

Light-theme blueprint marketing site for [estesadvisory.com](https://estesadvisory.com).
Pure static HTML/CSS/JS — no build step required for S3.

## Local / preview

Files live in this folder:

```text
site/
  index.html
  assets/
    styles.css
    main.js
    logo.svg
```

## Deploy to S3 static website hosting

1. Optional: set your Cal.com link in `index.html` (`window.ESTES_CAL_LINK = "username/event"`).
2. Sync the **contents** of `site/` (not the parent folder) to your bucket:

```bash
aws s3 sync ./site s3://YOUR_BUCKET_NAME/ --delete
```

3. Enable **Static website hosting** on the bucket (index document: `index.html`).
4. If you use CloudFront, invalidate `/*` after deploy.
5. MIME types should already be correct for `.html`, `.css`, `.js`, `.svg`.

### Bucket policy (public read example)

Only if the bucket is meant to be public website origin:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

## Cal.com

Issue: integrate booking.

1. Create event type(s) in Cal.com.
2. Set `window.ESTES_CAL_LINK` in `index.html`, **or** hardcode the `href` on `#cal-link`.
3. Later: optional embed (inline / floating button) from Cal.com’s snippet generator.

## Design notes

- Light paper background with thin blueprint grid
- IBM Plex Sans + Mono
- Thin borders, corner marks, mono labels (`DWG · EA-001`)
- Mobile-first; sticky nav; single-page anchors
