# Invisible Fires

A plain-English, interactive guide to how the internet works, the invisible fires Site Reliability Engineers quietly put out every day, and what actually happens during major cloud outages.

Built with zero frameworks and zero build steps—pure HTML, CSS (`Manrope` typography, dark-mode default), modular ES JavaScript, and an automated GitHub Actions status feed.

## What's Inside

* **Overview (`#home`)** — Pick-and-choose landing page with an interactive *Surface vs. Underneath* canvas where tapping sparks invisible fires that get quietly contained.
* **Right now (`#now`)** — Live cloud health across Google Cloud, AWS, Microsoft Azure, Cloudflare, and GitHub, paired with plain-English explanations of recent verified outages (plus an active-outage preview toggle).
* **How it works (`#how`)** — Six one-concept-at-a-time scrollytelling chapters on the left paired with a sticky interactive visual stage on the right (pre-flight checks, progressive `1% → 5% → 25% → 50% → 100%` rollout waves, real buildings around the world, one round-trip tap, interactive break-a-building fire test, and why big outages still happen).
* **Famous outages (`#famous`)** — Interactive visual replays of five high-visibility outages (**CrowdStrike 2024**, **Facebook 2021**, **Google Cloud 2025**, **Cloudflare 2025**, **Fastly 2021**) backed by verified primary engineering reports.

## Shareable Deep Links

Because routing uses clean URL hashes, you can text or link straight to any section from a blog post:

* `#now` — Jump straight to live status & recent outages
* `#how` — Jump straight to the interactive walkthrough
* `#famous/crowdstrike`, `#famous/facebook`, `#famous/gcp`, `#famous/cloudflare`, `#famous/fastly` — Jump straight to a specific case study

## Automated Live Status Feed

[`.github/workflows/update-status.yml`](.github/workflows/update-status.yml) runs [`scripts/update-status.mjs`](scripts/update-status.mjs) every 30 minutes:

1. Polls official public status endpoints for Google Cloud, AWS, Microsoft Azure, Cloudflare, and GitHub.
2. Translates any active major disruption into a calm, jargon-free explanation and maps it to the affected diagram layer.
3. Merges live state with curated verified recent outages in [`data/curated-recent.json`](data/curated-recent.json) and writes [`data/live-status.json`](data/live-status.json).
4. Commits only when status meaningfully changes (no noisy commits on quiet days).

## Running Locally

Serve the repository over any static HTTP server (needed for ES modules and `fetch('./data/live-status.json')`):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

To test the live status updater locally:

```bash
node scripts/update-status.mjs
```

## Deploying on GitHub Pages

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Every push to `main` (and any status change committed by the updater) deploys automatically via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).
