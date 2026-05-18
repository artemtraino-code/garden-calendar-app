import {
  DEFAULT_INTERVALS,
  PLANT_TYPE_LABELS,
  PREPARATION_CATEGORY_LABELS,
  TASK_ICONS,
  TASK_LABELS,
  completeTask,
  formatDate,
  getAllTasks,
  makeId,
  normalizePlant,
  normalizePreparation,
  normalizeTask,
  todayIso,
} from "./calendar.js";
import { loadState, saveState } from "./storage.js";

let state = loadState();
state.preparations ||= [];
let activeTab = "today";
let dashboardView = "timeline";
let timelineRange = "nearest";
let selectedTimelineDate = "";
let calendarStartDate = todayIso();

const TIMELINE_RANGES = {
  nearest: { label: "Ближайшие дни", days: null },
  three: { label: "3 дня", days: 3 },
  week: { label: "Неделя", days: 7 },
  month: { label: "Месяц", days: 30 },
  quarter: { label: "3 месяца", days: 90 },
};

const els = {
  todayLabel: document.querySelector("#today-label"),
  calendarPanel: document.querySelector(".calendar-panel"),
  workPanel: document.querySelector(".work-panel"),
  workPanelEyebrow: document.querySelector("#work-panel-eyebrow"),
  workPanelTitle: document.querySelector("#work-panel-title"),
  urgentList: document.querySelector("#urgent-list"),
  upcomingList: document.querySelector("#upcoming-list"),
  timelineRangeSelect: document.querySelector("#timeline-range-select"),
  weekStrip: document.querySelector("#week-strip"),
  weekPrevBtn: document.querySelector("#week-prev-btn"),
  weekNextBtn: document.querySelector("#week-next-btn"),
  timelineLabel: document.querySelector("#timeline-label"),
  quickPlan: document.querySelector("#quick-plan"),
  miniLog: document.querySelector("#mini-log"),
  plantGrid: document.querySelector("#plant-grid"),
  preparationGrid: document.querySelector("#preparation-grid"),
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
  workPreparationId: document.querySelector("#work-preparation-id"),
  workPreparationPreview: document.querySelector("#work-preparation-preview"),
  workNotes: document.querySelector("#work-notes"),
  workSubmitButton: document.querySelector("#work-submit-btn"),
  preparationDialog: document.querySelector("#preparation-dialog"),
  preparationForm: document.querySelector("#preparation-form"),
  preparationDialogTitle: document.querySelector("#preparation-dialog-title"),
  preparationId: document.querySelector("#preparation-id"),
  preparationName: document.querySelector("#preparation-name"),
  preparationCategory: document.querySelector("#preparation-category"),
  preparationImage: document.querySelector("#preparation-image"),
  preparationDosage: document.querySelector("#preparation-dosage"),
  preparationDescription: document.querySelector("#preparation-description"),
};

bindEvents();
render();

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.querySelector("#add-plant-btn").addEventListener("click", () => openPlantDialog());
  document.querySelector("#add-preparation-btn").addEventListener("click", () => openPreparationDialog());
  document.querySelector("#quick-add-plant-btn").addEventListener("click", () => openWorkDialog({ type: "plant" }));
  document.querySelector("#quick-add-work-btn").addEventListener("click", () => openWorkDialog());
  document.querySelector("#add-task-row-btn").addEventListener("click", () => addTaskRow());
  document.querySelector("#clear-log-btn").addEventListener("click", clearLog);

  els.quickPlan.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dashboard-view]");
    if (button) setDashboardView(button.dataset.dashboardView);
  });
  els.timelineRangeSelect.addEventListener("change", () => setTimelineRange(els.timelineRangeSelect.value));
  els.weekStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-week-date]");
    if (button) setTimelineDate(button.dataset.weekDate);
  });
  els.weekPrevBtn.addEventListener("click", () => shiftCalendarRange(-7));
  els.weekNextBtn.addEventListener("click", () => shiftCalendarRange(7));

  els.logSearch.addEventListener("input", renderLog);
  els.plantForm.addEventListener("submit", savePlantFromForm);
  els.doneForm.addEventListener("submit", saveDoneFromForm);
  els.workForm.addEventListener("submit", saveWorkFromForm);
  els.workPlantId.addEventListener("change", () => updateWorkIntervalDefault());
  els.workType.addEventListener("change", () => updateWorkIntervalDefault());
  els.workRepeat.addEventListener("change", () => updateWorkIntervalDefault({ resetInterval: false }));
  els.workPreparationId.addEventListener("change", updateWorkPreparationPreview);
  els.preparationForm.addEventListener("submit", savePreparationFromForm);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
  });

  els.plantDialog.addEventListener("click", closeDialogOnBackdrop);
  els.doneDialog.addEventListener("click", closeDialogOnBackdrop);
  els.workDialog.addEventListener("click", closeDialogOnBackdrop);
  els.preparationDialog.addEventListener("click", closeDialogOnBackdrop);

  els.plantGrid.addEventListener("click", onPlantGridClick);
  els.preparationGrid.addEventListener("click", onPreparationGridClick);
  els.urgentList.addEventListener("click", onDashboardListClick);
  els.upcomingList.addEventListener("click", onReminderClick);
}

function render() {
  const todayLabel = formatDate(todayIso(), { long: true, year: true });
  els.todayLabel.textContent = todayLabel;
  renderToday();
  renderPlants();
  renderPreparations();
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

function renderToday() {
  const tasks = getAllTasks(state.plants).sort((a, b) => a.diff - b.diff || a.plant.name.localeCompare(b.plant.name, "uk"));
  const range = TIMELINE_RANGES[timelineRange] || TIMELINE_RANGES.week;
  const timelineTasks = getTimelineTasks(tasks, range);
  const panel = getDashboardPanel(tasks);
  const isTimeline = dashboardView === "timeline";

  els.timelineRangeSelect.value = timelineRange;
  els.calendarPanel.classList.toggle("is-hidden", !isTimeline);
  els.workPanel.classList.toggle("is-hidden", isTimeline);
  els.workPanelEyebrow.textContent = panel.eyebrow;
  els.workPanelTitle.textContent = panel.title;
  els.urgentList.innerHTML = panel.html;
  els.timelineLabel.textContent = getTimelineLabel(range);
  els.upcomingList.innerHTML = timelineTasks.length
    ? timelineTasks.map(timelineCard).join("")
    : emptyState(getTimelineEmptyText(range));
  renderWeekStrip(tasks);
  renderQuickPlan(tasks);
  renderMiniLog();
  renderDashboardControls();
}

function getTimelineTasks(tasks, range) {
  if (selectedTimelineDate) {
    return tasks.filter((item) => item.task.nextDate === selectedTimelineDate);
  }
  if (!range.days) {
    return tasks.filter((item) => item.diff >= 0);
  }
  return tasks.filter((item) => item.diff >= 0 && item.diff <= range.days);
}

function getTimelineLabel(range) {
  if (selectedTimelineDate) return `Дата: ${formatDate(selectedTimelineDate)}`;
  return `Период: ${range.label}`;
}

function getTimelineEmptyText(range) {
  if (selectedTimelineDate) return `На ${formatDate(selectedTimelineDate)} работ нет`;
  return `В периоде "${range.label}" работ нет`;
}

function setTimelineRange(range) {
  if (!TIMELINE_RANGES[range]) return;
  timelineRange = range;
  selectedTimelineDate = "";
  renderToday();
}

function setTimelineDate(isoDate) {
  selectedTimelineDate = selectedTimelineDate === isoDate ? "" : (isoDate || "");
  renderToday();
}

function shiftCalendarRange(days) {
  calendarStartDate = addCalendarDays(calendarStartDate, days);
  selectedTimelineDate = "";
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
  const preparation = getPreparation(item.task.preparationId);
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
        ${preparation ? preparationInline(preparation) : ""}
      </div>
      <div class="card-actions">
        <button class="action-pill action-edit" type="button" data-action="edit-task" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}">
          <i class="ti ti-pencil"></i> Редактировать
        </button>
        ${completionButton(item)}
      </div>
    </article>
  `;
}

function timelineCard(item) {
  const statusClass = item.status === "today" ? "today-card" : "";
  const preparation = getPreparation(item.task.preparationId);
  const workTitle = `${TASK_LABELS[item.task.type] || item.task.type} - ${item.plant.name}`;
  const repeatText = item.task.repeat === false ? "разовая работа" : `каждые ${item.task.interval} дн.`;

  return `
    <article class="reminder-card timeline-card ${statusClass}">
      <div class="task-icon task-${item.task.type}"><i class="ti ${TASK_ICONS[item.task.type] || "ti-calendar"}"></i></div>
      <div class="reminder-info">
        <h3>${escapeHtml(timelineDateTitle(item))}</h3>
        <p><strong>${escapeHtml(workTitle)}</strong> · ${escapeHtml(repeatText)}${item.task.notes ? ` · ${escapeHtml(item.task.notes)}` : ""}</p>
        ${preparation ? preparationInline(preparation) : ""}
      </div>
      <div class="card-actions">
        <button class="action-pill action-edit" type="button" data-action="edit-task" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}">
          <i class="ti ti-pencil"></i> Редактировать
        </button>
        ${completionButton(item)}
      </div>
    </article>
  `;
}

function completionButton(item) {
  const isPlanned = item.diff > 0;
  const className = isPlanned ? "action-planned" : "action-done";
  const icon = isPlanned ? "ti-calendar" : "ti-check";
  const label = isPlanned ? "Запланировано" : "Сделано";
  const title = isPlanned ? "Нажмите, когда работа выполнена" : "Отметить работу выполненной";

  return `
    <button class="action-pill ${className}" type="button" title="${escapeHtml(title)}" data-action="done" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}">
      <i class="ti ${icon}"></i> ${escapeHtml(label)}
    </button>
  `;
}

function timelineDateTitle(item) {
  return item.diff === 0 ? `Сегодня, ${formatDate(item.task.nextDate)}` : formatDate(item.task.nextDate);
}

function renderWeekStrip(tasks) {
  const today = todayIso();
  const days = Array.from({ length: 7 }, (_, index) => {
    const iso = addCalendarDays(calendarStartDate, index);
    const count = tasks.filter((item) => item.task.nextDate === iso).length;
    return { iso, count };
  });

  els.weekStrip.innerHTML = days.map((day) => `
    <button class="day-pill ${day.iso === today ? "today" : ""} ${day.count ? "busy" : ""} ${selectedTimelineDate === day.iso ? "active" : ""}" type="button" data-week-date="${day.iso}">
      <span>${formatDate(day.iso)}</span>
      ${day.count ? `<small>${day.count}</small>` : ""}
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
        <small>${escapeHtml(entry.plantName)} · ${formatDate(entry.doneDate)}${preparationLogText(entry)}</small>
      </div>
    </div>
  `).join("") : emptyState("Журнал пока пуст");
}

function renderPlants() {
  const plants = state.plants.slice().sort((a, b) => a.name.localeCompare(b.name, "uk"));

  els.plantGrid.innerHTML = plants.length ? plants.map(plantCard).join("") : emptyState("Объекты не найдены");
}

function renderPreparations() {
  const preparations = (state.preparations || []).slice().sort((a, b) => a.name.localeCompare(b.name, "ru"));
  els.preparationGrid.innerHTML = preparations.length
    ? preparations.map(preparationCard).join("")
    : emptyState("Препараты пока не заведены");
}

function preparationCard(preparation) {
  return `
    <article class="preparation-card">
      ${preparationImage(preparation, "preparation-card-image")}
      <div class="preparation-card-body">
        <div class="preparation-card-head">
          <div>
            <h3>${escapeHtml(preparation.name)}</h3>
            <p>${escapeHtml(PREPARATION_CATEGORY_LABELS[preparation.category] || preparation.category)}</p>
          </div>
        </div>
        ${preparation.dosage ? `<p class="preparation-dosage"><strong>Дозировка:</strong> ${escapeHtml(preparation.dosage)}</p>` : ""}
        <p class="preparation-description">${preparation.description ? escapeHtml(preparation.description) : "Описание пока не добавлено"}</p>
        <div class="preparation-actions">
          <button class="action-pill action-edit action-compact" type="button" data-action="edit-preparation" data-preparation-id="${preparation.id}">
            <i class="ti ti-pencil"></i> Настроить
          </button>
          <button class="action-pill action-delete action-compact" type="button" data-action="delete-preparation" data-preparation-id="${preparation.id}">
            <i class="ti ti-circle-minus"></i> Удалить
          </button>
        </div>
      </div>
    </article>
  `;
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
        <button class="action-pill action-edit action-compact" type="button" data-action="edit-plant" data-plant-id="${plant.id}"><i class="ti ti-pencil"></i> Настроить</button>
        <button class="action-pill action-delete action-compact" type="button" data-action="delete-plant" data-plant-id="${plant.id}"><i class="ti ti-circle-minus"></i> Удалить</button>
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
        <small>${formatDate(entry.doneDate)}${preparationLogText(entry)}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}</small>
      </div>
    </div>
  `;
}

function taskMini(task) {
  const item = getAllTasks([{ tasks: [task] }])[0];
  const preparation = getPreparation(task.preparationId);
  const dateClass = item.status === "overdue" ? "overdue" : item.status === "today" ? "today" : "";
  const dateText = item.diff < 0 ? `просрочено ${Math.abs(item.diff)}д` : item.diff === 0 ? "сегодня" : formatDate(task.nextDate);
  return `
    <div class="task-mini work-mini">
      <span class="task-dot task-${task.type}"></span>
      <div>
        <strong>${escapeHtml(TASK_LABELS[task.type] || task.type)}</strong>
        <small><span class="task-date ${dateClass}">${escapeHtml(dateText)}</span>${preparation ? ` · ${escapeHtml(preparation.name)}` : ""}${task.notes ? ` · ${escapeHtml(task.notes)}` : ""}</small>
      </div>
    </div>
  `;
}

function renderLog() {
  const search = els.logSearch.value.trim().toLowerCase();
  const entries = state.log
    .filter((entry) => {
      if (!search) return true;
      const preparation = getPreparation(entry.preparationId);
      return [entry.plantName, TASK_LABELS[entry.taskType] || entry.taskType, preparation?.name, entry.note]
        .some((value) => String(value || "").toLowerCase().includes(search));
    })
    .sort((a, b) => b.doneDate.localeCompare(a.doneDate));

  els.logList.innerHTML = entries.length ? entries.map(logRow).join("") : emptyState("Журнал пуст");
}

function logRow(entry) {
  const preparation = getPreparation(entry.preparationId);
  const nextText = entry.nextScheduled ? ` · следующее ${formatDate(entry.nextScheduled)}` : " · без повторения";
  return `
    <article class="log-row">
      <div class="task-icon task-${entry.taskType}"><i class="ti ${TASK_ICONS[entry.taskType] || "ti-calendar"}"></i></div>
      <div>
        <h3>${escapeHtml(entry.plantName)}</h3>
        <p>${escapeHtml(TASK_LABELS[entry.taskType] || entry.taskType)}${preparation ? ` · ${escapeHtml(preparation.name)}` : ""}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}${escapeHtml(nextText)}</p>
        ${preparation ? preparationInline(preparation) : ""}
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

  if (button.dataset.action === "delete-plant") {
    deletePlant(plant);
  }
}

function deletePlant(plant) {
  const confirmed = confirm(`Удалить объект "${plant.name}"? Будущие работы и записи журнала по нему тоже будут удалены.`);
  if (!confirmed) return;

  state.plants = state.plants.filter((item) => item.id !== plant.id);
  state.log = state.log.filter((entry) => entry.plantId !== plant.id && entry.plantName !== plant.name);
  persistAndRender();
}

function onPreparationGridClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const preparation = state.preparations.find((item) => item.id === button.dataset.preparationId);
  if (!preparation) return;

  if (button.dataset.action === "edit-preparation") {
    openPreparationDialog(preparation);
  }

  if (button.dataset.action === "delete-preparation") {
    deletePreparation(preparation);
  }
}

function openPreparationDialog(preparation = null) {
  els.preparationForm.reset();
  els.preparationId.value = preparation?.id || "";
  els.preparationName.value = preparation?.name || "";
  els.preparationCategory.value = preparation?.category || "other";
  els.preparationImage.value = preparation?.image || "";
  els.preparationDosage.value = preparation?.dosage || "";
  els.preparationDescription.value = preparation?.description || "";
  els.preparationDialogTitle.textContent = preparation ? "Настроить препарат" : "Новый препарат";
  els.preparationDialog.showModal();
}

function savePreparationFromForm(event) {
  event.preventDefault();
  const id = els.preparationId.value || makeId("prep");
  const preparation = normalizePreparation({
    id,
    name: els.preparationName.value,
    category: els.preparationCategory.value,
    image: els.preparationImage.value,
    dosage: els.preparationDosage.value,
    description: els.preparationDescription.value,
  });

  if (!preparation.name) return;

  const existingIndex = state.preparations.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.preparations[existingIndex] = preparation;
  } else {
    state.preparations.push(preparation);
  }

  els.preparationDialog.close();
  persistAndRender();
}

function deletePreparation(preparation) {
  const confirmed = confirm(`Удалить препарат "${preparation.name}"? В старых и будущих работах он будет отвязан.`);
  if (!confirmed) return;

  state.preparations = state.preparations.filter((item) => item.id !== preparation.id);
  state.plants.forEach((plant) => {
    plant.tasks.forEach((task) => {
      if (task.preparationId === preparation.id) task.preparationId = "";
    });
  });
  state.log.forEach((entry) => {
    if (entry.preparationId === preparation.id) entry.preparationId = "";
  });
  persistAndRender();
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
  node.querySelector(".task-preparation").innerHTML = preparationOptions(task.preparationId);
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
      preparationId: row.querySelector(".task-preparation").value,
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
  renderWorkPreparationOptions(existingTask?.preparationId || options.preparationId || "");
  els.workType.value = type;
  els.workNextDate.value = existingTask?.nextDate || todayIso();
  els.workRepeat.value = existingTask ? (existingTask.repeat === false ? "once" : "repeat") : (options.repeat ? "repeat" : "once");
  els.workInterval.value = existingTask?.interval || DEFAULT_INTERVALS[type]?.[selectedPlant?.type || "other"] || 14;
  els.workNotes.value = existingTask?.notes || "";
  els.workSubmitButton.textContent = isEditing ? "Сохранить" : "Запланировать";
  updateWorkIntervalDefault({ resetInterval: false });
  updateWorkPreparationPreview();
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

function renderWorkPreparationOptions(selectedPreparationId = "") {
  els.workPreparationId.innerHTML = preparationOptions(selectedPreparationId, "Без препарата");
  els.workPreparationId.value = selectedPreparationId && state.preparations.some((item) => item.id === selectedPreparationId)
    ? selectedPreparationId
    : "";
}

function updateWorkPreparationPreview() {
  const preparation = getPreparation(els.workPreparationId.value);
  els.workPreparationPreview.classList.toggle("is-hidden", !preparation);
  els.workPreparationPreview.innerHTML = preparation ? `
    ${preparationImage(preparation, "preparation-preview-image")}
    <div>
      <strong>${escapeHtml(preparation.name)}</strong>
      ${preparation.dosage ? `<p class="preparation-preview-dosage">Дозировка: ${escapeHtml(preparation.dosage)}</p>` : ""}
      <p>${escapeHtml(preparation.description || "Описание пока не добавлено")}</p>
    </div>
  ` : "";
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
    preparationId: els.workPreparationId.value,
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

function addCalendarDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Number(days || 0));
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

function preparationOptions(selectedId = "", emptyLabel = "Без препарата") {
  const options = [`<option value="">${escapeHtml(emptyLabel)}</option>`];
  options.push(...(state.preparations || [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .map((preparation) => `
      <option value="${escapeHtml(preparation.id)}" ${preparation.id === selectedId ? "selected" : ""}>
        ${escapeHtml(preparation.name)}
      </option>
    `));
  return options.join("");
}

function getPreparation(preparationId) {
  if (!preparationId) return null;
  return state.preparations.find((preparation) => preparation.id === preparationId) || null;
}

function preparationLogText(entry) {
  const preparation = getPreparation(entry.preparationId);
  return preparation ? ` · ${escapeHtml(preparation.name)}` : "";
}

function preparationInline(preparation) {
  return `
    <div class="preparation-inline">
      ${preparationImage(preparation, "preparation-inline-image")}
      <div>
        <strong>${escapeHtml(preparation.name)}</strong>
        <small>${escapeHtml(preparation.dosage ? `Дозировка: ${preparation.dosage}` : preparation.description || PREPARATION_CATEGORY_LABELS[preparation.category] || "Препарат")}</small>
      </div>
    </div>
  `;
}

function preparationImage(preparation, className) {
  if (preparation.image) {
    return `<img class="${className}" src="${escapeHtml(preparation.image)}" alt="">`;
  }

  const fallback = preparation.name.trim().slice(0, 2).toUpperCase() || "П";
  return `<span class="${className} preparation-image-fallback">${escapeHtml(fallback)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
