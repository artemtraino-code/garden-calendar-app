# React redesign preparation

This branch prepares the garden calendar for a React-based dashboard redesign while keeping the current published static app intact.

## Current safety boundary

- `index.html` and `src/` remain the working legacy app.
- `react.html` and `src-react/` are the new prototype entrypoint.
- The current GitHub Pages app should not be replaced until the React dashboard is functionally complete and verified on mobile and desktop.

## Installed tooling

- Vite
- React
- React DOM
- TypeScript
- Vite React plugin
- lucide-react

Useful commands:

```bash
npm run dev:react
npm run build:react
npm run check
```

The local React prototype runs at:

```text
http://localhost:5299/react.html
```

## Data source rule

The React layer must not use the test seed data from the design archive as the source of truth.

The source of truth remains the existing app state:

- cultures and groups from `state.plants`
- work types from `state.workTypes`
- preparations from `state.preparations`
- planned and missed work from nested `plant.tasks`
- completed work from `state.log`

The first adapter is:

```text
src-react/adapters/legacyState.js
```

It converts the legacy state into a dashboard-friendly shape without changing saved data.

## Design archive integration rule

The useful design files from `Garden-Planner-Dashboard.zip` are in:

```text
artifacts/garden-calendar/src/
```

Important source components:

- `pages/Dashboard.tsx`
- `components/TaskCard.tsx`
- `components/DateStrip.tsx`
- `components/TaskDialog.tsx`
- `components/MultiPicker.tsx`
- `components/SettingsDialog.tsx`

These files should be used as design references, not copied blindly. The archive also contains Replit/workspace dependencies such as `catalog:` and `workspace:*`, so it cannot be dropped into this project unchanged.

## Current prototype decisions

- Desktop: preparations are compact mini-chips with local product images.
- Mobile: preparations become full-width readable cards with image plus two-line text.
- Status pill remains the main edit trigger.
- Date strip remains navigation, not a permanent filter.
- Empty dates render an explicit empty state.

## Next implementation steps

1. Replace the read-only prototype cards with editable React components.
2. Connect React save/delete/repeat actions to the existing storage/Supabase flow.
3. Port the shared multi-picker and use it everywhere.
4. Port task dialog and settings dialog.
5. Add mobile and desktop screenshot checks before switching GitHub Pages to the React build.
