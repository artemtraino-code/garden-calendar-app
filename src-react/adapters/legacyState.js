import { formatDate, formatWeekday, systemTaskStatus, todayIso } from "../../src/calendar.js";

const statusLabel = {
  planned: "Запланировано",
  done: "Выполнено",
  missed: "Пропущено",
};

export function toDashboardState(state) {
  const plants = Array.isArray(state?.plants) ? state.plants : [];
  const preparations = Array.isArray(state?.preparations) ? state.preparations : [];
  const workTypes = Array.isArray(state?.workTypes) ? state.workTypes : [];
  const log = Array.isArray(state?.log) ? state.log : [];

  const groups = plants.filter((plant) => plant.entryKind === "group");
  const cultures = plants.filter((plant) => plant.entryKind !== "group");
  const taskMap = new Map();

  cultures.forEach((plant) => {
    (plant.tasks || []).forEach((task) => {
      const key = task.batchId || task.id;
      const existing = taskMap.get(key) || {
        id: key,
        sourceIds: [],
        status: systemTaskStatus(task.nextDate),
        date: task.nextDate,
        workTypeIds: [],
        cultureIds: [],
        groupIds: [],
        preparationIds: [],
        repeatMode: task.repeatMode || "once",
        interval: task.interval || 0,
        note: task.notes || "",
      };

      existing.sourceIds.push(task.id);
      existing.status = mergeStatus(existing.status, systemTaskStatus(task.nextDate));
      existing.date = earliestDate(existing.date, task.nextDate);
      existing.workTypeIds = unique([...existing.workTypeIds, task.type]);
      existing.cultureIds = unique([...existing.cultureIds, plant.id]);
      existing.groupIds = unique([...existing.groupIds, ...(plant.groupIds || [])]);
      existing.preparationIds = unique([...existing.preparationIds, ...(task.preparationIds || [])]);
      existing.note ||= task.notes || "";
      taskMap.set(key, existing);
    });
  });

  log.forEach((entry) => {
    const key = entry.batchId || entry.id;
    const existing = taskMap.get(key) || {
      id: key,
      sourceIds: [],
      status: "done",
      date: entry.doneDate,
      workTypeIds: [],
      cultureIds: [],
      groupIds: [],
      preparationIds: [],
      repeatMode: "once",
      interval: 0,
      note: entry.note || "",
    };

    existing.status = existing.status === "missed" || existing.status === "planned" ? existing.status : "done";
    existing.date = earliestDate(existing.date, entry.doneDate);
    existing.workTypeIds = unique([...existing.workTypeIds, entry.taskType].filter(Boolean));
    existing.cultureIds = unique([...existing.cultureIds, entry.plantId].filter(Boolean));
    existing.preparationIds = unique([
      ...existing.preparationIds,
      ...(Array.isArray(entry.preparationIds) ? entry.preparationIds : [entry.preparationId]),
    ].filter(Boolean));
    existing.note ||= entry.note || "";
    taskMap.set(key, existing);
  });

  return {
    today: todayIso(),
    groups,
    cultures,
    workTypes,
    preparations,
    tasks: [...taskMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function taskStatusMeta(status) {
  return {
    label: statusLabel[status] || statusLabel.planned,
    tone: status === "done" ? "done" : status === "missed" ? "missed" : "planned",
  };
}

export function displayDate(date) {
  return formatDate(date, { long: true });
}

export function displayWeekday(date) {
  return formatWeekday(date, { long: true });
}

export function byId(list, id) {
  return list.find((item) => item.id === id);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function earliestDate(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function mergeStatus(left, right) {
  const priority = { missed: 3, planned: 2, done: 1 };
  return priority[right] > priority[left] ? right : left;
}
