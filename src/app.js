import {
  DEFAULT_INTERVALS,
  PLANT_TYPE_LABELS,
  TASK_ICONS,
  TASK_LABELS,
  completeTask,
  formatDate,
  getAllTasks,
  makeId,
  normalizePlant,
  normalizeTask,
  todayIso,
} from "./calendar.js";
import { loadState, saveState } from "./storage.js";

let state = loadState();
let activeTab = "today";
let dashboardView = "timeline";
let selectedWeekDate = "";

const els = {
  todayLabel: document.querySelector("#today-label"),
  calendarPanel: document.querySelector(".calendar-panel"),
  workPanel: document.querySelector(".work-panel"),
  workPanelEyebrow: document.querySelector("#work-panel-eyebrow"),
  workPanelTitle: document.querySelector("#work-panel-title"),
  statsRow: document.querySelector("#stats-row"),
  urgentList: document.querySelector("#urgent-list"),
  upcomingList: document.querySelector("#upcoming-list"),
  weekStrip: document.querySelector("#week-strip"),
  timelineLabel: document.querySelector("#timeline-label"),
  quickPlan: document.querySelector("#quick-plan"),
  miniLog: document.querySelector("#mini-log"),
  plantGrid: document.querySelector("#plant-grid"),
  logSearch: document.querySelector("#log-search"),
  logList: document.querySelector("#log-list"),
  plantDialog: document.querySelector("#plant-dialog"),
  plantForm: document.querySelector("#plant-form"),
  plantDialogTitle: document.querySelector("#plant-dialog-title"),
  taskRows: document.querySelector("#task-rows"),
  taskRowTemplate: document.querySelector("#task-row-template"),
  doneDialog: document.querySelector("#done-dialog"),
  doneForm: document.querySelector("#done-form"),
  doneDialogTitle: document.querySelector("#done-dialog-title"),
  workDialog: document.querySelector("#work-dialog"),
  workForm: document.querySelector("#work-form"),
  workDialogTitle: document.querySelector("#work-dialog-title"),
  workTaskId: document.querySelector("#work-task-id"),
  workPlantId: document.querySelector("#work-plant-id"),
  workType: document.querySelector("#work-type"),
  workNextDate: document.querySelector("#work-next-date"),
  workInterval: document.querySelector("#work-interval"),
  workRepeat: document.querySelector("#work-repeat"),
  workNotes: document.querySelector("#work-notes"),
  workSubmitButton: document.querySelector("#work-submit-btn"),
};

bindEvents();
render();

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.querySelector("#add-plant-btn").addEventListener("click", () => openPlantDialog());
  document.querySelector("#quick-add-plant-btn").addEventListener("click", () => openWorkDialog({ type: "plant" }));
  document.querySelector("#quick-add-work-btn").addEventListener("click", () => openWorkDialog());
  document.querySelector("#add-task-row-btn").addEventListener("click", () => addTaskRow());
  document.querySelector("#clear-log-btn").addEventListener("click", clearLog);

  els.statsRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dashboard-view]");
    if (button) setDashboardView(button.dataset.dashboardView);
  });
  els.quickPlan.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dashboard-view]");
    if (button) setDashboardView(button.dataset.dashboardView);
  });
  els.weekStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-week-date]");
    if (button) setWeekDate(button.dataset.weekDate);
  });

  els.logSearch.addEventListener("input", renderLog);
  els.plantForm.addEventListener("submit", savePlantFromForm);
  els.doneForm.addEventListener("submit", saveDoneFromForm);
  els.workForm.addEventListener("submit", saveWorkFromForm);
  els.workPlantId.addEventListener("change", () => updateWorkIntervalDefault());
  els.workType.addEventListener("change", () => updateWorkIntervalDefault());
  els.workRepeat.addEventListener("change", () => updateWorkIntervalDefault({ resetInterval: false }));

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
  });

  els.plantDialog.addEventListener("click", closeDialogOnBackdrop);
  els.doneDialog.addEventListener("click", closeDialogOnBackdrop);
  els.workDialog.addEventListener("click", closeDialogOnBackdrop);

  els.plantGrid.addEventListener("click", onPlantGridClick);
  els.urgentList.addEventListener("click", onDashboardListClick);
  els.upcomingList.addEventListener("click", onReminderClick);
}

function render() {
  const todayLabel = formatDate(todayIso(), { long: true, year: true });
  els.todayLabel.textContent = todayLabel;
  renderStats();
  renderToday();
  renderPlants();
  renderLog();
}

function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  document.querySelectorAll(".section").forEach((section) => section.classList.remove("active"));
  document.querySelector(`#tab-${tabName}`).classList.add("active");
  render();
}

function setDashboardView(view) {
  dashboardView = view || "timeline";
  switchTab("today");
}

function persistAndRender() {
  saveState(state);
  render();
}

function renderStats() {
  const tasks = getAllTasks(state.plants);
  const future = tasks.filter((item) => item.diff >= 0).length;

  els.statsRow.innerHTML = `
    ${statCard(future, "Ближайшие дни", "focus", "вся лента работ", "timeline")}
  `;
}

function statCard(value, label, tone, caption, view) {
  return `
    <button class="stat ${tone} ${dashboardView === view ? "active" : ""}" type="button" data-dashboard-view="${view}">
      <div class="stat-val">${value}</div>
      <div class="stat-lbl">${escapeHtml(label)}</div>
      <div class="stat-caption">${escapeHtml(caption)}</div>
    </button>
  `;
}

function renderToday() {
  const tasks = getAllTasks(state.plants).sort((a, b) => a.diff - b.diff || a.plant.name.localeCompare(b.plant.name, "uk"));
  const futureTasks = tasks.filter((item) => item.diff >= 0);
  const timelineTasks = selectedWeekDate ? futureTasks.filter((item) => item.task.nextDate === selectedWeekDate) : futureTasks;
  const panel = getDashboardPanel(tasks);
  const isTimeline = dashboardView === "timeline";

  els.calendarPanel.classList.toggle("is-hidden", !isTimeline);
  els.workPanel.classList.toggle("is-hidden", isTimeline);
  els.workPanelEyebrow.textContent = panel.eyebrow;
  els.workPanelTitle.textContent = panel.title;
  els.urgentList.innerHTML = panel.html;
  els.timelineLabel.textContent = selectedWeekDate ? `Фильтр: ${formatDate(selectedWeekDate)}` : "Все будущие работы";
  els.upcomingList.innerHTML = timelineTasks.length
    ? timelineTasks.map(timelineCard).join("")
    : emptyState(selectedWeekDate ? `На ${formatDate(selectedWeekDate)} работ нет` : "Будущих работ нет");
  renderWeekStrip(tasks);
  renderQuickPlan(tasks);
  renderMiniLog();
  renderDashboardControls();
}

function setWeekDate(isoDate) {
  selectedWeekDate = selectedWeekDate === isoDate ? "" : (isoDate || "");
  renderToday();
}

function getDashboardPanel(tasks) {
  const views = {
    timeline: {
      eyebrow: "Ближайшие дни",
      title: "Все будущие работы",
      items: tasks.filter((item) => item.diff >= 0),
      empty: "Будущих работ нет",
    },
    due: {
      eyebrow: "Приоритет",
      title: "Сделать сейчас",
      items: tasks.filter((item) => item.diff <= 0),
      empty: "На сегодня все закрыто",
    },
    overdue: {
      eyebrow: "Просрочено",
      title: "Опоздавшие работы",
      items: tasks.filter((item) => item.diff < 0),
      empty: "Просроченных работ нет",
    },
    week: {
      eyebrow: "План на неделю",
      title: "Все работы на 7 дней",
      items: tasks.filter((item) => item.diff >= 0 && item.diff <= 7),
      empty: "На ближайшие 7 дней работ нет",
    },
    water: {
      eyebrow: "Быстрый фильтр",
      title: "Поливы",
      items: tasks.filter((item) => item.task.type === "water"),
      empty: "Поливов пока нет",
    },
    treat: {
      eyebrow: "Быстрый фильтр",
      title: "Обработки",
      items: tasks.filter((item) => item.task.type === "treat"),
      empty: "Обработок пока нет",
    },
    plants: {
      eyebrow: "Объекты",
      title: "Культуры и группы",
      plants: state.plants,
      empty: "Объектов пока нет",
    },
  };

  const panel = views[dashboardView] || views.timeline;
  if (panel.plants) {
    return {
      ...panel,
      html: `${panel.plants.length ? panel.plants.map(plantCard).join("") : emptyState(panel.empty)}
        <button class="add-btn inline-add-btn" type="button" data-action="add-plant"><i class="ti ti-plus"></i> Добавить объект</button>`,
    };
  }

  return {
    ...panel,
    html: panel.items.length ? panel.items.map(reminderCard).join("") : emptyState(panel.empty),
  };
}

function renderDashboardControls() {
  document.querySelectorAll("[data-dashboard-view]").forEach((control) => {
    control.classList.toggle("active", control.dataset.dashboardView === dashboardView);
  });
}

function reminderCard(item, compact = false) {
  const statusClass = item.status === "overdue" ? "overdue-card" : item.status === "today" ? "today-card" : "";
  const dateText = item.diff < 0
    ? `Просрочено ${Math.abs(item.diff)} дн.`
    : item.diff === 0
      ? "Сегодня"
      : `Через ${item.diff} дн. - ${formatDate(item.task.nextDate)}`;
  const title = `${TASK_LABELS[item.task.type] || item.task.type} - ${item.plant.name}`;

  return `
    <article class="reminder-card ${statusClass} ${compact ? "is-compact" : ""}">
      <div class="task-icon task-${item.task.type}"><i class="ti ${TASK_ICONS[item.task.type] || "ti-calendar"}"></i></div>
      <div class="reminder-info">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(dateText)} · ${item.task.repeat === false ? "разовая работа" : `каждые ${item.task.interval} дн.`}${item.task.notes ? ` · ${escapeHtml(item.task.notes)}` : ""}</p>
      </div>
      <div class="card-actions">
        <button class="action-pill action-edit" type="button" data-action="edit-task" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}">
          <i class="ti ti-pencil"></i> Редактировать
        </button>
        <button class="action-pill action-done" type="button" data-action="done" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}">
          <i class="ti ti-check"></i> Сделано
        </button>
      </div>
    </article>
  `;
}

function timelineCard(item) {
  const statusClass = item.status === "today" ? "today-card" : "";
  const workTitle = `${TASK_LABELS[item.task.type] || item.task.type} - ${item.plant.name}`;
  const repeatText = item.task.repeat === false ? "разовая работа" : `каждые ${item.task.interval} дн.`;

  return `
    <article class="reminder-card timeline-card ${statusClass}">
      <div class="task-icon task-${item.task.type}"><i class="ti ${TASK_ICONS[item.task.type] || "ti-calendar"}"></i></div>
      <div class="reminder-info">
        <h3>${escapeHtml(timelineDateTitle(item))}</h3>
        <p><strong>${escapeHtml(workTitle)}</strong> · ${escapeHtml(repeatText)}${item.task.notes ? ` · ${escapeHtml(item.task.notes)}` : ""}</p>
      </div>
      <div class="card-actions">
        <button class="action-pill action-edit" type="button" data-action="edit-task" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}">
          <i class="ti ti-pencil"></i> Редактировать
        </button>
        <button class="action-pill action-done" type="button" data-action="done" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}">
          <i class="ti ti-check"></i> Сделано
        </button>
      </div>
    </article>
  `;
}

function timelineDateTitle(item) {
  return item.diff === 0 ? `Сегодня, ${formatDate(item.task.nextDate)}` : formatDate(item.task.nextDate);
}

function renderWeekStrip(tasks) {
  const days = [];
  let date = todayIso();
  for (let i = 0; i < 7; i += 1) {
    const iso = i === 0 ? date : addOneDay(days[i - 1].iso);
    const count = tasks.filter((item) => item.task.nextDate === iso).length;
    days.push({ iso, count });
  }

  els.weekStrip.innerHTML = days.map((day, index) => `
    <button class="day-pill ${index === 0 ? "today" : ""} ${day.count ? "busy" : ""} ${selectedWeekDate === day.iso ? "active" : ""}" type="button" data-week-date="${day.iso}">
      <span>${formatDate(day.iso)}</span>
    </button>
  `).join("");
}

function renderQuickPlan(tasks) {
  const overdue = tasks.filter((item) => item.diff < 0).length;
  const today = tasks.filter((item) => item.diff === 0).length;
  const week = tasks.filter((item) => item.diff >= 0 && item.diff <= 7).length;
  const due = overdue + today;

  els.quickPlan.innerHTML = `
    ${controlItem(due, "К выполнению", "просрочено + сегодня", "due")}
    ${controlItem(week, "На 7 дней", "работы впереди", "week", "info")}
    ${controlItem(overdue, "Просрочено", "нужно закрыть первыми", "overdue", "danger")}
  `;
}

function controlItem(value, label, caption, view, tone = "") {
  return `
    <button class="quick-item ${tone} ${dashboardView === view ? "active" : ""}" type="button" data-dashboard-view="${view}">
      <strong>${value}</strong>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(caption)}</small>
    </button>
  `;
}

function renderMiniLog() {
  const entries = [...state.log].sort((a, b) => b.doneDate.localeCompare(a.doneDate)).slice(0, 4);
  els.miniLog.innerHTML = entries.length ? entries.map((entry) => `
    <div class="mini-log-row">
      <span class="task-dot task-${entry.taskType}"></span>
      <div>
        <strong>${escapeHtml(TASK_LABELS[entry.taskType] || entry.taskType)}</strong>
        <small>${escapeHtml(entry.plantName)} · ${formatDate(entry.doneDate)}</small>
      </div>
    </div>
  `).join("") : emptyState("Журнал пока пуст");
}

function renderPlants() {
  const plants = state.plants.slice().sort((a, b) => a.name.localeCompare(b.name, "uk"));

  els.plantGrid.innerHTML = plants.length ? plants.map(plantCard).join("") : emptyState("Объекты не найдены");
}

function plantCard(plant) {
  const tasks = [...plant.tasks].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const recentEntries = state.log
    .filter((entry) => entry.plantId === plant.id || entry.plantName === plant.name)
    .sort((a, b) => b.doneDate.localeCompare(a.doneDate))
    .slice(0, 3);

  return `
    <article class="plant-card">
      <div class="plant-header">
        <div>
          <h3>${escapeHtml(plant.name)}</h3>
          <p>${plant.location ? escapeHtml(plant.location) + " · " : ""}учет с ${formatDate(plant.planted)}</p>
        </div>
        <span class="plant-badge badge-${plant.type}">${escapeHtml(PLANT_TYPE_LABELS[plant.type] || plant.type)}</span>
      </div>
      ${plant.notes ? `<p class="plant-notes">${escapeHtml(plant.notes)}</p>` : ""}
      <div class="plant-work-grid">
        <section class="plant-work-section">
          <h4>Последние работы</h4>
          <div class="plant-work-list">
            ${recentEntries.length ? recentEntries.map(logMiniForPlant).join("") : '<p class="muted">Записей пока нет</p>'}
          </div>
        </section>
        <section class="plant-work-section">
          <h4>Будущие работы</h4>
          <div class="plant-work-list">
            ${tasks.length ? tasks.map(taskMini).join("") : '<p class="muted">Работ пока нет</p>'}
          </div>
        </section>
      </div>
      <div class="plant-actions">
        <button class="action-pill action-edit" type="button" data-action="edit-plant" data-plant-id="${plant.id}"><i class="ti ti-pencil"></i> Настроить</button>
      </div>
    </article>
  `;
}

function logMiniForPlant(entry) {
  return `
    <div class="work-mini">
      <span class="task-dot task-${entry.taskType}"></span>
      <div>
        <strong>${escapeHtml(TASK_LABELS[entry.taskType] || entry.taskType)}</strong>
        <small>${formatDate(entry.doneDate)}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}</small>
      </div>
    </div>
  `;
}

function taskMini(task) {
  const item = getAllTasks([{ tasks: [task] }])[0];
  const dateClass = item.status === "overdue" ? "overdue" : item.status === "today" ? "today" : "";
  const dateText = item.diff < 0 ? `просрочено ${Math.abs(item.diff)}д` : item.diff === 0 ? "сегодня" : formatDate(task.nextDate);
  return `
    <div class="task-mini work-mini">
      <span class="task-dot task-${task.type}"></span>
      <div>
        <strong>${escapeHtml(TASK_LABELS[task.type] || task.type)}</strong>
        <small><span class="task-date ${dateClass}">${escapeHtml(dateText)}</span>${task.notes ? ` · ${escapeHtml(task.notes)}` : ""}</small>
      </div>
    </div>
  `;
}

function renderLog() {
  const search = els.logSearch.value.trim().toLowerCase();
  const entries = state.log
    .filter((entry) => {
      if (!search) return true;
      return [entry.plantName, TASK_LABELS[entry.taskType] || entry.taskType, entry.note].some((value) => String(value || "").toLowerCase().includes(search));
    })
    .sort((a, b) => b.doneDate.localeCompare(a.doneDate));

  els.logList.innerHTML = entries.length ? entries.map(logRow).join("") : emptyState("Журнал пуст");
}

function logRow(entry) {
  const nextText = entry.nextScheduled ? ` · следующее ${formatDate(entry.nextScheduled)}` : " · без повторения";
  return `
    <article class="log-row">
      <div class="task-icon task-${entry.taskType}"><i class="ti ${TASK_ICONS[entry.taskType] || "ti-calendar"}"></i></div>
      <div>
        <h3>${escapeHtml(entry.plantName)}</h3>
        <p>${escapeHtml(TASK_LABELS[entry.taskType] || entry.taskType)}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}${escapeHtml(nextText)}</p>
      </div>
      <time>${formatDate(entry.doneDate)}</time>
    </article>
  `;
}

function emptyState(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function onReminderClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const plant = state.plants.find((item) => item.id === button.dataset.plantId);
  const task = plant?.tasks.find((item) => item.id === button.dataset.taskId);
  if (!plant || !task) return;

  if (button.dataset.action === "done") {
    openDoneDialog(plant, task);
  }

  if (button.dataset.action === "edit-task") {
    openWorkDialog({ plantId: plant.id, taskId: task.id });
  }
}

function onDashboardListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "add-plant") {
    openPlantDialog();
    return;
  }

  if (button.dataset.action === "edit-plant") {
    onPlantGridClick(event);
    return;
  }

  onReminderClick(event);
}

function onPlantGridClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const plant = state.plants.find((item) => item.id === button.dataset.plantId);
  if (!plant) return;

  if (button.dataset.action === "edit-plant") {
    openPlantDialog(plant);
  }
}

function openPlantDialog(plant = null) {
  els.plantForm.reset();
  els.taskRows.innerHTML = "";
  document.querySelector("#plant-id").value = plant?.id || "";
  document.querySelector("#plant-name").value = plant?.name || "";
  document.querySelector("#plant-type").value = plant?.type || "flower";
  document.querySelector("#plant-planted").value = plant?.planted || todayIso();
  document.querySelector("#plant-location").value = plant?.location || "";
  document.querySelector("#plant-notes").value = plant?.notes || "";
  els.plantDialogTitle.textContent = plant ? "Настроить объект" : "Новый объект";

  const rows = plant?.tasks?.length ? plant.tasks : [normalizeTask({}, plant?.type || "flower")];
  rows.forEach((task) => addTaskRow(task));
  els.plantDialog.showModal();
}

function addTaskRow(task = {}) {
  const node = els.taskRowTemplate.content.firstElementChild.cloneNode(true);
  const type = task.type || "water";
  node.querySelector(".task-id").value = task.id || "";
  node.querySelector(".task-type").value = type;
  node.querySelector(".task-next-date").value = task.nextDate || todayIso();
  node.querySelector(".task-interval").value = task.interval || DEFAULT_INTERVALS[type]?.flower || 14;
  node.querySelector(".task-notes").value = task.notes || "";
  node.querySelector(".remove-task-btn").addEventListener("click", () => node.remove());
  node.querySelector(".task-type").addEventListener("change", (event) => {
    const plantType = document.querySelector("#plant-type").value;
    node.querySelector(".task-interval").value = DEFAULT_INTERVALS[event.target.value]?.[plantType] || 14;
  });
  els.taskRows.append(node);
}

function savePlantFromForm(event) {
  event.preventDefault();
  const id = document.querySelector("#plant-id").value || makeId("plant");
  const plant = normalizePlant({
    id,
    name: document.querySelector("#plant-name").value,
    type: document.querySelector("#plant-type").value,
    planted: document.querySelector("#plant-planted").value,
    location: document.querySelector("#plant-location").value,
    notes: document.querySelector("#plant-notes").value,
    tasks: collectTaskRows(),
  });

  if (!plant.name) return;

  const existingIndex = state.plants.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.plants[existingIndex] = plant;
  } else {
    state.plants.push(plant);
  }

  els.plantDialog.close();
  persistAndRender();
}

function collectTaskRows() {
  return [...els.taskRows.querySelectorAll(".task-row")]
    .map((row) => ({
      id: row.querySelector(".task-id").value || makeId("task"),
      type: row.querySelector(".task-type").value,
      nextDate: row.querySelector(".task-next-date").value,
      interval: row.querySelector(".task-interval").value,
      notes: row.querySelector(".task-notes").value,
    }))
    .filter((task) => task.nextDate);
}

function openDoneDialog(plant, task) {
  els.doneForm.reset();
  document.querySelector("#done-plant-id").value = plant.id;
  document.querySelector("#done-task-id").value = task.id;
  document.querySelector("#done-date").value = todayIso();
  document.querySelector("#done-note").value = task.notes || "";
  document.querySelector("#done-mode").value = task.repeat === false ? "stop" : "repeat";
  document.querySelector("#done-interval").value = task.interval;
  els.doneDialogTitle.textContent = `Сделано: ${TASK_LABELS[task.type] || task.type} - ${plant.name}`;
  els.doneDialog.showModal();
}

function openWorkDialog(options = {}) {
  if (!state.plants.length) {
    alert("Сначала добавьте объект, затем планируйте работы.");
    openPlantDialog();
    return;
  }

  const selectedPlant = state.plants.find((plant) => plant.id === options.plantId) || state.plants[0];
  const existingTask = selectedPlant?.tasks.find((task) => task.id === options.taskId);
  const type = existingTask?.type || options.type || "water";
  const isEditing = Boolean(existingTask);

  els.workForm.reset();
  els.workTaskId.value = existingTask?.id || "";
  renderWorkPlantOptions(selectedPlant?.id || options.plantId);
  els.workType.value = type;
  els.workNextDate.value = existingTask?.nextDate || todayIso();
  els.workRepeat.value = existingTask ? (existingTask.repeat === false ? "once" : "repeat") : (options.repeat ? "repeat" : "once");
  els.workInterval.value = existingTask?.interval || DEFAULT_INTERVALS[type]?.[selectedPlant?.type || "other"] || 14;
  els.workNotes.value = existingTask?.notes || "";
  els.workSubmitButton.textContent = isEditing ? "Сохранить" : "Запланировать";
  updateWorkIntervalDefault({ resetInterval: false });
  els.workDialogTitle.textContent = `${isEditing ? "Редактировать" : "Запланировать"}: ${TASK_LABELS[type] || "работа"}`;
  els.workDialog.showModal();
}

function renderWorkPlantOptions(selectedPlantId = "") {
  els.workPlantId.innerHTML = state.plants
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .map((plant) => `<option value="${plant.id}">${escapeHtml(plant.name)}${plant.location ? ` · ${escapeHtml(plant.location)}` : ""}</option>`)
    .join("");

  if (selectedPlantId && state.plants.some((plant) => plant.id === selectedPlantId)) {
    els.workPlantId.value = selectedPlantId;
  }
}

function updateWorkIntervalDefault({ resetInterval = true } = {}) {
  const plant = state.plants.find((item) => item.id === els.workPlantId.value);
  const type = els.workType.value || "water";
  if (resetInterval) {
    els.workInterval.value = DEFAULT_INTERVALS[type]?.[plant?.type || "other"] || 14;
  }
  els.workInterval.disabled = els.workRepeat.value !== "repeat";
  els.workDialogTitle.textContent = `${els.workTaskId.value ? "Редактировать" : "Запланировать"}: ${TASK_LABELS[type] || "работа"}`;
}

function saveWorkFromForm(event) {
  event.preventDefault();
  const plant = state.plants.find((item) => item.id === els.workPlantId.value);
  if (!plant) return;
  const taskId = els.workTaskId.value || makeId("task");

  if (els.workTaskId.value) {
    state.plants.forEach((item) => {
      item.tasks = item.tasks.filter((task) => task.id !== els.workTaskId.value);
    });
  }

  plant.tasks.push(normalizeTask({
    id: taskId,
    type: els.workType.value,
    nextDate: els.workNextDate.value,
    interval: Number(els.workInterval.value),
    repeat: els.workRepeat.value === "repeat",
    notes: els.workNotes.value,
  }, plant.type));

  els.workDialog.close();
  persistAndRender();
  setDashboardView("timeline");
}

function saveDoneFromForm(event) {
  event.preventDefault();
  const plant = state.plants.find((item) => item.id === document.querySelector("#done-plant-id").value);
  const task = plant?.tasks.find((item) => item.id === document.querySelector("#done-task-id").value);
  if (!plant || !task) return;

  const logEntry = completeTask({
    plant,
    task,
    doneDate: document.querySelector("#done-date").value,
    note: document.querySelector("#done-note").value,
    interval: Number(document.querySelector("#done-interval").value),
    repeat: document.querySelector("#done-mode").value === "repeat",
  });

  state.log.push(logEntry);
  els.doneDialog.close();
  persistAndRender();
}

function clearLog() {
  if (!state.log.length) return;
  if (!confirm("Очистить весь журнал выполненных работ? Культуры и будущие работы останутся.")) return;
  state.log = [];
  persistAndRender();
}

function addOneDay(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function closeDialog(id) {
  document.querySelector(`#${id}`)?.close();
}

function closeDialogOnBackdrop(event) {
  if (event.target === event.currentTarget) {
    event.currentTarget.close();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
