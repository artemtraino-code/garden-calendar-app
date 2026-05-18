import {
  DEFAULT_INTERVALS,
  PLANT_TYPE_LABELS,
  PREPARATION_CATEGORY_LABELS,
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
state.workTypes ||= [];
let activeTab = "today";
let dashboardView = "timeline";
let selectedTimelineDate = "";
let calendarStartDate = todayIso();
let postponeCalendarMonth = todayIso().slice(0, 7) + "-01";

const ICON_CHOICES = [
  { id: "seedling", label: "Рассада" },
  { id: "potted-plant", label: "Горшок" },
  { id: "blossom", label: "Цветок" },
  { id: "hibiscus", label: "Гибискус" },
  { id: "rose", label: "Роза" },
  { id: "sunflower", label: "Подсолнух" },
  { id: "tomato", label: "Томат" },
  { id: "hot-pepper", label: "Перец" },
  { id: "cucumber", label: "Огурец" },
  { id: "ear-of-corn", label: "Кукуруза" },
  { id: "herb", label: "Зелень" },
  { id: "droplet", label: "Вода" },
  { id: "bug", label: "Вредители" },
  { id: "test-tube", label: "Препарат" },
  { id: "scissors", label: "Обрезка" },
  { id: "basket", label: "Сбор" },
  { id: "magnifying-glass-tilted-left", label: "Осмотр" },
  { id: "spiral-calendar", label: "Календарь" },
  { id: "clipboard", label: "Список" },
  { id: "memo", label: "Заметка" },
  { id: "package", label: "Упаковка" },
];

const els = {
  todayLabel: document.querySelector("#today-label"),
  calendarPanel: document.querySelector(".calendar-panel"),
  workPanel: document.querySelector(".work-panel"),
  workPanelEyebrow: document.querySelector("#work-panel-eyebrow"),
  workPanelTitle: document.querySelector("#work-panel-title"),
  urgentList: document.querySelector("#urgent-list"),
  upcomingList: document.querySelector("#upcoming-list"),
  weekStrip: document.querySelector("#week-strip"),
  weekPrevBtn: document.querySelector("#week-prev-btn"),
  weekNextBtn: document.querySelector("#week-next-btn"),
  timelineLabel: document.querySelector("#timeline-label"),
  timelineCounters: document.querySelector("#timeline-counters"),
  quickPlan: document.querySelector("#quick-plan"),
  miniLog: document.querySelector("#mini-log"),
  plantGrid: document.querySelector("#plant-grid"),
  workTypeGrid: document.querySelector("#work-type-grid"),
  preparationGrid: document.querySelector("#preparation-grid"),
  logSearch: document.querySelector("#log-search"),
  logList: document.querySelector("#log-list"),
  plantDialog: document.querySelector("#plant-dialog"),
  plantForm: document.querySelector("#plant-form"),
  plantDialogTitle: document.querySelector("#plant-dialog-title"),
  plantIcon: document.querySelector("#plant-icon"),
  plantIconPicker: document.querySelector("#plant-icon-picker"),
  taskRows: document.querySelector("#task-rows"),
  taskRowTemplate: document.querySelector("#task-row-template"),
  doneDialog: document.querySelector("#done-dialog"),
  doneForm: document.querySelector("#done-form"),
  doneDialogTitle: document.querySelector("#done-dialog-title"),
  doneMode: document.querySelector("#done-mode"),
  doneRepeatDateField: document.querySelector("#done-repeat-date-field"),
  doneRepeatDate: document.querySelector("#done-repeat-date"),
  doneIntervalField: document.querySelector("#done-interval-field"),
  doneIntervalLabel: document.querySelector("#done-interval-label"),
  doneInterval: document.querySelector("#done-interval"),
  postponeTaskBtn: document.querySelector("#postpone-task-btn"),
  postponeDialog: document.querySelector("#postpone-dialog"),
  postponeForm: document.querySelector("#postpone-form"),
  postponeDialogTitle: document.querySelector("#postpone-dialog-title"),
  postponePlantId: document.querySelector("#postpone-plant-id"),
  postponeTaskId: document.querySelector("#postpone-task-id"),
  postponeDate: document.querySelector("#postpone-date"),
  postponeCalendarGrid: document.querySelector("#postpone-calendar-grid"),
  postponeMonthLabel: document.querySelector("#postpone-month-label"),
  postponePrevMonthBtn: document.querySelector("#postpone-prev-month"),
  postponeNextMonthBtn: document.querySelector("#postpone-next-month"),
  workDialog: document.querySelector("#work-dialog"),
  workForm: document.querySelector("#work-form"),
  workDialogTitle: document.querySelector("#work-dialog-title"),
  workTaskId: document.querySelector("#work-task-id"),
  workPlantId: document.querySelector("#work-plant-id"),
  workStatus: document.querySelector("#work-status"),
  workType: document.querySelector("#work-type"),
  workNextDate: document.querySelector("#work-next-date"),
  workRepeatDateField: document.querySelector("#work-repeat-date-field"),
  workRepeatDate: document.querySelector("#work-repeat-date"),
  workIntervalField: document.querySelector("#work-interval-field"),
  workIntervalLabel: document.querySelector("#work-interval-label"),
  workInterval: document.querySelector("#work-interval"),
  workRepeat: document.querySelector("#work-repeat"),
  workPreparationId: document.querySelector("#work-preparation-id"),
  addWorkPreparationBtn: document.querySelector("#add-work-preparation-btn"),
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
  workTypeDialog: document.querySelector("#work-type-dialog"),
  workTypeForm: document.querySelector("#work-type-form"),
  workTypeDialogTitle: document.querySelector("#work-type-dialog-title"),
  workTypeId: document.querySelector("#work-type-id"),
  workTypeLabel: document.querySelector("#work-type-label"),
  workTypeIcon: document.querySelector("#work-type-icon"),
  workTypeIconPicker: document.querySelector("#work-type-icon-picker"),
  workTypeInterval: document.querySelector("#work-type-interval"),
};

bindEvents();
render();

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => handleTabClick(tab.dataset.tab));
  });

  document.querySelector("#add-plant-btn").addEventListener("click", () => openPlantDialog());
  document.querySelector("#add-preparation-btn").addEventListener("click", () => openPreparationDialog());
  document.querySelector("#add-work-type-btn").addEventListener("click", () => openWorkTypeDialog());
  document.querySelector("#quick-add-plant-btn").addEventListener("click", () => openWorkDialog());
  document.querySelector("#add-task-row-btn").addEventListener("click", () => addTaskRow());
  document.querySelector("#clear-log-btn").addEventListener("click", clearLog);

  els.quickPlan.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dashboard-view]");
    if (button) setDashboardView(button.dataset.dashboardView);
  });
  els.weekStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-week-date]");
    if (button) setTimelineDate(button.dataset.weekDate, { scroll: true });
  });
  els.weekPrevBtn.addEventListener("click", () => shiftCalendarRange(-1));
  els.weekNextBtn.addEventListener("click", () => shiftCalendarRange(1));
  els.timelineCounters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-feed-scroll]");
    if (button) scrollFeedToSection(button.dataset.feedScroll);
  });

  els.logSearch.addEventListener("input", renderLog);
  els.plantForm.addEventListener("submit", savePlantFromForm);
  els.doneForm.addEventListener("submit", saveDoneFromForm);
  els.doneMode.addEventListener("change", updateDoneModeFields);
  els.postponeTaskBtn.addEventListener("click", openPostponeDialogFromDoneDialog);
  els.postponeForm.addEventListener("submit", savePostponeFromForm);
  els.postponeDate.addEventListener("change", syncPostponeCalendarFromInput);
  els.postponeCalendarGrid.addEventListener("click", onPostponeCalendarClick);
  els.postponePrevMonthBtn.addEventListener("click", () => shiftPostponeMonth(-1));
  els.postponeNextMonthBtn.addEventListener("click", () => shiftPostponeMonth(1));
  els.workForm.addEventListener("submit", saveWorkFromForm);
  els.workPlantId.addEventListener("change", () => updateWorkIntervalDefault());
  els.workType.addEventListener("change", () => updateWorkIntervalDefault());
  els.workRepeat.addEventListener("change", () => updateWorkModeFields({ resetInterval: false }));
  els.workPreparationId.addEventListener("change", updateWorkPreparationAddState);
  els.addWorkPreparationBtn.addEventListener("click", addWorkPreparationFromSelect);
  els.workPreparationPreview.addEventListener("click", removeWorkPreparation);
  els.preparationForm.addEventListener("submit", savePreparationFromForm);
  els.workTypeForm.addEventListener("submit", saveWorkTypeFromForm);
  els.plantIconPicker.addEventListener("click", (event) => selectIconFromPicker(event, els.plantIcon, els.plantIconPicker));
  els.workTypeIconPicker.addEventListener("click", (event) => selectIconFromPicker(event, els.workTypeIcon, els.workTypeIconPicker));

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
  });

  els.plantDialog.addEventListener("click", closeDialogOnBackdrop);
  els.doneDialog.addEventListener("click", closeDialogOnBackdrop);
  els.postponeDialog.addEventListener("click", closeDialogOnBackdrop);
  els.workDialog.addEventListener("click", closeDialogOnBackdrop);
  els.preparationDialog.addEventListener("click", closeDialogOnBackdrop);
  els.workTypeDialog.addEventListener("click", closeDialogOnBackdrop);

  els.plantGrid.addEventListener("click", onPlantGridClick);
  els.workTypeGrid.addEventListener("click", onWorkTypeGridClick);
  els.preparationGrid.addEventListener("click", onPreparationGridClick);
  els.urgentList.addEventListener("click", onDashboardListClick);
  els.upcomingList.addEventListener("click", onReminderClick);
}

function render() {
  const todayLabel = formatDate(todayIso(), { long: true, year: true });
  els.todayLabel.textContent = todayLabel;
  renderToday();
  renderPlants();
  renderWorkTypes();
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

function handleTabClick(tabName) {
  if (tabName === "today") {
    openDashboardToday();
    return;
  }

  switchTab(tabName);
}

function openDashboardToday() {
  const today = todayIso();
  calendarStartDate = today;
  selectedTimelineDate = "";
  switchTab("today");
  requestAnimationFrame(() => scrollFeedToDate(today));
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
  const allFeedGroups = getFeedGroups(tasks, { applyDate: false });
  const visibleFeedGroups = getFeedGroups(tasks);
  els.calendarPanel.classList.remove("is-hidden");
  els.workPanel.classList.add("is-hidden");
  els.timelineLabel.textContent = selectedTimelineDate ? formatDate(selectedTimelineDate) : "";
  renderTimelineCounters(allFeedGroups);
  els.upcomingList.innerHTML = renderUnifiedFeed(visibleFeedGroups);
  renderWeekStrip(tasks);
  renderQuickPlan(tasks);
  renderMiniLog();
  renderDashboardControls();
  requestAnimationFrame(positionFeedAfterRender);
}

function getFeedGroups(tasks, options = {}) {
  const applyDate = options.applyDate !== false;
  const history = [...state.log]
    .filter((entry) => !applyDate || !selectedTimelineDate || entry.doneDate === selectedTimelineDate)
    .sort((a, b) => a.doneDate.localeCompare(b.doneDate) || a.id.localeCompare(b.id));
  const planned = tasks
    .filter((item) => !applyDate || !selectedTimelineDate || item.task.nextDate === selectedTimelineDate)
    .sort((a, b) => a.task.nextDate.localeCompare(b.task.nextDate) || a.plant.name.localeCompare(b.plant.name, "uk"));

  return { history, planned };
}

function renderUnifiedFeed({ history, planned }) {
  if (!history.length && !planned.length) {
    return emptyState(selectedTimelineDate ? "На выбранную дату работ нет" : "Работ в ленте пока нет");
  }

  return `
    ${history.length ? `<div class="feed-section" data-feed-section="history">${history.map((entry, index) => historyFeedCard(entry, { isLatest: index === history.length - 1 })).join("")}</div>` : ""}
    ${planned.length ? `<div class="feed-section" data-feed-section="planned">${planned.map(timelineCard).join("")}</div>` : ""}
  `;
}

function renderTimelineCounters({ history, planned }) {
  if (!els.timelineCounters) {
    return;
  }

  els.timelineCounters.innerHTML = `
    <button class="timeline-counter timeline-counter-done" type="button" data-feed-scroll="history">
      <i class="ti ti-check"></i>
      <span>Выполнено</span>
      <strong>${history.length}</strong>
    </button>
    <button class="timeline-counter timeline-counter-planned" type="button" data-feed-scroll="planned">
      <i class="ti ti-calendar-event"></i>
      <span>Запланировано</span>
      <strong>${planned.length}</strong>
    </button>
  `;
}

function setTimelineDate(isoDate, options = {}) {
  selectedTimelineDate = isoDate || "";
  renderToday();
  if (options.scroll && selectedTimelineDate) {
    requestAnimationFrame(() => scrollFeedToDate(selectedTimelineDate));
  }
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
      eyebrow: "Цветы и овощи",
      title: "Цветы и овощи",
      plants: state.plants,
      empty: "Культур пока нет",
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
  const preparations = getPreparations(item.task);
  const dateText = item.diff < 0
    ? `Просрочено ${Math.abs(item.diff)} дн.`
    : item.diff === 0
      ? "Сегодня"
      : `Через ${item.diff} дн. - ${formatDate(item.task.nextDate)}`;
  const title = `${workLabel(item.task.type)} - ${item.plant.name}`;

  return `
    <article class="reminder-card ${statusClass} ${compact ? "is-compact" : ""}">
      <div class="task-icon task-${item.task.type}">${iconImage(workIcon(item.task.type), "task-color-icon")}</div>
      <div class="reminder-info">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(dateText)} · ${escapeHtml(taskRepeatText(item.task))}${item.task.notes ? ` · ${escapeHtml(item.task.notes)}` : ""}</p>
        ${preparationsInline(preparations)}
      </div>
      <div class="card-actions">
        <button class="icon-btn feed-edit-btn" type="button" data-action="edit-task" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}" title="Редактировать">
          <i class="ti ti-settings"></i>
        </button>
        ${completionButton(item)}
      </div>
    </article>
  `;
}

function timelineCard(item) {
  const statusClass = item.status === "overdue" ? "overdue-card" : item.status === "today" ? "today-card" : "";
  const preparations = getPreparations(item.task);
  const workTitle = `${workLabel(item.task.type)} - ${item.plant.name}`;
  const repeatText = taskRepeatText(item.task);

  return `
    <article class="reminder-card timeline-card ${statusClass}" data-feed-date="${escapeHtml(item.task.nextDate)}">
      <div class="task-icon task-${item.task.type}">${iconImage(workIcon(item.task.type), "task-color-icon")}</div>
      <div class="reminder-info">
        <h3>${escapeHtml(`${timelineDateTitle(item)} · ${workTitle}`)}</h3>
        <p>${escapeHtml(repeatText)}${item.task.notes ? ` · ${escapeHtml(item.task.notes)}` : ""}</p>
        ${preparationsInline(preparations)}
      </div>
      <div class="card-actions">
        <button class="icon-btn feed-edit-btn" type="button" data-action="edit-task" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}" title="Редактировать">
          <i class="ti ti-settings"></i>
        </button>
        ${completionButton(item)}
      </div>
    </article>
  `;
}

function historyFeedCard(entry, options = {}) {
  const preparations = getPreparations(entry);
  const preparationText = preparations.map((preparation) => preparation.name).join(" + ");
  const details = [preparationText, entry.note].filter(Boolean).join(" · ");
  return `
    <article class="reminder-card timeline-card history-card" data-feed-date="${escapeHtml(entry.doneDate)}" ${options.isLatest ? 'data-feed-anchor="latest-done"' : ""}>
      <div class="task-icon task-${entry.taskType}">${iconImage(workIcon(entry.taskType), "task-color-icon")}</div>
      <div class="reminder-info">
        <h3>${escapeHtml(`${formatDate(entry.doneDate)} · ${workLabel(entry.taskType)} - ${entry.plantName}`)}</h3>
        ${details ? `<p>${escapeHtml(details)}</p>` : ""}
        ${preparationsInline(preparations)}
      </div>
      <div class="card-actions history-status">
        <span class="action-pill action-done"><i class="ti ti-check"></i> Выполнено</span>
      </div>
    </article>
  `;
}

function completionButton(item) {
  return `<span class="action-pill action-planned action-status"><i class="ti ti-calendar"></i> Запланировано</span>`;
}

function timelineDateTitle(item) {
  return item.diff === 0 ? `Сегодня, ${formatDate(item.task.nextDate)}` : formatDate(item.task.nextDate);
}

function taskRepeatText(task) {
  if (task.repeatMode === "after") {
    return `повторить через ${task.interval} дн.`;
  }
  if (task.repeatMode === "calendar" || task.repeatMode === "again") {
    return task.repeatDate ? `повторить ${formatDate(task.repeatDate)}` : "повторить один раз";
  }
  if (task.repeatMode === "repeat" || task.repeat === true) {
    return `каждые ${task.interval} дн.`;
  }
  return "не повторять";
}

function scrollFeedToDate(isoDate) {
  const feed = els.upcomingList;
  const target = feed.querySelector(`[data-feed-date="${CSS.escape(isoDate)}"]`);
  if (!target) return;
  feed.scrollTop = Math.max(0, target.offsetTop - feed.offsetTop - 8);
}

function scrollFeedToSection(section) {
  const feed = els.upcomingList;
  const target = feed.querySelector(`[data-feed-section="${CSS.escape(section)}"]`);
  if (!target) return;
  feed.scrollTop = Math.max(0, target.offsetTop - feed.offsetTop - 8);
}

function scrollFeedToLatestDone() {
  const feed = els.upcomingList;
  const target = feed.querySelector('[data-feed-anchor="latest-done"]');
  if (!target) {
    feed.scrollTop = 0;
    return;
  }

  feed.scrollTop = Math.max(0, target.offsetTop - feed.offsetTop - 8);
}

function positionFeedAfterRender() {
  if (selectedTimelineDate) {
    scrollFeedToDate(selectedTimelineDate);
    return;
  }

  scrollFeedToLatestDone();
}

function renderWeekStrip(tasks) {
  const today = todayIso();
  const days = Array.from({ length: 7 }, (_, index) => {
    const iso = addCalendarDays(calendarStartDate, index);
    const plannedCount = tasks.filter((item) => item.task.nextDate === iso).length;
    const historyCount = state.log.filter((entry) => entry.doneDate === iso).length;
    const count = plannedCount + historyCount;
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
        <strong>${escapeHtml(workLabel(entry.taskType))}</strong>
        <small>${escapeHtml(entry.plantName)} · ${formatDate(entry.doneDate)}${preparationLogText(entry)}</small>
      </div>
    </div>
  `).join("") : emptyState("Журнал пока пуст");
}

function renderPlants() {
  const plants = state.plants.slice().sort((a, b) => a.name.localeCompare(b.name, "uk"));

  els.plantGrid.innerHTML = plants.length ? plants.map(plantCard).join("") : emptyState("Культуры не найдены");
}

function renderPreparations() {
  const preparations = (state.preparations || []).slice().sort((a, b) => a.name.localeCompare(b.name, "ru"));
  els.preparationGrid.innerHTML = preparations.length
    ? preparations.map(preparationCard).join("")
    : emptyState("Препараты пока не заведены");
}

function renderWorkTypes() {
  const workTypes = getWorkTypes();
  els.workTypeGrid.innerHTML = workTypes.length
    ? workTypes.map(workTypeCard).join("")
    : emptyState("Работы пока не добавлены");
}

function workTypeCard(workType) {
  const recentEntries = state.log
    .filter((entry) => entry.taskType === workType.id)
    .sort((a, b) => b.doneDate.localeCompare(a.doneDate))
    .slice(0, 3);
  const futureItems = getAllTasks(state.plants)
    .filter((item) => item.task.type === workType.id)
    .sort((a, b) => a.task.nextDate.localeCompare(b.task.nextDate) || a.plant.name.localeCompare(b.plant.name, "uk"))
    .slice(0, 5);

  return `
    <article class="plant-card work-type-card">
      <div class="plant-header">
        <div class="card-title-with-icon">
          ${iconImage(workType.icon, "card-color-icon")}
          <div>
            <h3>${escapeHtml(workType.label)}</h3>
            <p>Интервал по умолчанию: ${escapeHtml(String(workType.interval || 14))} дн.</p>
          </div>
        </div>
      </div>
      <div class="plant-work-grid">
        <section class="plant-work-section">
          <h4>Последние работы</h4>
          <div class="plant-work-list">
            ${recentEntries.length ? recentEntries.map(logMiniForWorkType).join("") : '<p class="muted">Записей пока нет</p>'}
          </div>
        </section>
        <section class="plant-work-section">
          <h4>Будущие работы</h4>
          <div class="plant-work-list">
            ${futureItems.length ? futureItems.map(taskMiniForWorkType).join("") : '<p class="muted">Работ пока нет</p>'}
          </div>
        </section>
      </div>
      <div class="plant-actions">
        <button class="action-pill action-edit action-compact action-compact-small" type="button" data-action="edit-work-type" data-work-type-id="${escapeHtml(workType.id)}">
          <i class="ti ti-pencil"></i> Настроить
        </button>
        <button class="action-pill action-delete action-compact action-compact-small" type="button" data-action="delete-work-type" data-work-type-id="${escapeHtml(workType.id)}">
          <i class="ti ti-circle-minus"></i> Удалить
        </button>
      </div>
    </article>
  `;
}

function logMiniForWorkType(entry) {
  return `
    <div class="work-mini">
      <span class="task-dot task-${entry.taskType}"></span>
      <div>
        <strong>${escapeHtml(entry.plantName)}</strong>
        <small>${formatDate(entry.doneDate)}${preparationLogText(entry)}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}</small>
      </div>
    </div>
  `;
}

function taskMiniForWorkType(item) {
  const preparations = getPreparations(item.task);
  const preparationText = preparations.map((preparation) => preparation.name).join(" + ");
  const dateClass = item.status === "overdue" ? "overdue" : item.status === "today" ? "today" : "";
  const dateText = item.diff < 0 ? `просрочено ${Math.abs(item.diff)}д` : item.diff === 0 ? "сегодня" : formatDate(item.task.nextDate);
  return `
    <div class="task-mini work-mini">
      <span class="task-dot task-${item.task.type}"></span>
      <div>
        <strong>${escapeHtml(item.plant.name)}</strong>
        <small><span class="task-date ${dateClass}">${escapeHtml(dateText)}</span>${preparationText ? ` · ${escapeHtml(preparationText)}` : ""}${item.task.notes ? ` · ${escapeHtml(item.task.notes)}` : ""}</small>
      </div>
    </div>
  `;
}

function getWorkTypes() {
  const customTypes = Array.isArray(state.workTypes) ? state.workTypes : [];
  if (customTypes.length) {
    return customTypes;
  }

  return Object.entries(TASK_LABELS).map(([id, label]) => ({
    id,
    label,
    icon: workIconDefault(id),
    interval: DEFAULT_INTERVALS[id]?.other || 14,
  }));
}

function getWorkType(type) {
  return getWorkTypes().find((workType) => workType.id === type) || null;
}

function workLabel(type) {
  return getWorkType(type)?.label || TASK_LABELS[type] || type;
}

function workIcon(type) {
  return normalizeIconName(getWorkType(type)?.icon || workIconDefault(type));
}

function defaultIntervalForWork(type, plantType = "other") {
  return Number(getWorkType(type)?.interval || DEFAULT_INTERVALS[type]?.[plantType] || DEFAULT_INTERVALS[type]?.other || 14);
}

function workTypeOptions(selectedType = "") {
  const workTypes = getWorkTypes().slice();
  if (selectedType && !workTypes.some((workType) => workType.id === selectedType)) {
    workTypes.push({
      id: selectedType,
      label: workLabel(selectedType),
      icon: workIcon(selectedType),
      interval: defaultIntervalForWork(selectedType),
    });
  }

  return workTypes
    .map((workType) => `<option value="${escapeHtml(workType.id)}">${escapeHtml(workType.label)}</option>`)
    .join("");
}

function renderWorkTypeSelect(select, selectedType = "") {
  select.innerHTML = workTypeOptions(selectedType);
  if (selectedType) {
    select.value = selectedType;
  }
}

function workIconDefault(type) {
  return {
    plant: "seedling",
    water: "droplet",
    feed: "herb",
    treat: "bug",
    prune: "scissors",
    inspect: "magnifying-glass-tilted-left",
    harvest: "basket",
    repot: "potted-plant",
  }[type] || "spiral-calendar";
}

function plantIcon(plant) {
  return normalizeIconName(plant.icon || plantIconDefault(plant));
}

function plantIconDefault(plant = {}) {
  const name = String(plant.name || "").toLowerCase();
  if (name.includes("петун")) return "blossom";
  if (name.includes("катаран")) return "hibiscus";
  if (name.includes("бегон")) return "rose";
  if (name.includes("томат") || name.includes("помид")) return "tomato";
  if (name.includes("перец") || name.includes("перц")) return "hot-pepper";
  if (name.includes("огур")) return "cucumber";
  if (name.includes("кукуруз")) return "ear-of-corn";
  if (plant.type === "flower") return "blossom";
  if (plant.type === "veg") return "tomato";
  if (plant.type === "herb") return "herb";
  return "seedling";
}

function normalizeIconName(icon) {
  const legacyMap = {
    "ti-plant": "seedling",
    "ti-plant-2": "seedling",
    "ti-droplet": "droplet",
    "ti-leaf": "herb",
    "ti-bug": "bug",
    "ti-scissors": "scissors",
    "ti-search": "magnifying-glass-tilted-left",
    "ti-basket": "basket",
    "ti-calendar": "spiral-calendar",
  };
  const value = String(icon || "").trim();
  const normalized = legacyMap[value] || value;
  return ICON_CHOICES.some((choice) => choice.id === normalized) ? normalized : "seedling";
}

function iconImage(icon, className = "color-icon") {
  const iconName = normalizeIconName(icon);
  return `<img class="${escapeHtml(className)}" src="./src/assets/icons/${escapeHtml(iconName)}.svg" alt="" loading="lazy">`;
}

function renderIconPicker(container, input, selectedIcon) {
  const icon = normalizeIconName(selectedIcon);
  input.value = icon;
  container.innerHTML = ICON_CHOICES.map((choice) => `
    <button class="icon-choice ${choice.id === icon ? "is-selected" : ""}" type="button" data-icon="${escapeHtml(choice.id)}" title="${escapeHtml(choice.label)}" aria-pressed="${choice.id === icon}">
      ${iconImage(choice.id, "icon-choice-image")}
    </button>
  `).join("");
}

function selectIconFromPicker(event, input, container) {
  const button = event.target.closest("[data-icon]");
  if (!button) return;

  renderIconPicker(container, input, button.dataset.icon);
}

function preparationCard(preparation) {
  const purpose = preparationPurpose(preparation);
  const details = preparationDetails(preparation);
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
        ${purpose ? `<p class="preparation-purpose"><strong>От чего:</strong> ${escapeHtml(purpose)}</p>` : ""}
        ${preparation.dosage ? `<p class="preparation-dosage"><strong>Дозировка:</strong> ${escapeHtml(preparation.dosage)}</p>` : ""}
        <p class="preparation-description">${details ? escapeHtml(details) : "Описание пока не добавлено"}</p>
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
        <div class="card-title-with-icon">
          ${iconImage(plantIcon(plant), "card-color-icon")}
          <div>
            <h3>${escapeHtml(plant.name)}</h3>
            <p>${plant.location ? escapeHtml(plant.location) + " · " : ""}учет с ${formatDate(plant.planted)}</p>
          </div>
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
        <button class="action-pill action-edit action-compact action-compact-small" type="button" data-action="edit-plant" data-plant-id="${plant.id}"><i class="ti ti-pencil"></i> Настроить</button>
        <button class="action-pill action-delete action-compact action-compact-small" type="button" data-action="delete-plant" data-plant-id="${plant.id}"><i class="ti ti-circle-minus"></i> Удалить</button>
      </div>
    </article>
  `;
}

function logMiniForPlant(entry) {
  return `
    <div class="work-mini">
      <span class="task-dot task-${entry.taskType}"></span>
      <div>
        <strong>${escapeHtml(workLabel(entry.taskType))}</strong>
        <small>${formatDate(entry.doneDate)}${preparationLogText(entry)}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}</small>
      </div>
    </div>
  `;
}

function taskMini(task) {
  const item = getAllTasks([{ tasks: [task] }])[0];
  const preparations = getPreparations(task);
  const preparationText = preparations.map((preparation) => preparation.name).join(" + ");
  const dateClass = item.status === "overdue" ? "overdue" : item.status === "today" ? "today" : "";
  const dateText = item.diff < 0 ? `просрочено ${Math.abs(item.diff)}д` : item.diff === 0 ? "сегодня" : formatDate(task.nextDate);
  return `
    <div class="task-mini work-mini">
      <span class="task-dot task-${task.type}"></span>
      <div>
        <strong>${escapeHtml(workLabel(task.type))}</strong>
        <small><span class="task-date ${dateClass}">${escapeHtml(dateText)}</span>${preparationText ? ` · ${escapeHtml(preparationText)}` : ""}${task.notes ? ` · ${escapeHtml(task.notes)}` : ""}</small>
      </div>
    </div>
  `;
}

function renderLog() {
  const search = els.logSearch.value.trim().toLowerCase();
  const entries = state.log
    .filter((entry) => {
      if (!search) return true;
      const preparationNames = getPreparations(entry).map((preparation) => preparation.name).join(" ");
      return [entry.plantName, workLabel(entry.taskType), preparationNames, entry.note]
        .some((value) => String(value || "").toLowerCase().includes(search));
    })
    .sort((a, b) => b.doneDate.localeCompare(a.doneDate));

  els.logList.innerHTML = entries.length ? entries.map(logRow).join("") : emptyState("Журнал пуст");
}

function logRow(entry) {
  const preparations = getPreparations(entry);
  const preparationText = preparations.map((preparation) => preparation.name).join(" + ");
  const nextText = entry.nextScheduled ? ` · следующее ${formatDate(entry.nextScheduled)}` : " · без повторения";
  return `
    <article class="log-row">
      <div class="task-icon task-${entry.taskType}">${iconImage(workIcon(entry.taskType), "task-color-icon")}</div>
      <div>
        <h3>${escapeHtml(entry.plantName)}</h3>
        <p>${escapeHtml(workLabel(entry.taskType))}${preparationText ? ` · ${escapeHtml(preparationText)}` : ""}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}${escapeHtml(nextText)}</p>
        ${preparationsInline(preparations)}
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
      task.preparationIds = getPreparationIds(task).filter((id) => id !== preparation.id);
      task.preparationId = task.preparationIds[0] || "";
    });
  });
  state.log.forEach((entry) => {
    entry.preparationIds = getPreparationIds(entry).filter((id) => id !== preparation.id);
    entry.preparationId = entry.preparationIds[0] || "";
  });
  persistAndRender();
}

function onWorkTypeGridClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const workType = getWorkTypes().find((item) => item.id === button.dataset.workTypeId);
  if (!workType) return;

  if (button.dataset.action === "edit-work-type") {
    openWorkTypeDialog(workType);
  }

  if (button.dataset.action === "delete-work-type") {
    deleteWorkType(workType);
  }
}

function openWorkTypeDialog(workType = null) {
  els.workTypeForm.reset();
  els.workTypeId.value = workType?.id || "";
  els.workTypeLabel.value = workType?.label || "";
  els.workTypeInterval.value = workType?.interval || 14;
  renderIconPicker(els.workTypeIconPicker, els.workTypeIcon, workType?.icon || "seedling");
  els.workTypeDialogTitle.textContent = workType ? "Настроить работу" : "Новая работа";
  els.workTypeDialog.showModal();
}

function saveWorkTypeFromForm(event) {
  event.preventDefault();
  const id = els.workTypeId.value || makeId("work");
  const existing = getWorkType(id);
  const workType = {
    id,
    label: els.workTypeLabel.value.trim(),
    icon: normalizeIconName(els.workTypeIcon.value || existing?.icon || workIconDefault(id)),
    interval: Number(els.workTypeInterval.value || 14),
  };
  if (!workType.label) return;

  const existingIndex = state.workTypes.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.workTypes[existingIndex] = workType;
  } else {
    state.workTypes.push(workType);
  }

  els.workTypeDialog.close();
  persistAndRender();
}

function deleteWorkType(workType) {
  const inUse = state.plants.some((plant) => plant.tasks.some((task) => task.type === workType.id))
    || state.log.some((entry) => entry.taskType === workType.id);
  const message = inUse
    ? `Удалить работу "${workType.label}" из справочника? Старые записи останутся, но в новых заданиях ее не будет.`
    : `Удалить работу "${workType.label}"?`;
  if (!confirm(message)) return;

  state.workTypes = state.workTypes.filter((item) => item.id !== workType.id);
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
  renderIconPicker(els.plantIconPicker, els.plantIcon, plantIcon(plant || { type: "flower" }));
  els.plantDialogTitle.textContent = plant ? "Настроить культуру" : "Новая культура";

  const rows = plant?.tasks?.length ? plant.tasks : [normalizeTask({}, plant?.type || "flower")];
  rows.forEach((task) => addTaskRow(task));
  els.plantDialog.showModal();
}

function addTaskRow(task = {}) {
  const node = els.taskRowTemplate.content.firstElementChild.cloneNode(true);
  const type = task.type || "water";
  node.querySelector(".task-id").value = task.id || "";
  renderWorkTypeSelect(node.querySelector(".task-type"), type);
  node.querySelector(".task-preparation").innerHTML = preparationOptions(getPreparationIds(task), null);
  node.querySelector(".task-next-date").value = task.nextDate || todayIso();
  node.querySelector(".task-interval").value = task.interval || defaultIntervalForWork(type, "flower");
  node.querySelector(".task-notes").value = task.notes || "";
  node.querySelector(".remove-task-btn").addEventListener("click", () => node.remove());
  node.querySelector(".task-type").addEventListener("change", (event) => {
    const plantType = document.querySelector("#plant-type").value;
    node.querySelector(".task-interval").value = defaultIntervalForWork(event.target.value, plantType);
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
    icon: els.plantIcon.value,
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
      preparationIds: selectedValues(row.querySelector(".task-preparation")),
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
  els.doneMode.value = doneModeValue(task);
  els.doneRepeatDate.value = task.repeatDate || addCalendarDays(task.nextDate || todayIso(), Number(task.interval || 14));
  els.doneInterval.value = task.interval;
  updateDoneModeFields();
  els.doneDialogTitle.textContent = `Сделано: ${workLabel(task.type)} - ${plant.name}`;
  els.doneDialog.showModal();
}

function updateDoneModeFields() {
  const mode = els.doneMode.value;
  const usesInterval = mode === "after" || mode === "repeat";
  els.doneRepeatDateField.classList.toggle("is-hidden", mode !== "calendar");
  els.doneIntervalField.classList.toggle("is-hidden", !usesInterval);
  els.doneRepeatDate.required = mode === "calendar";
  els.doneInterval.required = usesInterval;
  els.doneInterval.disabled = !usesInterval;
  els.doneIntervalLabel.textContent = mode === "after" ? "Повторить через, дней" : "Повторять каждые, дней";
}

function doneModeValue(task) {
  if (task.repeatMode === "after") return "after";
  if (task.repeatMode === "calendar" || task.repeatMode === "again") return "calendar";
  if (task.repeatMode === "repeat" || task.repeat === true) return "repeat";
  return "stop";
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
  renderWorkPreparationPicker(getPreparationIds(existingTask || options));
  els.workStatus.value = isEditing ? "planned" : "planned";
  els.workType.value = type;
  els.workNextDate.value = existingTask?.nextDate || todayIso();
  els.workRepeat.value = workModeValue(existingTask, options);
  renderWorkTypeSelect(els.workType, type);
  els.workRepeatDate.value = existingTask?.repeatDate || addCalendarDays(existingTask?.nextDate || todayIso(), existingTask?.interval || defaultIntervalForWork(type, selectedPlant?.type || "other"));
  els.workInterval.value = existingTask?.interval || defaultIntervalForWork(type, selectedPlant?.type || "other");
  els.workNotes.value = existingTask?.notes || "";
  els.workSubmitButton.textContent = isEditing ? "Сохранить" : "Добавить";
  updateWorkModeFields({ resetInterval: false });
  syncWorkDialogTitle();
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

function renderWorkPreparationPicker(selectedIds = []) {
  const ids = selectedIds.filter((id) => state.preparations.some((preparation) => preparation.id === id));
  const availablePreparations = state.preparations
    .filter((preparation) => !ids.includes(preparation.id))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  const emptyLabel = availablePreparations.length ? "Выбрать препарат" : "Все препараты добавлены";

  els.workPreparationId.innerHTML = [
    `<option value="">${escapeHtml(emptyLabel)}</option>`,
    ...availablePreparations.map((preparation) => `<option value="${escapeHtml(preparation.id)}">${escapeHtml(preparation.name)}</option>`),
  ].join("");
  els.workPreparationId.disabled = availablePreparations.length === 0;
  renderWorkPreparationSelection(ids);
  updateWorkPreparationAddState();
}

function renderWorkPreparationSelection(ids) {
  const preparations = ids.map(getPreparation).filter(Boolean);
  els.workPreparationPreview.classList.toggle("is-empty", preparations.length === 0);
  els.workPreparationPreview.innerHTML = preparations.length
    ? preparations.map((preparation) => `
      <article class="preparation-selected" data-work-preparation-id="${escapeHtml(preparation.id)}">
        ${preparationImage(preparation, "preparation-preview-image")}
        <div>
          <strong>${escapeHtml(preparation.name)}</strong>
          ${preparationPurpose(preparation) ? `<p class="preparation-purpose">От чего: ${escapeHtml(preparationPurpose(preparation))}</p>` : ""}
          ${preparation.dosage ? `<p class="preparation-preview-dosage">Дозировка: ${escapeHtml(preparation.dosage)}</p>` : ""}
          <p>${escapeHtml(preparationDetails(preparation) || "Описание пока не добавлено")}</p>
        </div>
        <button class="icon-btn preparation-remove-btn" type="button" data-remove-work-preparation="${escapeHtml(preparation.id)}" title="Убрать препарат">
          <i class="ti ti-x"></i>
        </button>
      </article>
    `).join("")
    : '<p class="muted">Препараты не выбраны</p>';
}

function updateWorkPreparationAddState() {
  els.addWorkPreparationBtn.disabled = !els.workPreparationId.value;
}

function addWorkPreparationFromSelect() {
  const preparationId = els.workPreparationId.value;
  if (!preparationId) return;
  renderWorkPreparationPicker([...getWorkPreparationIds(), preparationId]);
}

function removeWorkPreparation(event) {
  const button = event.target.closest("[data-remove-work-preparation]");
  if (!button) return;

  renderWorkPreparationPicker(getWorkPreparationIds().filter((id) => id !== button.dataset.removeWorkPreparation));
}

function getWorkPreparationIds() {
  return [...els.workPreparationPreview.querySelectorAll("[data-work-preparation-id]")]
    .map((item) => item.dataset.workPreparationId)
    .filter(Boolean);
}

function updateWorkIntervalDefault({ resetInterval = true } = {}) {
  updateWorkModeFields({ resetInterval });
}

function updateWorkModeFields({ resetInterval = true } = {}) {
  const plant = state.plants.find((item) => item.id === els.workPlantId.value);
  const type = els.workType.value || "water";
  if (resetInterval) {
    els.workInterval.value = defaultIntervalForWork(type, plant?.type || "other");
  }
  const mode = els.workRepeat.value;
  const usesInterval = mode === "after" || mode === "repeat";
  els.workRepeatDateField.classList.toggle("is-hidden", mode !== "calendar");
  els.workIntervalField.classList.toggle("is-hidden", !usesInterval);
  els.workRepeatDate.required = mode === "calendar";
  els.workInterval.required = usesInterval;
  els.workInterval.disabled = !usesInterval;
  els.workIntervalLabel.textContent = mode === "after" ? "Повторить через, дней" : "Повторять каждые, дней";
  syncWorkDialogTitle();
}

function syncWorkDialogTitle() {
  const type = els.workType.value || "water";
  const label = workLabel(type).toLowerCase();
  els.workDialogTitle.textContent = els.workTaskId.value ? `Редактировать ${label}` : `Новое задание: ${label}`;
}

function workModeValue(existingTask, options = {}) {
  if (existingTask?.repeatMode === "after") return "after";
  if (existingTask?.repeatMode === "calendar" || existingTask?.repeatMode === "again") return "calendar";
  if (existingTask?.repeatMode === "repeat" || existingTask?.repeat === true) return "repeat";
  if (existingTask) return "once";
  return options.repeat ? "repeat" : "once";
}

function saveWorkFromForm(event) {
  event.preventDefault();
  const plant = state.plants.find((item) => item.id === els.workPlantId.value);
  if (!plant) return;
  const taskId = els.workTaskId.value || makeId("task");
  const repeatMode = els.workRepeat.value;
  const status = els.workStatus.value || "planned";
  let existingTask = null;
  let existingTaskPlant = null;

  if (els.workTaskId.value) {
    state.plants.forEach((item) => {
      const foundTask = item.tasks.find((task) => task.id === els.workTaskId.value);
      if (foundTask) {
        existingTask = foundTask;
        existingTaskPlant = item;
      }
    });
  }

  const taskData = normalizeTask({
    id: taskId,
    type: els.workType.value,
    preparationIds: getWorkPreparationIds(),
    nextDate: els.workNextDate.value,
    interval: Number(els.workInterval.value),
    repeat: repeatMode === "repeat",
    repeatMode,
    repeatDate: repeatMode === "calendar" ? els.workRepeatDate.value : "",
    notes: els.workNotes.value,
  }, plant.type);

  if (status === "done") {
    let taskForCompletion = taskData;

    if (existingTask && existingTaskPlant === plant) {
      Object.assign(existingTask, taskData);
      taskForCompletion = existingTask;
    } else {
      if (existingTaskPlant) {
        existingTaskPlant.tasks = existingTaskPlant.tasks.filter((task) => task.id !== existingTask.id);
      }
      plant.tasks.push(taskForCompletion);
    }

    const logEntry = completeTask({
      plant,
      task: taskForCompletion,
      doneDate: els.workNextDate.value,
      note: els.workNotes.value,
      interval: Number(els.workInterval.value),
      repeat: repeatMode === "repeat",
      repeatMode,
      repeatDate: repeatMode === "calendar" ? els.workRepeatDate.value : "",
    });
    state.log.push(logEntry);
  } else {
    if (existingTaskPlant) {
      existingTaskPlant.tasks = existingTaskPlant.tasks.filter((task) => task.id !== existingTask.id);
    }
    plant.tasks.push(taskData);
  }

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
    repeatMode: document.querySelector("#done-mode").value,
    repeatDate: document.querySelector("#done-mode").value === "calendar" ? document.querySelector("#done-repeat-date").value : "",
  });

  state.log.push(logEntry);
  els.doneDialog.close();
  persistAndRender();
}

function openPostponeDialogFromDoneDialog() {
  const plant = state.plants.find((item) => item.id === document.querySelector("#done-plant-id").value);
  const task = plant?.tasks.find((item) => item.id === document.querySelector("#done-task-id").value);
  if (!plant || !task) return;

  els.postponeForm.reset();
  els.postponePlantId.value = plant.id;
  els.postponeTaskId.value = task.id;
  els.postponeDate.value = task.nextDate || todayIso();
  postponeCalendarMonth = getMonthStart(els.postponeDate.value);
  renderPostponeCalendar();
  els.postponeDialogTitle.textContent = `Перенести: ${workLabel(task.type)} - ${plant.name}`;
  els.doneDialog.close();
  els.postponeDialog.showModal();
}

function savePostponeFromForm(event) {
  event.preventDefault();
  const plant = state.plants.find((item) => item.id === els.postponePlantId.value);
  const task = plant?.tasks.find((item) => item.id === els.postponeTaskId.value);
  if (!plant || !task) return;

  task.nextDate = els.postponeDate.value;
  els.postponeDialog.close();
  persistAndRender();
}

function syncPostponeCalendarFromInput() {
  postponeCalendarMonth = getMonthStart(els.postponeDate.value || todayIso());
  renderPostponeCalendar();
}

function shiftPostponeMonth(delta) {
  postponeCalendarMonth = addCalendarMonths(postponeCalendarMonth, delta);
  renderPostponeCalendar();
}

function onPostponeCalendarClick(event) {
  const button = event.target.closest("[data-postpone-date]");
  if (!button) return;

  els.postponeDate.value = button.dataset.postponeDate;
  postponeCalendarMonth = getMonthStart(els.postponeDate.value);
  renderPostponeCalendar();
}

function renderPostponeCalendar() {
  const selectedDate = els.postponeDate.value || todayIso();
  postponeCalendarMonth = getMonthStart(postponeCalendarMonth || selectedDate);
  const [year, month] = postponeCalendarMonth.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("ru", { month: "long", year: "numeric" }).format(monthStart);
  const today = todayIso();
  const cells = [];

  els.postponeMonthLabel.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  for (let day = 0; day < firstWeekday; day += 1) {
    cells.push('<span class="postpone-calendar-day is-empty"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = makeIsoDate(year, month, day);
    const classes = [
      "postpone-calendar-day",
      isoDate === selectedDate ? "is-selected" : "",
      isoDate === today ? "is-today" : "",
    ].filter(Boolean).join(" ");
    cells.push(`
      <button class="${classes}" type="button" data-postpone-date="${isoDate}">
        ${day}
      </button>
    `);
  }

  const tailCells = (7 - (cells.length % 7)) % 7;
  for (let day = 0; day < tailCells; day += 1) {
    cells.push('<span class="postpone-calendar-day is-empty"></span>');
  }

  els.postponeCalendarGrid.innerHTML = cells.join("");
}

function clearLog() {
  if (!state.log.length) return;
  if (!confirm("Очистить весь журнал выполненных работ? Цветы, овощи и будущие работы останутся.")) return;
  state.log = [];
  persistAndRender();
}

function addCalendarDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Number(days || 0));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addCalendarMonths(isoDate, months) {
  const [year, month] = getMonthStart(isoDate).split("-").map(Number);
  const date = new Date(year, month - 1 + Number(months || 0), 1);
  return makeIsoDate(date.getFullYear(), date.getMonth() + 1, 1);
}

function getMonthStart(isoDate) {
  const [year, month] = (isoDate || todayIso()).split("-").map(Number);
  return makeIsoDate(year, month || 1, 1);
}

function makeIsoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function closeDialog(id) {
  document.querySelector(`#${id}`)?.close();
}

function closeDialogOnBackdrop(event) {
  if (event.target === event.currentTarget) {
    event.currentTarget.close();
  }
}

function preparationOptions(selectedIds = [], emptyLabel = "Без препарата") {
  const selectedSet = new Set(Array.isArray(selectedIds) ? selectedIds : [selectedIds].filter(Boolean));
  const options = emptyLabel === null ? [] : [`<option value="">${escapeHtml(emptyLabel)}</option>`];
  options.push(...(state.preparations || [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .map((preparation) => `
      <option value="${escapeHtml(preparation.id)}" ${selectedSet.has(preparation.id) ? "selected" : ""}>
        ${escapeHtml(preparation.name)}
      </option>
    `));
  return options.join("");
}

function getPreparation(preparationId) {
  if (!preparationId) return null;
  return state.preparations.find((preparation) => preparation.id === preparationId) || null;
}

function getPreparationIds(item = {}) {
  const ids = Array.isArray(item.preparationIds) ? item.preparationIds : [item.preparationId];
  return [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))];
}

function getPreparations(item = {}) {
  return getPreparationIds(item).map(getPreparation).filter(Boolean);
}

function preparationLogText(entry) {
  const names = getPreparations(entry).map((preparation) => preparation.name).join(" + ");
  return names ? ` · ${escapeHtml(names)}` : "";
}

function preparationsInline(preparations) {
  return preparations.length ? `<div class="preparation-stack">${preparations.map(preparationInline).join("")}</div>` : "";
}

function preparationInline(preparation) {
  const purpose = preparationPurpose(preparation);
  return `
    <div class="preparation-inline">
      ${preparationImage(preparation, "preparation-inline-image")}
      <div>
        <strong>${escapeHtml(preparation.name)}</strong>
        ${purpose ? `<small class="preparation-purpose">От чего: ${escapeHtml(purpose)}</small>` : ""}
        <small>${escapeHtml(preparation.dosage ? `Дозировка: ${preparation.dosage}` : PREPARATION_CATEGORY_LABELS[preparation.category] || "Препарат")}</small>
      </div>
    </div>
  `;
}

function preparationPurpose(preparation) {
  const match = String(preparation.description || "").match(/Назначение:\s*([^]+?)(?:$| Упаковка:| Дозировка:)/);
  return match ? match[1].replace(/[.\s]+$/g, "").trim() : "";
}

function preparationDetails(preparation) {
  return String(preparation.description || "")
    .replace(/\s*Назначение:\s*[^]+?(?=$| Упаковка:| Дозировка:)/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function selectedValues(select) {
  return [...select.selectedOptions].map((option) => option.value).filter(Boolean);
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
