export const TASK_LABELS = {
  plant: "Посадка",
  water: "Полив",
  feed: "Подкормка",
  treat: "Обработка",
  prune: "Обрезка",
  inspect: "Осмотр",
  harvest: "Сбор",
  repot: "Пересадка",
};

export const TASK_ICONS = {
  plant: "ti-plant",
  water: "ti-droplet",
  feed: "ti-leaf",
  treat: "ti-bug",
  prune: "ti-scissors",
  inspect: "ti-search",
  harvest: "ti-basket",
  repot: "ti-plant",
};

export const PLANT_TYPE_LABELS = {
  flower: "Цветы",
  veg: "Овощи",
  herb: "Зелень",
  other: "Другое",
};

export const PREPARATION_CATEGORY_LABELS = {
  fungicide: "Фунгицид",
  insecticide: "Инсектицид",
  fertilizer: "Удобрение",
  stimulant: "Стимулятор",
  adjuvant: "Прилипач",
  mix: "Смесь",
  other: "Другое",
};

export const DEFAULT_INTERVALS = {
  plant: { flower: 365, veg: 365, herb: 365, other: 365 },
  water: { flower: 3, veg: 3, herb: 2, other: 7 },
  feed: { flower: 14, veg: 10, herb: 21, other: 14 },
  treat: { flower: 21, veg: 14, herb: 30, other: 21 },
  prune: { flower: 30, veg: 10, herb: 10, other: 30 },
  inspect: { flower: 7, veg: 7, herb: 7, other: 7 },
  harvest: { flower: 7, veg: 3, herb: 5, other: 7 },
  repot: { flower: 90, veg: 60, herb: 45, other: 90 },
};

export function todayIso() {
  return toIsoDate(new Date());
}

export function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function addDays(isoDate, days) {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + Number(days || 0));
  return toIsoDate(date);
}

export function diffInDays(isoDate, baseIso = todayIso()) {
  const date = parseIsoDate(isoDate);
  const base = parseIsoDate(baseIso);
  if (!date || !base) return 0;
  return Math.round((date.getTime() - base.getTime()) / 86400000);
}

export function taskStatus(nextDate, baseIso = todayIso()) {
  const diff = diffInDays(nextDate, baseIso);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "upcoming";
  return "future";
}

export function systemTaskStatus(nextDate, baseIso = todayIso()) {
  return diffInDays(nextDate, baseIso) < 0 ? "missed" : "planned";
}

export function formatDate(isoDate, options = {}) {
  const date = parseIsoDate(isoDate);
  if (!date) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: options.long ? "long" : "short",
    year: options.year ? "numeric" : undefined,
  }).format(date);
}

export function formatWeekday(isoDate, options = {}) {
  const date = parseIsoDate(isoDate);
  if (!date) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: options.long ? "long" : "short",
  }).format(date);
}

export function makeId(prefix) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function getAllTasks(plants, baseIso = todayIso()) {
  return plants.flatMap((plant) =>
    plant.tasks.map((task) => ({
      plant,
      task,
      diff: diffInDays(task.nextDate, baseIso),
      status: taskStatus(task.nextDate, baseIso),
      systemStatus: systemTaskStatus(task.nextDate, baseIso),
    })),
  );
}

export function completeTask({ plant, task, doneDate, note, interval, repeat, repeatMode, repeatDate }) {
  const mode = repeatMode || (repeat ? "repeat" : "stop");
  const nextScheduled = mode === "repeat" || mode === "after"
    ? addDays(doneDate, interval)
    : mode === "calendar" || mode === "again"
      ? repeatDate || task.repeatDate || ""
      : "";
  const noteText = String(note || "").trim();
  const nextTaskNote = buildRepeatFollowupNote(noteText, doneDate);
  const preparationIds = normalizePreparationIds(task);
  const logEntry = {
    id: makeId("log"),
    batchId: task.batchId || "",
    plantId: plant.id,
    plantName: plant.name,
    taskId: task.id,
    taskType: task.type,
    preparationId: preparationIds[0] || "",
    preparationIds,
    doneDate,
    note: note.trim(),
    nextScheduled,
  };

  if (mode === "repeat") {
    task.nextDate = nextScheduled;
    task.interval = Number(interval);
    task.repeat = true;
    task.repeatMode = "repeat";
    task.repeatDate = "";
    task.notes = nextTaskNote;
  } else if ((mode === "after" || mode === "calendar" || mode === "again") && nextScheduled) {
    task.nextDate = nextScheduled;
    task.interval = Number(interval || task.interval || 14);
    task.repeat = false;
    task.repeatMode = "once";
    task.repeatDate = "";
    task.notes = nextTaskNote;
  } else {
    plant.tasks = plant.tasks.filter((item) => item.id !== task.id);
  }

  return logEntry;
}

export function normalizeTask(task, plantType = "other") {
  const type = task.type || "water";
  const preparationIds = normalizePreparationIds(task);
  const repeatMode = normalizeRepeatMode(task);
  return {
    id: task.id || makeId("task"),
    batchId: String(task.batchId || "").trim(),
    type,
    preparationId: preparationIds[0] || "",
    preparationIds,
    nextDate: task.nextDate || todayIso(),
    interval: Number(task.interval || DEFAULT_INTERVALS[type]?.[plantType] || 14),
    repeat: repeatMode === "repeat",
    repeatMode,
    repeatDate: task.repeatDate || "",
    notes: task.notes?.trim() || "",
  };
}

function buildRepeatFollowupNote(note, doneDate) {
  const cleanNote = stripRepeatLead(note);
  const lead = `Повтор работ от ${formatDate(doneDate)}.`;
  return cleanNote ? `${lead} ${cleanNote}` : lead;
}

function stripRepeatLead(note = "") {
  return String(note || "")
    .trim()
    .replace(/^Повтор\s+работ\s+от\s+[^.]+?\.\s*/i, "")
    .trim();
}

export function normalizePlant(plant) {
  const type = plant.type || "other";
  return {
    id: plant.id || makeId("plant"),
    name: plant.name?.trim() || "",
    entryKind: plant.entryKind === "group" ? "group" : "culture",
    type,
    typeLabel: plant.typeLabel?.trim() || "",
    groupIds: Array.isArray(plant.groupIds) ? [...new Set(plant.groupIds.map((id) => String(id || "").trim()).filter(Boolean))] : [],
    icon: plant.icon?.trim() || "",
    planted: plant.planted || todayIso(),
    location: plant.location?.trim() || "",
    notes: plant.notes?.trim() || "",
    tasks: (plant.tasks || []).map((task) => normalizeTask(task, type)),
  };
}

export function normalizePreparation(preparation) {
  return {
    id: preparation.id || makeId("prep"),
    name: preparation.name?.trim() || "",
    category: preparation.category || "other",
    image: preparation.image?.trim() || "",
    dosage: preparation.dosage?.trim() || "",
    waitingPeriod: preparation.waitingPeriod?.trim() || "",
    description: preparation.description?.trim() || "",
  };
}

function normalizePreparationIds(task) {
  const ids = Array.isArray(task?.preparationIds) ? task.preparationIds : [task?.preparationId];
  return [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))];
}

function normalizeRepeatMode(task) {
  if (["once", "after", "repeat", "calendar"].includes(task?.repeatMode)) return task.repeatMode;
  if (task?.repeatMode === "again") return "calendar";
  return task?.repeat === false ? "once" : "repeat";
}
