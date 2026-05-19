# Data Model

This document describes the canonical data model for the current app and the next backend-ready version.

## Principles

- Settings are the source of truth.
- UI lists must be derived from saved entities, not hidden arrays.
- Dates are stored as date-only strings: `YYYY-MM-DD`.
- Do not use UTC `toISOString()` for calendar dates.
- User data must remain exportable as one JSON state.

## State Root

```js
{
  version: 1,
  plants: [],
  preparations: [],
  workTypes: [],
  log: []
}
```

Current code still uses `plants` for both cultures and groups. That is acceptable for the prototype, but the next data layer should split them.

## Target State Root

```js
{
  version: 2,
  groups: [],
  cultures: [],
  workTypes: [],
  preparations: [],
  tasks: [],
  log: [],
  sync: {}
}
```

## Group

```js
{
  id: "group_flowers",
  name: "Цветы",
  icon: "blossom",
  cultureIds: ["culture_petunia", "culture_rose"],
  createdAt: "2026-05-20",
  updatedAt: "2026-05-20"
}
```

Rules:

- A group can contain many cultures.
- A group does not contain tasks directly.
- Renaming a group should update UI labels everywhere through ID references.

## Culture

```js
{
  id: "culture_petunia",
  name: "Петунии",
  icon: "blossom",
  groupIds: ["group_flowers"],
  createdAt: "2026-05-20",
  updatedAt: "2026-05-20"
}
```

Rules:

- A culture can belong to many groups.
- A culture should not carry old fields such as `planted`, `location`, or `notes` unless they become real product requirements again.

## Work Type

```js
{
  id: "work_treat",
  name: "Обработка",
  icon: "bug",
  createdAt: "2026-05-20",
  updatedAt: "2026-05-20"
}
```

Rules:

- Work types are templates.
- Work types should not own default interval logic in the settings UI.

## Preparation

```js
{
  id: "prep_topas",
  name: "Топаз (3 мл)",
  category: "fungicide",
  image: "./src/assets/preparations/prep_topas.webp",
  purposeShort: "від борошнистої роси",
  dosage: "Уточнить по инструкции препарата перед применением",
  waitingPeriod: "14 дней",
  description: "..."
}
```

Rules:

- Existing bundled images stay local.
- New uploaded images can remain browser-local until backend storage exists.
- `purposeShort` should be short enough for one-line dropdown display.

## Task

```js
{
  id: "task_...",
  batchId: "batch_...",
  status: "planned",
  date: "2026-05-20",
  groupIds: ["group_flowers"],
  cultureIds: ["culture_petunia", "culture_rose"],
  workTypeIds: ["work_treat"],
  preparationIds: ["prep_topas"],
  repeat: {
    mode: "none",
    intervalDays: 0,
    repeatDate: ""
  },
  notes: "",
  googleEventId: "",
  createdAt: "2026-05-20",
  updatedAt: "2026-05-20"
}
```

Status values:

- `planned`
- `done`
- `missed`

Repeat modes:

- `none`
- `once`
- `after`
- `repeat`

Rules:

- A task can target many cultures and many work types.
- `batchId` groups linked internal records as one user-visible card.
- The visible timeline should render one card per batch.
- `googleEventId` is empty until Google Calendar sync is enabled.

## Log Entry

```js
{
  id: "log_...",
  batchId: "batch_...",
  doneDate: "2026-05-20",
  groupIds: ["group_flowers"],
  cultureIds: ["culture_petunia"],
  workTypeIds: ["work_treat"],
  preparationIds: ["prep_topas"],
  note: "Повтор работ от 17 мая...",
  nextScheduled: "2026-05-27",
  sourceTaskId: "task_...",
  createdAt: "2026-05-20"
}
```

Rules:

- Completed work should preserve the exact data snapshot.
- Repeated work should reference the latest completed date, not the original first date.

## Migration Plan

Current prototype data can be migrated as follows:

1. `plants` with `entryKind: "group"` become `groups`.
2. `plants` with `entryKind !== "group"` become `cultures`.
3. `plant.tasks` become root-level `tasks`.
4. `plant.type`, `location`, and old category fields are converted to group links where possible.
5. `log` entries receive `cultureIds`, `workTypeIds`, and `batchId` if missing.

## Storage

Current:

- Browser `localStorage`

Next:

- Export/import JSON in UI
- Versioned state
- Backend database after Google Calendar sync requirements are finalized

## Validation Rules

Minimum required fields:

- group: `id`, `name`
- culture: `id`, `name`
- work type: `id`, `name`
- preparation: `id`, `name`
- task: `id`, `date`, `status`, at least one `cultureId`, at least one `workTypeId`

Invalid state should be repaired by migration where safe, or blocked in the UI before save.
