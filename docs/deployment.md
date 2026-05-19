# Deployment

This document describes the low-budget publishing path for the garden calendar app.

## Current Choice

Use GitHub Pages first.

Why:

- no separate hosting cost;
- the repository is already on GitHub;
- the app is static and can run without a backend for the first public version;
- the same URL can later become a PWA installed on the phone;
- Google Calendar can be added later as a sync/notification layer.

## Repository

```text
https://github.com/artemtraino-code/garden-calendar-app
```

## Expected Public URL

If GitHub Pages is enabled for this repository, the default URL should be:

```text
https://artemtraino-code.github.io/garden-calendar-app/
```

If the repository stays private, GitHub may require a paid GitHub plan for Pages. If that blocks publication, the cheapest alternatives are:

1. make this standalone repository public;
2. publish the same static files on Cloudflare Pages free tier;
3. publish later on `calendar.seeds.dp.ua` when hosting configuration is ready.

## GitHub Pages Setup

The repository contains:

```text
.github/workflows/deploy-pages.yml
```

After pushing to `main`, GitHub Actions can deploy the static app to Pages.

If Pages is not enabled automatically:

1. open repository settings;
2. go to `Pages`;
3. set source to `GitHub Actions`;
4. run the `Deploy GitHub Pages` workflow again.

## PWA Files

```text
manifest.webmanifest
sw.js
src/assets/app-icon.svg
```

Important:

- `sw.js` is registered only outside `localhost`;
- this avoids stale-cache problems during local UI development;
- on the published site, the service worker caches the app shell for faster repeat loading.

## Data Storage For This Stage

Current stage:

- browser `localStorage`;
- no paid database;
- no Google account required.

Next low-budget data step:

1. add JSON export/import in the UI;
2. add a full-state backup file format;
3. then test Google Sheets or Apps Script as a budget sync layer;
4. then add Google Calendar event sync.

## Phone Usage

On Android:

1. open the GitHub Pages URL in Chrome;
2. open browser menu;
3. choose `Add to Home screen` or `Install app`;
4. launch it from the phone home screen.

Phone notifications should be handled later through Google Calendar, not through browser push at this stage.
