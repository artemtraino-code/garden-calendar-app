# Dashboard Redesign Brief

This document captures the current app mechanics and the redesign requirements for the main dashboard. It is the working brief for rebuilding the interface so it is usable on desktop and mobile.

## Goal

The app is now a shared garden calendar with Google login and Supabase storage. The next product step is not to add more isolated controls, but to redesign the main dashboard around the real daily workflow:

- quickly see what must be done;
- understand what was missed;
- open and edit any task from its status button;
- create a new task for the active date;
- keep the same logic usable on a phone.

## Current Product Shape

The application has five main surfaces:

1. Login and user state.
2. Main work schedule dashboard.
3. Task create/edit dialog.
4. Settings dialog.
5. Data/backend layer.

### Login

Current behavior:

- The public GitHub Pages app is protected by Supabase Auth.
- Google OAuth is enabled through Supabase.
- `app_members` controls who can use the app.
- `artemtraino@gmail.com` is the current admin.
- Approved users can read and update the shared `garden_app_state` row.

Design impact:

- The app should show the signed-in user, but it should not waste header space.
- On mobile, the user label can move into a compact account/settings area.
- The app must clearly show a blocked/pending access state if a user is signed in but not approved.

### Main Dashboard

Current visible blocks:

- app title and current date;
- signed-in user;
- top actions: `График работ`, `Настройки`, `Новое задание`;
- horizontal date strip;
- unified work feed;
- task cards grouped by date/status/batch.

Current problem:

- The desktop card layout is closer to the target, but the phone view is too dense in the wrong places.
- The card has many important elements competing at the same visual level.
- The date strip and card feed need a clearer relationship.
- On mobile, actions should be thumb-friendly and predictable.

## Existing Mechanics To Preserve

### Statuses

System statuses:

- `planned` -> `Запланировано`
- `done` -> `Выполнено`
- `missed` -> `Пропущено`

Rules:

- A planned task whose date is before today is treated as missed.
- Missed is a real status in the UI and edit form.
- Status color must be consistent everywhere:
  - planned: blue;
  - done: green;
  - missed: red.

### Date Strip

Current intended behavior:

- Date tiles are navigation, not filters.
- Clicking a date scrolls the feed to the first card for that date.
- If there are no tasks on that date, the feed should show a compact empty state for that date.
- Date tiles show counters for all event statuses, not only planned tasks.

Redesign rule:

- The date strip should remain visible and tappable on mobile.
- Tile content must not wrap into awkward three-line states.
- Weekday, date, and status counters need a fixed compact rhythm.

### Task Cards

Current card content:

- date;
- work type with icon;
- culture with icon;
- preparations;
- note;
- status button.

Current card action rule:

- There is no separate settings gear in the feed.
- The status button opens the edit dialog.
- `Выполнено`, `Запланировано`, and `Пропущено` must all be clickable because the status button is the edit entrypoint.

Current grouping rule:

- When several cultures/groups/work types belong to one created batch, the feed should show one user-visible card, not duplicated cards.
- Editing should update the selected batch/record without duplicating separate culture cards.

### Task Form

New and edit should share one form template:

1. Status.
2. Group multi-picker.
3. Culture multi-picker.
4. Work multi-picker.
5. Date.
6. Repeat schedule.
7. Preparations multi-picker.
8. Note.
9. Bottom actions.

Repeat modes:

- `Не повторять`
- `Повторить один раз`
- `Повторить через`
- `Повторять каждые`

Repeat-from-done behavior:

- Done records expose `Удалить` and `Повторить`.
- `Повторить` opens a new planned task with copied groups, cultures, works, preparations, and note.
- The note receives `Повтор работ от <date>.`

### Settings

Settings is a fixed-size modal with tabs:

- groups/cultures;
- works;
- preparations.

Rules:

- Settings are the source of truth.
- Group and culture membership should use the same multi-picker pattern as the task form.
- Hidden hardcoded lists must not feed the UI.

## Mobile Problems To Solve

These are the current pain points to solve before adding more features:

- Header takes too much vertical space for repeated controls.
- The card is visually heavy and becomes hard to scan on phone.
- Status button competes with note/preparation text.
- Date, work, and culture need a stronger visual hierarchy.
- Preparation chips/images can overflow or wrap unpredictably.
- The date strip needs a stable touch layout.
- Main actions need to stay reachable without covering content.
- Dialog forms need better stacking and spacing on narrow screens.

## Proposed Dashboard Structure

### Desktop

Use a two-zone page:

1. Command header.
2. Work timeline.

Command header:

- left: app title/current date;
- center/left: `График работ`;
- right: `Настройки`, user/account, `Новое задание`.

Timeline:

- date strip at the top of the timeline panel;
- feed below;
- cards use a two-column internal grid:
  - left column: date, work, culture;
  - right column: preparations, note;
  - status button aligned to the card action area.

### Tablet

Keep the same information order, but reduce side spacing:

- date strip remains horizontal;
- card can keep two columns if width allows;
- preparations should wrap in a compact grid;
- status button stays at the top-right of the card.

### Mobile

Use one-column cards with fixed order:

1. Status button.
2. Date.
3. Work.
4. Culture.
5. Preparations.
6. Note.

Mobile header:

- first row: title + account/settings icon;
- second row: compact date strip or schedule tabs;
- primary action `Новое задание` can be a bottom/right floating button only if it does not cover cards. Safer first version: sticky top action inside the dashboard header.

Mobile card:

- status button full-width or right-aligned but not cramped;
- date should be a compact pill;
- work line should be the main title;
- culture line should be secondary;
- preparations must be compact and tappable later, but not bigger than the main task text;
- note must never overlap the status button.

## Card Layout Specification

### Desktop Card

```text
┌─────────────────────────────────────────────────────────────┐
│  18 мая             [status button]                         │
│  [work icon] Обработка                                      │
│  [culture icon] Петунии                                     │
│                                                             │
│  Topas [img]  Vertimek [img]  Megafol [img]                 │
│  Повторная обработка после баковой смеси...                 │
└─────────────────────────────────────────────────────────────┘
```

Recommended CSS structure:

- card root: `display: grid`;
- desktop grid columns: `minmax(220px, 0.9fr) minmax(320px, 1.4fr) auto`;
- mobile grid columns: `1fr`;
- status area: independent grid cell, never absolute-positioned.

### Mobile Card

```text
┌─────────────────────────────┐
│ [Пропущено]                 │
│ 18 мая                      │
│ [work icon] Обработка       │
│ [culture icon] Петунии      │
│ Topas   Vertimek            │
│ Megafol                     │
│ Повторная обработка...      │
└─────────────────────────────┘
```

Mobile card rules:

- no absolute/floating actions inside the card;
- no two-column content below `640px`;
- preparation text clamps to two lines;
- note uses normal flow, never overlay;
- minimum tap target for status: 40px height.

## Date Strip Specification

Date tile content:

```text
20 мая
ср
● 1  ● 2
```

Rules:

- fixed tile width on mobile with horizontal scroll;
- larger weekday than before, but still secondary to date;
- counters use colored dots or small pills:
  - green count for done;
  - blue count for planned;
  - red count for missed;
- tile background should reflect dominant/most urgent status:
  - missed wins over planned/done;
  - planned wins over done;
  - done if only completed;
  - neutral if no events.

## Navigation Rules

Clicking a date tile:

1. Keep the full feed data available.
2. Find the first card for that date.
3. Smooth-scroll the feed so the card starts fully visible below the date strip.
4. If no card exists, show inline empty state for that exact date.

Do not:

- filter away other cards permanently;
- jump without animation;
- show a temporary text like `Переход к 19 мая`.

## Data/Backend Requirements

Current backend:

- Supabase project `gsgyttuuqzpendxockdt`.
- Public app URL: `https://artemtraino-code.github.io/garden-calendar-app/`.
- Shared state row: `garden_app_state.id = main`.
- Membership table: `app_members`.
- Current admin: `artemtraino@gmail.com`.

Security rules:

- frontend uses only the public publishable Supabase key;
- RLS controls actual data access;
- Google OAuth secret and database password must not be committed;
- SQL setup and RLS fixes are documented in `docs/supabase-setup.md`, `docs/supabase-init.sql`, and `docs/supabase-rls-fix.sql`.

## Redesign Implementation Plan

### Step 1 - Freeze Current Behavior

- Keep current working Supabase/Auth state.
- Add screenshots for desktop and mobile before changes.
- Do not change data model during visual redesign.

### Step 2 - Refactor Card Markup

- Make card actions part of normal grid flow.
- Remove any layout dependencies that allow note/preparations to overlap status.
- Create a stable card anatomy:
  - `card-status`
  - `card-date`
  - `card-work`
  - `card-culture`
  - `card-preparations`
  - `card-note`

### Step 3 - Redesign CSS Responsiveness

Breakpoints:

- desktop: `>= 1024px`;
- tablet: `768px - 1023px`;
- mobile: `< 768px`;
- narrow phone: `< 420px`.

Use:

- CSS grid for card layout;
- fixed min/max sizes for date tiles;
- normal document flow for notes/actions;
- no absolute-positioned action buttons inside cards.

### Step 4 - Improve Mobile Header

- Reduce app header vertical height.
- Move secondary/account elements into a compact area.
- Keep `Новое задание` consistently reachable.

### Step 5 - Verify

Minimum visual QA:

- desktop 1280px;
- tablet 768px;
- phone 390px;
- phone narrow 360px.

Checks:

- no overlap between note and status;
- no clipped preparation names;
- date strip remains tappable;
- status button opens edit form;
- signed-in admin state survives reload;
- task creation saves to Supabase and reloads from Supabase.

## Acceptance Criteria

The dashboard redesign is done when:

- the phone layout is readable without horizontal page scroll;
- cards never overlap internally;
- the status button is clearly clickable and never floats over content;
- date navigation scrolls smoothly to date cards;
- empty date state is compact and does not add a second primary action;
- desktop remains information-dense but calm;
- settings remain separate from the main work flow;
- `npm run check` passes;
- GitHub Pages version is verified after deploy.

