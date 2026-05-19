# Development Roadmap

This document defines the working order for turning the current prototype into a stable application.

## Current Baseline

- Repository: `artemtraino-code/garden-calendar-app`
- Main branch: `main`
- Current stable local checkpoint: `b5b5301`
- Runtime: static browser app with `localStorage`
- UI entrypoint: `index.html`
- Main application logic: `src/app.js`
- Domain/date/task logic: `src/calendar.js`

## Product Direction

The app should remain a practical garden work planner:

- plan garden tasks by date;
- group tasks by cultures, groups, work types, and preparations;
- track statuses: planned, done, missed;
- repeat completed work based on real completion dates;
- later sync tasks to Google Calendar for phone notifications.

## Phase 1 - Stabilize Local App

Goal: make the current browser-local application reliable before adding backend sync.

Tasks:

1. Extract one reusable multi-picker component.
2. Extract one shared work form for `New task` and `Edit task`.
3. Extract one timeline card renderer.
4. Move status, repeat, and batch logic out of scattered UI handlers.
5. Remove hidden fallback lists from UI flows.
6. Keep all selectable entities sourced from settings.

Done when:

- `New task` and `Edit task` use the same data flow;
- all multi-select fields behave identically;
- batch tasks render as one card and edit as one linked set;
- `npm run check` passes.

## Phase 2 - Data Layer

Goal: prepare the app for migration from `localStorage` to backend-backed storage.

Tasks:

1. Document the canonical data model.
2. Add export/import for the full application state.
3. Add state versioning and migration functions.
4. Separate seed data from user data.
5. Add stable external IDs for future calendar sync.

Done when:

- every persisted entity has a clear shape;
- old local states can be migrated safely;
- data can be backed up and restored from the UI.

## Phase 3 - Free Publishing / PWA

Goal: publish the app cheaply before adding a paid backend.

Chosen first path:

- GitHub Pages for static hosting;
- PWA manifest and service worker for installable behavior;
- local browser storage for the first published version;
- JSON export/import before any multi-device sync;
- Google Calendar later as the phone notification channel.

Done when:

- the app opens from a GitHub Pages URL;
- Android can add it to the home screen;
- local development on `localhost` is not affected by service-worker cache;
- deployment is documented in `docs/deployment.md`.

## Phase 4 - Google Calendar Sync

Goal: duplicate planned garden tasks into Google Calendar for mobile notifications.

Tasks:

1. Finish Supabase backend sync layer.
2. Implement Google OAuth through Supabase Auth.
3. Store `googleEventId` on synced tasks.
4. Create Google Calendar events for planned tasks.
5. Update events when date/status/title changes.
6. Delete or cancel events when tasks are removed.

Done when:

- creating a task creates a Google Calendar event;
- editing date/title/status updates the event;
- deleting a task removes or marks the event;
- phone notifications come from Google Calendar.

## Phase 5 - PWA Hardening

Goal: make the web app installable on phone without building a native Android app first.

Tasks:

1. Add web app manifest.
2. Add service worker.
3. Add app icons.
4. Validate install behavior on Android.
5. Keep Google Calendar as the notification channel.

Done when:

- the app can be installed from the browser;
- it opens as a standalone app on phone;
- the core UI remains usable on mobile.

## Phase 6 - Backend And Multi-device

Goal: support cross-device usage and safer storage.

Possible options:

- Supabase;
- Firebase;
- Cloudflare Workers + D1;
- Vercel serverless + database.

Decision criteria:

- simple auth;
- low maintenance;
- easy Google OAuth integration;
- safe backup/export;
- predictable cost.

## Development Rules

- Keep `garden-calendar-app` separate from the store repository.
- Do not mix WooCommerce/site logic into this app.
- Do not add hidden test data as a UI source.
- Prefer small commits with one clear purpose.
- Verify UI changes in browser before committing.
- Run `npm run check` before push.
