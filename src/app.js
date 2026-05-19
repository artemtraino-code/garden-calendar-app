import {
  DEFAULT_INTERVALS,
  PLANT_TYPE_LABELS,
  PREPARATION_CATEGORY_LABELS,
  TASK_LABELS,
  completeTask,
  formatDate,
  formatWeekday,
  getAllTasks,
  makeId,
  normalizePlant,
  normalizePreparation,
  normalizeTask,
  systemTaskStatus,
  todayIso,
} from "./calendar.js?v=20260520-auth-4";
import { loadState, saveState } from "./storage.js?v=20260520-auth-4";
import { initializeAuth } from "./auth.js?v=20260520-auth-4";

if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app should keep working even when the browser blocks service workers.
    });
  });
}

let state = loadState();
state.preparations ||= [];
state.workTypes ||= [];
let remoteStore = null;
let activeTab = "today";
let activeSettingsTab = "objects";
let dashboardView = "timeline";
let selectedTimelineDate = "";
let activeFeedFilter = "";
let calendarStartDate = todayIso();
let postponeCalendarMonth = todayIso().slice(0, 7) + "-01";

const WORK_REPEAT_MODE_CONFIG = {
  once: {
    detailLabel: "Повторение",
    staticValue: "Не повторять",
    usesInterval: false,
    usesCalendar: false,
  },
  calendar: {
    detailLabel: "Дата повторения",
    staticValue: "",
    usesInterval: false,
    usesCalendar: true,
  },
  after: {
    detailLabel: "Повторить через, дней",
    staticValue: "",
    usesInterval: true,
    usesCalendar: false,
  },
  repeat: {
    detailLabel: "Повторять каждые, дней",
    staticValue: "",
    usesInterval: true,
    usesCalendar: false,
  },
};

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

const BUILTIN_PLANT_TYPES = [
  { id: "flower", label: "Цветы" },
  { id: "veg", label: "Овощи" },
  { id: "berry", label: "Ягоды" },
  { id: "fruit", label: "Фрукты" },
  { id: "herb", label: "Зелень" },
  { id: "spice-herb", label: "Пряные травы" },
  { id: "leafy", label: "Листовые" },
  { id: "root", label: "Корнеплоды" },
  { id: "legume", label: "Бобовые" },
  { id: "cucurbit", label: "Тыквенные" },
  { id: "nightshade", label: "Пасленовые" },
  { id: "brassica", label: "Капустные" },
  { id: "allium", label: "Луковые" },
  { id: "shrub", label: "Кустарники" },
  { id: "tree", label: "Деревья" },
  { id: "vine", label: "Лианы" },
  { id: "other", label: "Другое" },
];

const PREPARATION_SHORT_LABELS = {
  prep_aktara: "від ґрунтових шкідників",
  prep_store_aktelik: "від комах і кліщів",
  prep_store_ampligo: "від тлі та гусениць",
  prep_store_protrujnyk_antyhrushh: "від хруща і дротяника",
  prep_vertimek: "від кліщів і трипсів",
  prep_store_kvadris: "від грибкових хвороб",
  prep_previkur: "від грибкових інфекцій",
  prep_store_insektytsyd_enzhio: "від попелиці і трипсів",
  prep_store_proklejm_4_g_syngenta_insektytsyd_zahyst_vid_lystogryzuchyh_shkidnykiv: "від гусениць",
  prep_store_fungitsyd_revus_top: "від фітофторозу",
  prep_store_ridomil_gold_fungitsyd: "від гнилі та хвороб",
  prep_store_sanmajt: "від кліщів",
  prep_store_fungitsyd_svitch: "від сірої гнилі",
  prep_store_fungitsyd_signum: "від парші і роси",
  prep_store_skor: "від борошнистої роси",
  prep_store_teppeki_teppeki_insektitsid: "від попелиці",
  prep_store_insektytsyd_tempo: "від попелиці і трипсів",
  prep_topas: "від роси і гнилі",
  prep_store_horus_fungitsyd: "від парші і роси",
  prep_store_ukorinyuvach_ryzopon: "для вкорінення",
  prep_store_biostymulyator_izabion: "антистрес і ріст",
  prep_store_prylypach_glyusten: "прилипач для ЗЗР",
  prep_store_kvantum_quantum: "прилипач для листя",
  prep_megafol: "антистрес після пересадки",
  prep_store_biostimulyator_radifarm: "для кореневої системи",
  prep_store_brexil_mix: "від дефіциту мікроелементів",
  prep_store_brexil_ca: "кальцій від вершинки",
  prep_store_osmocote_bloom: "для петуній",
  prep_master_202020: "для росту і цвітіння",
  prep_store_plantafol_20_20_20: "листове підживлення",
  prep_store_monofosfat_kaliya: "для цвітіння і кореня",
  prep_store_kaltsinit_kaltsievaya_selitra: "кальцій від гнилі",
  prep_store_boro_plus: "бор для зав'язі",
};

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
  openSettingsBtn: document.querySelector("#open-settings-btn"),
  settingsDialog: document.querySelector("#settings-dialog"),
  plantDialog: document.querySelector("#plant-dialog"),
  plantForm: document.querySelector("#plant-form"),
  plantDialogTitle: document.querySelector("#plant-dialog-title"),
  plantEntryKind: document.querySelector("#plant-entry-kind"),
  plantName: document.querySelector("#plant-name"),
  plantGroupsField: document.querySelector("#plant-groups-field"),
  plantType: document.querySelector("#plant-type"),
  plantTypeLabel: document.querySelector("#plant-type-label"),
  plantGroupIds: document.querySelector("#plant-group-ids"),
  plantGroupTrigger: document.querySelector("#plant-group-trigger"),
  plantGroupPanel: document.querySelector("#plant-group-panel"),
  plantGroupSearch: document.querySelector("#plant-group-search"),
  plantGroupOptions: document.querySelector("#plant-group-options"),
  plantGroupSelection: document.querySelector("#plant-group-selection"),
  plantIcon: document.querySelector("#plant-icon"),
  plantIconPicker: document.querySelector("#plant-icon-picker"),
  groupMembersField: document.querySelector("#group-members-field"),
  groupMemberIds: document.querySelector("#group-member-ids"),
  groupMemberTrigger: document.querySelector("#group-member-trigger"),
  groupMemberPanel: document.querySelector("#group-member-panel"),
  groupMemberSearch: document.querySelector("#group-member-search"),
  groupMemberOptions: document.querySelector("#group-member-options"),
  groupMembersList: document.querySelector("#group-members-list"),
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
  workLogId: document.querySelector("#work-log-id"),
  workPlantGroup: document.querySelector("#work-plant-group"),
  workPlantGroupTrigger: document.querySelector("#work-plant-group-trigger"),
  workPlantGroupPanel: document.querySelector("#work-plant-group-panel"),
  workPlantGroupSearch: document.querySelector("#work-plant-group-search"),
  workPlantGroupOptions: document.querySelector("#work-plant-group-options"),
  workPlantGroupSelection: document.querySelector("#work-plant-group-selection"),
  workPlantId: document.querySelector("#work-plant-id"),
  workPlantIdTrigger: document.querySelector("#work-plant-id-trigger"),
  workPlantIdPanel: document.querySelector("#work-plant-id-panel"),
  workPlantIdSearch: document.querySelector("#work-plant-id-search"),
  workPlantIdOptions: document.querySelector("#work-plant-id-options"),
  workPlantIdSelection: document.querySelector("#work-plant-id-selection"),
  workStatus: document.querySelector("#work-status"),
  workType: document.querySelector("#work-type"),
  workTypeTrigger: document.querySelector("#work-type-trigger"),
  workTypePanel: document.querySelector("#work-type-panel"),
  workTypeSearch: document.querySelector("#work-type-search"),
  workTypeOptions: document.querySelector("#work-type-options"),
  workTypeSelection: document.querySelector("#work-type-selection"),
  workNextDate: document.querySelector("#work-next-date"),
  workRepeatDetailField: document.querySelector("#work-repeat-detail-field"),
  workRepeatDetailLabel: document.querySelector("#work-repeat-detail-label"),
  workRepeatStatic: document.querySelector("#work-repeat-static"),
  workRepeatDate: document.querySelector("#work-repeat-date"),
  workInterval: document.querySelector("#work-interval"),
  workRepeat: document.querySelector("#work-repeat"),
  workPreparationId: document.querySelector("#work-preparation-id"),
  workPreparationTrigger: document.querySelector("#work-preparation-trigger"),
  workPreparationPanel: document.querySelector("#work-preparation-panel"),
  workPreparationSearch: document.querySelector("#work-preparation-search"),
  workPreparationOptions: document.querySelector("#work-preparation-options"),
  workPreparationPreview: document.querySelector("#work-preparation-preview"),
  workNotes: document.querySelector("#work-notes"),
  workDeleteBtn: document.querySelector("#work-delete-btn"),
  workRepeatBtn: document.querySelector("#work-repeat-btn"),
  workSubmitButton: document.querySelector("#work-submit-btn"),
  preparationDialog: document.querySelector("#preparation-dialog"),
  preparationForm: document.querySelector("#preparation-form"),
  preparationDialogTitle: document.querySelector("#preparation-dialog-title"),
  preparationId: document.querySelector("#preparation-id"),
  preparationName: document.querySelector("#preparation-name"),
  preparationCategory: document.querySelector("#preparation-category"),
  preparationImage: document.querySelector("#preparation-image"),
  preparationImageFile: document.querySelector("#preparation-image-file"),
  preparationImageUpload: document.querySelector("#preparation-image-upload"),
  preparationDosage: document.querySelector("#preparation-dosage"),
  preparationWaitingPeriod: document.querySelector("#preparation-waiting-period"),
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

boot();

async function boot() {
  const auth = await initializeAuth({ fallbackState: state });
  if (!auth.canUseApp) return;

  if (auth.state) {
    state = auth.state;
    state.preparations ||= [];
    state.workTypes ||= [];
  }

  remoteStore = auth.store || null;
  ensureDefaultPlantGroups();
  bindEvents();
  render();
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => handleTabClick(tab.dataset.tab));
  });
  els.openSettingsBtn.addEventListener("click", openSettingsDialog);
  document.querySelectorAll("[data-settings-tab]").forEach((tab) => {
    tab.addEventListener("click", () => switchSettingsTab(tab.dataset.settingsTab));
  });

  document.querySelector("#add-preparation-btn").addEventListener("click", () => openPreparationDialog());
  document.querySelector("#add-work-type-btn").addEventListener("click", () => openWorkTypeDialog());
  document.querySelector("#quick-add-plant-btn").addEventListener("click", () => openWorkDialog({ date: selectedTimelineDate || calendarStartDate || todayIso() }));
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
  els.plantGroupSearch.addEventListener("input", () => renderPlantDialogComboOptions("groups"));
  els.groupMemberSearch.addEventListener("input", () => renderPlantDialogComboOptions("members"));
  els.plantGroupTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    togglePlantDialogCombo("groups");
  });
  els.groupMemberTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    togglePlantDialogCombo("members");
  });
  els.plantGroupOptions.addEventListener("click", onPlantDialogComboClick);
  els.groupMemberOptions.addEventListener("click", onPlantDialogComboClick);
  els.plantGroupSelection.addEventListener("click", onPlantDialogComboSelectionRemove);
  els.groupMembersList.addEventListener("click", onPlantDialogComboSelectionRemove);
  els.doneForm.addEventListener("submit", saveDoneFromForm);
  els.doneMode.addEventListener("change", updateDoneModeFields);
  els.postponeTaskBtn.addEventListener("click", openPostponeDialogFromDoneDialog);
  els.postponeForm.addEventListener("submit", savePostponeFromForm);
  els.postponeDate.addEventListener("change", syncPostponeCalendarFromInput);
  els.postponeCalendarGrid.addEventListener("click", onPostponeCalendarClick);
  els.postponePrevMonthBtn.addEventListener("click", () => shiftPostponeMonth(-1));
  els.postponeNextMonthBtn.addEventListener("click", () => shiftPostponeMonth(1));
  els.workForm.addEventListener("submit", saveWorkFromForm);
  els.workPlantGroup.addEventListener("change", () => {
    renderWorkPlantOptions(selectedValues(els.workPlantId), selectedValues(els.workPlantGroup));
    updateWorkIntervalDefault();
  });
  els.workPlantGroupSearch.addEventListener("input", () => renderWorkComboOptions("group"));
  els.workPlantIdSearch.addEventListener("input", () => renderWorkComboOptions("plant"));
  els.workTypeSearch.addEventListener("input", () => renderWorkComboOptions("type"));
  els.workPreparationSearch.addEventListener("input", () => renderWorkComboOptions("preparation"));
  els.workPlantId.addEventListener("change", () => updateWorkIntervalDefault());
  els.workPlantGroupTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWorkCombo("group");
  });
  els.workPlantIdTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWorkCombo("plant");
  });
  els.workTypeTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWorkCombo("type");
  });
  els.workPreparationTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWorkCombo("preparation");
  });
  els.workPlantGroupOptions.addEventListener("click", onWorkComboClick);
  els.workPlantIdOptions.addEventListener("click", onWorkComboClick);
  els.workTypeOptions.addEventListener("click", onWorkComboClick);
  els.workPreparationOptions.addEventListener("click", onWorkComboClick);
  els.workPlantGroupSelection.addEventListener("click", onWorkComboSelectionRemove);
  els.workPlantIdSelection.addEventListener("click", onWorkComboSelectionRemove);
  els.workTypeSelection.addEventListener("click", onWorkComboSelectionRemove);
  els.workType.addEventListener("change", () => updateWorkIntervalDefault());
  els.workRepeat.addEventListener("change", () => updateWorkModeFields({ resetInterval: false }));
  els.workPreparationPreview.addEventListener("click", removeWorkPreparation);
  els.workStatus.addEventListener("change", updateWorkStatusAppearance);
  els.workDeleteBtn.addEventListener("click", deleteWorkFromDialog);
  els.workRepeatBtn.addEventListener("click", repeatWorkFromDialog);
  els.preparationForm.addEventListener("submit", savePreparationFromForm);
  els.preparationImageFile.addEventListener("change", onPreparationImageFileChange);
  els.workTypeForm.addEventListener("submit", saveWorkTypeFromForm);
  els.plantIconPicker.addEventListener("click", (event) => selectIconFromPicker(event, els.plantIcon, els.plantIconPicker, { allowEmpty: true }));
  els.workTypeIconPicker.addEventListener("click", (event) => selectIconFromPicker(event, els.workTypeIcon, els.workTypeIconPicker, { allowEmpty: true }));
  document.addEventListener("click", onDocumentClick);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
  });

  els.plantDialog.addEventListener("click", closeDialogOnBackdrop);
  els.doneDialog.addEventListener("click", closeDialogOnBackdrop);
  els.postponeDialog.addEventListener("click", closeDialogOnBackdrop);
  els.workDialog.addEventListener("click", closeDialogOnBackdrop);
  els.preparationDialog.addEventListener("click", closeDialogOnBackdrop);
  els.workTypeDialog.addEventListener("click", closeDialogOnBackdrop);
  els.settingsDialog.addEventListener("click", closeDialogOnBackdrop);
  els.settingsDialog.addEventListener("close", () => {
    els.openSettingsBtn.classList.remove("active");
  });

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
  if (!tabName) return;
  if (tabName === "today") {
    openDashboardToday();
    return;
  }

  switchTab(tabName);
}

function openSettingsDialog() {
  switchSettingsTab(activeSettingsTab);
  els.openSettingsBtn.classList.add("active");
  els.settingsDialog.showModal();
}

function switchSettingsTab(tabName = "objects") {
  activeSettingsTab = tabName || "objects";
  document.querySelectorAll("[data-settings-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.settingsTab === activeSettingsTab);
  });
  document.querySelectorAll(".settings-section").forEach((section) => {
    section.classList.toggle("active", section.id === `settings-tab-${activeSettingsTab}`);
  });
}

function openDashboardToday() {
  const today = todayIso();
  calendarStartDate = today;
  selectedTimelineDate = "";
  activeFeedFilter = "";
  switchTab("today");
  requestAnimationFrame(() => scrollFeedToDate(today));
}

function setDashboardView(view) {
  dashboardView = view || "timeline";
  switchTab("today");
}

function persistAndRender() {
  saveState(state);
  remoteStore?.saveState(state);
  render();
}

function renderToday() {
  const tasks = getSortedTimelineTasks();
  const allFeedGroups = getFeedGroups(tasks, { applyDate: false });
  els.calendarPanel.classList.remove("is-hidden");
  els.workPanel.classList.add("is-hidden");
  els.timelineLabel.textContent = "";
  renderTimelineCounters(allFeedGroups);
  els.upcomingList.classList.add("is-pending-scroll");
  els.upcomingList.innerHTML = renderUnifiedFeed(allFeedGroups);
  renderWeekStrip(tasks);
  renderQuickPlan(tasks);
  renderMiniLog();
  renderDashboardControls();
  requestAnimationFrame(() => {
    positionFeedAfterRender({ smooth: Boolean(selectedTimelineDate) });
    fitTimelineTitles();
    els.upcomingList.classList.remove("is-pending-scroll");
  });
}

function getSortedTimelineTasks() {
  return getAllTasks(state.plants).sort((a, b) => a.diff - b.diff || a.plant.name.localeCompare(b.plant.name, "uk"));
}

function hasEventsOnDate(isoDate) {
  if (!isoDate) return false;
  const hasHistory = state.log.some((entry) => entry.doneDate === isoDate);
  if (hasHistory) return true;
  return getSortedTimelineTasks().some((item) => item.task.nextDate === isoDate);
}

function isTaskMissed(task = {}) {
  return systemTaskStatus(task.nextDate || todayIso(), todayIso()) === "missed";
}

function renderEmptyDateState(isoDate) {
  return `
    <div class="empty empty-date-state">
      <strong>На ${escapeHtml(formatDate(isoDate))} работы не назначены</strong>
    </div>
  `;
}

function joinUniqueLabels(values = []) {
  return [...new Set(values.filter(Boolean))].join(", ");
}

function timelineGroupKey(item) {
  const batchId = String(item.task.batchId || "").trim();
  if (batchId) return `batch:${batchId}`;
  return [
    item.systemStatus,
    item.task.nextDate,
    item.task.notes || "",
    item.task.repeatMode || "",
    item.task.interval || "",
    item.task.repeatDate || "",
    [...new Set((item.task.preparationIds || []).filter(Boolean))].sort().join("|"),
  ].join("::");
}

function historyGroupKey(entry) {
  const batchId = String(entry.batchId || "").trim();
  if (batchId) return `batch:${batchId}`;
  return [
    entry.doneDate,
    entry.note || "",
    [...new Set((entry.preparationIds || [entry.preparationId]).filter(Boolean))].sort().join("|"),
  ].join("::");
}

function groupTimelineItems(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const key = timelineGroupKey(item);
    if (!map.has(key)) {
      map.set(key, {
        key,
        representative: item,
        items: [],
        plantNames: [],
        workTypes: [],
      });
    }
    const group = map.get(key);
    group.items.push(item);
    group.plantNames.push(item.plant.name);
    group.workTypes.push(item.task.type);
  });
  return [...map.values()];
}

function groupHistoryEntries(entries = []) {
  const map = new Map();
  entries.forEach((entry) => {
    const key = historyGroupKey(entry);
    if (!map.has(key)) {
      map.set(key, {
        key,
        representative: entry,
        items: [],
        plantNames: [],
        workTypes: [],
      });
    }
    const group = map.get(key);
    group.items.push(entry);
    group.plantNames.push(entry.plantName);
    group.workTypes.push(entry.taskType);
  });
  return [...map.values()];
}

function getFeedGroups(tasks, options = {}) {
  const history = [...state.log]
    .sort((a, b) => a.doneDate.localeCompare(b.doneDate) || a.id.localeCompare(b.id));
  const plannedTasks = tasks
    .sort((a, b) => a.task.nextDate.localeCompare(b.task.nextDate) || a.plant.name.localeCompare(b.plant.name, "uk"));
  const missed = plannedTasks.filter((item) => item.diff < 0);
  const planned = plannedTasks.filter((item) => item.diff >= 0);

  return {
    history: groupHistoryEntries(history),
    missed: groupTimelineItems(missed),
    planned: groupTimelineItems(planned),
  };
}

function renderUnifiedFeed({ history, missed, planned }) {
  if (!history.length && !missed.length && !planned.length) {
    return emptyState("Работ в ленте пока нет");
  }

  return `
    ${history.length ? `<div class="feed-section" data-feed-section="history">${history.map((group, index) => historyFeedCard(group, { isLatest: index === history.length - 1 })).join("")}</div>` : ""}
    ${missed.length ? `<div class="feed-section" data-feed-section="missed">${missed.map(timelineCard).join("")}</div>` : ""}
    ${planned.length ? `<div class="feed-section" data-feed-section="planned">${planned.map(timelineCard).join("")}</div>` : ""}
  `;
}

function renderTimelineCounters({ history, missed, planned }) {
  if (!els.timelineCounters) {
    return;
  }
  els.timelineCounters.innerHTML = "";
}

function setTimelineDate(isoDate, options = {}) {
  selectedTimelineDate = isoDate || "";
  activeFeedFilter = "";
  els.timelineLabel.textContent = "";
  const tasks = getSortedTimelineTasks();
  renderWeekStrip(tasks);
  if (!selectedTimelineDate) {
    renderToday();
    return;
  }
  if (!hasEventsOnDate(selectedTimelineDate)) {
    els.upcomingList.style.paddingBottom = "0px";
    els.upcomingList.innerHTML = renderEmptyDateState(selectedTimelineDate);
    return;
  }
  renderToday();
  requestAnimationFrame(() => {
    scrollFeedToDate(selectedTimelineDate, { smooth: options.scroll !== false, exactOnly: true });
  });
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
      eyebrow: "Культуры и группы",
      title: "Культуры и группы",
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
        ${item.task.notes ? `<p class="timeline-note-lead">${escapeHtml(item.task.notes)}</p>` : ""}
        <p class="timeline-meta">${escapeHtml(dateText)}</p>
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

function timelineCard(group) {
  const item = group.representative;
  const statusClass = item.status === "overdue" ? "overdue-card" : item.status === "today" ? "today-card" : "";
  const preparations = getPreparations(item.task);
  const titleDate = timelineDateTitle(item);
  const workLine = timelineWorkLineHtml(group.workTypes);
  const plantLine = timelinePlantLineHtml(group.plantNames, item.plant);

  return `
    <article class="reminder-card timeline-card ${statusClass}" data-feed-date="${escapeHtml(item.task.nextDate)}">
      <div class="reminder-info">
        <div class="timeline-card-grid">
          <div class="timeline-card-main">
            <h3><span class="timeline-title-date">${escapeHtml(titleDate)}</span></h3>
            <p class="timeline-work-line" data-fit-title>${workLine}</p>
            <p class="timeline-plant-line">${plantLine}</p>
          </div>
          <div class="timeline-card-side ${!preparations.length && item.task.notes ? "timeline-card-side-note-only" : ""}">
            ${preparations.length ? `<div class="timeline-preparations">${preparationsInline(preparations)}</div>` : ""}
            ${item.task.notes ? `<p class="timeline-note-lead">${escapeHtml(item.task.notes)}</p>` : ""}
          </div>
        </div>
      </div>
      <div class="card-actions timeline-card-actions">
        ${completionButton(item)}
      </div>
    </article>
  `;
}

function historyFeedCard(group, options = {}) {
  const entry = group.representative;
  const preparations = getPreparations(entry);
  const titleDate = formatDate(entry.doneDate);
  const linkedPlant = state.plants.find((plant) => plant.id === entry.plantId) || { name: entry.plantName, type: "other", icon: "" };
  const workLine = timelineWorkLineHtml(group.workTypes);
  const plantLine = timelinePlantLineHtml(group.plantNames, linkedPlant);
  return `
    <article class="reminder-card timeline-card history-card" data-feed-date="${escapeHtml(entry.doneDate)}" ${options.isLatest ? 'data-feed-anchor="latest-done"' : ""}>
      <div class="reminder-info">
        <div class="timeline-card-grid">
          <div class="timeline-card-main">
            <h3><span class="timeline-title-date">${escapeHtml(titleDate)}</span></h3>
            <p class="timeline-work-line" data-fit-title>${workLine}</p>
            <p class="timeline-plant-line">${plantLine}</p>
          </div>
          <div class="timeline-card-side ${!preparations.length && entry.note ? "timeline-card-side-note-only" : ""}">
            ${preparations.length ? `<div class="timeline-preparations">${preparationsInline(preparations)}</div>` : ""}
            ${entry.note ? `<p class="timeline-note-lead">${escapeHtml(entry.note)}</p>` : ""}
          </div>
        </div>
      </div>
      <div class="card-actions timeline-card-actions history-status">
        <button class="action-pill action-done action-status" type="button" data-action="edit-log" data-log-id="${entry.id}" title="Редактировать запись">
          <i class="ti ti-check"></i> Выполнено
        </button>
      </div>
    </article>
  `;
}

function completionButton(item) {
  if (item.diff < 0) {
    return `<button class="action-pill action-missed action-status" type="button" data-action="edit-task" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}" title="Редактировать задание"><i class="ti ti-history"></i> Пропущено</button>`;
  }
  return `<button class="action-pill action-planned action-status" type="button" data-action="edit-task" data-plant-id="${item.plant.id}" data-task-id="${item.task.id}" title="Редактировать задание"><i class="ti ti-calendar"></i> Запланировано</button>`;
}

function timelineWorkLineHtml(workTypes) {
  const workLabelText = joinUniqueLabels(workTypes.map((type) => workLabel(type)));
  const firstWorkType = workTypes[0] || "water";
  return `<span class="timeline-title-flow"><span class="task-icon task-${escapeHtml(firstWorkType)} timeline-inline-icon">${iconImage(workIcon(firstWorkType), "task-color-icon timeline-inline-icon-image")}</span><span class="timeline-title-main">${escapeHtml(workLabelText)}</span></span>`;
}

function timelinePlantLineHtml(plantNames, plant) {
  const plantLabelText = joinUniqueLabels(plantNames);
  return `<span class="timeline-title-flow timeline-title-flow-plant"><span class="task-icon task-culture timeline-inline-icon timeline-inline-icon-plant">${iconImage(plantIcon(plant || { name: plantLabelText }), "task-color-icon timeline-inline-icon-image")}</span><span class="timeline-title-sub">${escapeHtml(plantLabelText)}</span></span>`;
}

function fitTimelineTitles() {
  document.querySelectorAll(".timeline-card .timeline-work-line[data-fit-title]").forEach((line) => {
    line.style.fontSize = "";
    const flow = line.querySelector(".timeline-title-flow");
    if (!flow) return;

    let size = 17;
    flow.style.fontSize = `${size}px`;
    while (line.scrollWidth > line.clientWidth && size > 13) {
      size -= 0.5;
      flow.style.fontSize = `${size}px`;
    }
  });
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

function resolveFeedDateTarget(feed, isoDate, options = {}) {
  const datedEntries = [...feed.querySelectorAll("[data-feed-date]")];
  if (!datedEntries.length) return null;
  const exactMatch = datedEntries.find((entry) => entry.dataset.feedDate === isoDate);
  const forwardMatch = options.exactOnly ? null : datedEntries.find((entry) => (entry.dataset.feedDate || "") >= isoDate);
  const fallbackMatch = options.exactOnly ? null : [...datedEntries].reverse().find((entry) => (entry.dataset.feedDate || "") <= isoDate);
  return exactMatch || forwardMatch || fallbackMatch || null;
}

function ensureFeedScrollRoom(feed, target, offset = 8) {
  if (!feed || !target) return;
  feed.style.paddingBottom = "0px";
  const maxScrollTop = Math.max(0, feed.scrollHeight - feed.clientHeight);
  const desiredTop = feedTargetTop(feed, target, offset);
  const extraSpace = Math.max(0, desiredTop - maxScrollTop + 12);
  feed.style.paddingBottom = extraSpace ? `${extraSpace}px` : "0px";
}

function feedTargetTop(feed, target, offset = 8) {
  return Math.max(0, target.offsetTop - feed.offsetTop - offset);
}

function scrollFeedToDate(isoDate, options = {}) {
  const feed = els.upcomingList;
  const target = resolveFeedDateTarget(feed, isoDate, options);
  if (!target) return false;
  ensureFeedScrollRoom(feed, target, 8);
  feed.scrollTo({ top: feedTargetTop(feed, target, 8), behavior: options.smooth === false ? "auto" : "smooth" });
  return true;
}

function scrollFeedToSection(section, options = {}) {
  if (selectedTimelineDate) {
    selectedTimelineDate = "";
    calendarStartDate = todayIso();
    activeFeedFilter = section;
    renderToday();
    requestAnimationFrame(() => scrollFeedToSection(section, options));
    return;
  }
  activeFeedFilter = section;
  renderTimelineCounters(getFeedGroups(getAllTasks(state.plants).sort((a, b) => a.diff - b.diff || a.plant.name.localeCompare(b.plant.name, "uk")), { applyDate: false }));
  const feed = els.upcomingList;
  const target = feed.querySelector(`[data-feed-section="${CSS.escape(section)}"]`);
  if (!target) return;
  ensureFeedScrollRoom(feed, target, 8);
  feed.scrollTo({ top: feedTargetTop(feed, target, 8), behavior: options.smooth === false ? "auto" : "smooth" });
}

function scrollFeedToLatestDone(options = {}) {
  const feed = els.upcomingList;
  const target = feed.querySelector('[data-feed-anchor="latest-done"]');
  if (!target) {
    feed.style.paddingBottom = "0px";
    feed.scrollTo({ top: 0, behavior: options.smooth === false ? "auto" : "smooth" });
    return;
  }

  ensureFeedScrollRoom(feed, target, 8);
  feed.scrollTo({ top: feedTargetTop(feed, target, 8), behavior: options.smooth === false ? "auto" : "smooth" });
}

function positionFeedAfterRender(options = {}) {
  if (selectedTimelineDate) {
    scrollFeedToDate(selectedTimelineDate, options);
    return;
  }

  scrollFeedToLatestDone(options);
}

function renderWeekStrip(tasks) {
  const today = todayIso();
  const days = Array.from({ length: 7 }, (_, index) => {
    const iso = addCalendarDays(calendarStartDate, index);
    const plannedCount = tasks.filter((item) => item.task.nextDate === iso && item.systemStatus === "planned").length;
    const missedCount = tasks.filter((item) => item.task.nextDate === iso && item.systemStatus === "missed").length;
    const historyCount = state.log.filter((entry) => entry.doneDate === iso).length;
    return { iso, plannedCount, missedCount, historyCount, count: plannedCount + missedCount + historyCount };
  });

  els.weekStrip.innerHTML = days.map((day) => `
    <button class="day-pill ${day.iso === today ? "today" : ""} ${selectedTimelineDate === day.iso ? "active" : ""} ${weekDayTone(day)}" type="button" data-week-date="${day.iso}">
      <span>${formatDate(day.iso)}</span>
      <div class="day-pill-meta">
        <em>${escapeHtml(formatWeekday(day.iso))}</em>
        <div class="day-pill-statuses">
          ${day.historyCount ? `<small class="day-pill-count day-pill-count-done">${day.historyCount}</small>` : ""}
          ${day.plannedCount ? `<small class="day-pill-count day-pill-count-planned">${day.plannedCount}</small>` : ""}
          ${day.missedCount ? `<small class="day-pill-count day-pill-count-missed">${day.missedCount}</small>` : ""}
        </div>
      </div>
    </button>
  `).join("");
}

function weekDayTone(day) {
  if (day.missedCount) return "has-missed";
  if (day.plannedCount) return "has-planned";
  if (day.historyCount) return "has-done";
  return "";
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
  const visibleCultureIds = new Set(settingsCultures().map((plant) => plant.id));
  const cultures = plants.filter((plant) => visibleCultureIds.has(plant.id));
  const groups = plants.filter((plant) => plantEntryKind(plant) === "group");

  els.plantGrid.innerHTML = `
    <section class="objects-split-grid">
      <article class="objects-column-card">
        <div class="objects-column-head">
          <button class="primary-btn objects-add-btn" type="button" data-action="add-group"><i class="ti ti-plus"></i> Добавить группу</button>
        </div>
        <div class="objects-card-grid">
          ${groups.length ? groups.map(plantDirectoryCard).join("") : emptyState("Группы пока не добавлены")}
        </div>
      </article>
      <article class="objects-column-card">
        <div class="objects-column-head">
          <button class="primary-btn objects-add-btn" type="button" data-action="add-culture"><i class="ti ti-plus"></i> Добавить культуру</button>
        </div>
        <div class="objects-card-grid">
          ${cultures.length ? cultures.map(plantDirectoryCard).join("") : emptyState("Культуры пока не добавлены")}
        </div>
      </article>
    </section>
  `;
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
  return `
    <article class="plant-card work-type-card">
      <div class="plant-header">
        <div class="card-title-with-icon">
          ${iconImage(workType.icon, "card-color-icon")}
          <div>
            <h3>${escapeHtml(workType.label)}</h3>
          </div>
        </div>
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
  const selectedIds = Array.isArray(selectedType) ? selectedType.filter(Boolean) : [selectedType].filter(Boolean);
  const currentIds = selectedIds.length ? selectedIds : [select.value].filter(Boolean);
  select.innerHTML = workTypeOptions(currentIds[0] || "");
  [...select.options].forEach((option) => {
    option.selected = currentIds.includes(option.value);
  });
  renderWorkComboOptions("type");
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
  if (String(plant?.icon || "").trim() === "none") return "none";
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
  if (value === "none") return "none";
  const normalized = legacyMap[value] || value;
  return ICON_CHOICES.some((choice) => choice.id === normalized) ? normalized : "seedling";
}

function iconImage(icon, className = "color-icon") {
  const iconName = normalizeIconName(icon);
  if (iconName === "none") return "";
  return `<img class="${escapeHtml(className)}" src="./src/assets/icons/${escapeHtml(iconName)}.svg" alt="" loading="lazy">`;
}

function renderIconPicker(container, input, selectedIcon, { allowEmpty = false } = {}) {
  const icon = normalizeIconName(selectedIcon);
  input.value = icon;
  const emptyChoice = allowEmpty ? `
    <button class="icon-choice icon-choice-clear ${icon === "none" ? "is-selected" : ""}" type="button" data-icon="none" title="Без иконки" aria-pressed="${icon === "none"}">
      <i class="ti ti-x"></i>
    </button>
  ` : "";
  container.innerHTML = emptyChoice + ICON_CHOICES.map((choice) => `
    <button class="icon-choice ${choice.id === icon ? "is-selected" : ""}" type="button" data-icon="${escapeHtml(choice.id)}" title="${escapeHtml(choice.label)}" aria-pressed="${choice.id === icon}">
      ${iconImage(choice.id, "icon-choice-image")}
    </button>
  `).join("");
}

function selectIconFromPicker(event, input, container, options = {}) {
  const button = event.target.closest("[data-icon]");
  if (!button) return;

  renderIconPicker(container, input, button.dataset.icon, options);
}

function preparationCard(preparation) {
  const purpose = preparationPurpose(preparation);
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
        ${preparation.waitingPeriod ? `<p class="preparation-waiting"><strong>Срок ожидания:</strong> ${escapeHtml(preparation.waitingPeriod)}</p>` : ""}
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

function plantDirectoryCard(plant) {
  const isGroup = plantEntryKind(plant) === "group";
  const memberCount = isGroup ? getGroupMembers(plant).length : 0;
  return `
    <article class="plant-card object-plant-card">
      <div class="plant-header">
        <div class="card-title-with-icon">
          ${iconImage(plantIcon(plant), "card-color-icon")}
          <div>
            <h3 class="directory-title-row">
              <span>${escapeHtml(plant.name)}</span>
              ${isGroup ? `<small class="directory-count-pill">${memberCount}</small>` : ""}
            </h3>
          </div>
        </div>
        ${isGroup ? "" : `<span class="plant-badge badge-${plantBadgeTone(resolvedPlantTypeChoice(plant).id)}">${escapeHtml(plantTypeLabel(plant))}</span>`}
      </div>
      <div class="object-card-subrow">
        <div class="plant-actions object-directory-actions">
          <button class="action-pill action-edit action-inline-mini" type="button" data-action="edit-plant" data-plant-id="${plant.id}"><i class="ti ti-pencil"></i> Настроить</button>
          <button class="action-pill action-delete action-inline-mini" type="button" data-action="delete-plant" data-plant-id="${plant.id}"><i class="ti ti-circle-minus"></i> Удалить</button>
        </div>
      </div>
    </article>
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

  if (button.dataset.action === "add-work-empty") {
    openWorkDialog({ date: button.dataset.date || selectedTimelineDate || todayIso() });
    return;
  }

  if (button.dataset.action === "open-preparation") {
    const preparation = state.preparations.find((item) => item.id === button.dataset.preparationId);
    if (preparation) {
      openPreparationDialog(preparation);
    }
    return;
  }

  if (button.dataset.action === "edit-log") {
    openWorkDialog({ logId: button.dataset.logId });
    return;
  }

  const plant = state.plants.find((item) => item.id === button.dataset.plantId);
  const task = plant?.tasks.find((item) => item.id === button.dataset.taskId);
  if (!plant || !task) return;

  if (button.dataset.action === "edit-task") {
    openWorkDialog({ plantId: plant.id, taskId: task.id });
    return;
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
  if (button.dataset.action === "add-culture") {
    openPlantDialog(null, "culture");
    return;
  }
  if (button.dataset.action === "add-group") {
    openPlantDialog(null, "group");
    return;
  }
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
  const entityLabel = plantEntryKind(plant) === "group" ? "группу" : "культуру";
  const confirmed = confirm(`Удалить ${entityLabel} "${plant.name}"? Будущие работы и записи журнала по ней тоже будут удалены.`);
  if (!confirmed) return;

  if (plantEntryKind(plant) === "group") {
    settingsCultures().forEach((item) => {
      if (resolvedPlantGroupIds(item).includes(plant.id)) {
        applyCultureGroups(item, resolvedPlantGroupIds(item).filter((groupId) => groupId !== plant.id));
      }
    });
  }

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
  els.preparationImageFile.value = "";
  els.preparationDosage.value = preparation?.dosage || "";
  els.preparationWaitingPeriod.value = preparation?.waitingPeriod || "";
  els.preparationDescription.value = preparation?.description || "";
  renderPreparationUploadField(preparation?.image || "");
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
    waitingPeriod: els.preparationWaitingPeriod.value,
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

function onPreparationImageFileChange(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = String(reader.result || "");
    els.preparationImage.value = image;
    renderPreparationUploadField(image, file.name);
  };
  reader.readAsDataURL(file);
}

function renderPreparationUploadField(image = "", fileName = "") {
  const hasImage = Boolean(String(image || "").trim());
  els.preparationImageUpload.innerHTML = hasImage
    ? `
      <div class="image-upload-preview">
        <img src="${escapeHtml(image)}" alt="">
        <div>
          <strong>${escapeHtml(fileName || "Картинка препарата")}</strong>
          <span>Нажмите, чтобы заменить изображение</span>
        </div>
      </div>
    `
    : `
      <div class="image-upload-empty">
        <i class="ti ti-photo-plus"></i>
        <strong>Загрузить картинку</strong>
        <span>PNG, JPG, WEBP</span>
      </div>
    `;
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
  renderIconPicker(els.workTypeIconPicker, els.workTypeIcon, workType?.icon || "seedling", { allowEmpty: true });
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
    interval: Number(existing?.interval || 14),
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

function openPlantDialog(plant = null, entryKind = "culture") {
  els.plantForm.reset();
  document.querySelector("#plant-id").value = plant?.id || "";
  const dialogKind = plantEntryKind(plant || { entryKind });
  els.plantEntryKind.value = dialogKind;
  els.plantName.value = plant?.name || "";
  els.plantName.placeholder = dialogKind === "group"
    ? "Введите название группы растений"
    : "Введите название культуры";
  const selectedGroupIds = dialogKind === "culture" ? resolvedPlantGroupIds(plant || {}) : [];
  const selectedMemberIds = dialogKind === "group" ? getGroupMembers(plant || {}).map((item) => item.id) : [];
  els.plantGroupsField.classList.toggle("is-hidden", dialogKind !== "culture");
  renderPlantGroupPicker(selectedGroupIds);
  renderGroupMemberPicker(selectedMemberIds);
  const iconSeed = plant?.icon?.trim() ? plant.icon : plantIcon(plant || { type: "flower" });
  renderIconPicker(els.plantIconPicker, els.plantIcon, iconSeed, { allowEmpty: true });
  renderGroupMembersEditor(plant || { entryKind, name: plant?.name || "" });
  els.plantDialogTitle.textContent = plant
    ? `Настроить ${plantEntryKind(plant) === "group" ? "группу" : "культуру"}`
    : `${entryKind === "group" ? "Новая группа" : "Новая культура"}`;
  els.plantDialog.showModal();
}

function savePlantFromForm(event) {
  event.preventDefault();
  const id = document.querySelector("#plant-id").value || makeId("plant");
  const existing = state.plants.find((item) => item.id === id);
  const entryKindValue = els.plantEntryKind.value || existing?.entryKind || plantEntryKind(existing || {});
  const selectedGroupIds = selectedValues(els.plantGroupIds);
  const selectedMemberIds = selectedValues(els.groupMemberIds);
  const primaryGroup = selectedGroupIds.length ? state.plants.find((item) => item.id === selectedGroupIds[0]) : null;
  const typeChoice = entryKindValue === "group"
    ? (existing ? { id: existing.type || normalizePlantTypeChoice(existing.name || els.plantName.value).id, label: els.plantName.value.trim() || existing.name || "Другое" } : normalizePlantTypeChoice(els.plantName.value))
    : (primaryGroup ? { id: primaryGroup.type || normalizePlantTypeChoice(primaryGroup.name).id, label: primaryGroup.name } : normalizePlantTypeChoice("Другое"));
  const plant = normalizePlant({
    id,
    name: els.plantName.value,
    entryKind: entryKindValue,
    type: typeChoice.id,
    typeLabel: typeChoice.label,
    groupIds: entryKindValue === "culture" ? selectedGroupIds : [],
    icon: els.plantIcon.value,
    planted: existing?.planted || todayIso(),
    location: existing?.location || "",
    notes: existing?.notes || "",
    tasks: existing?.tasks || [],
  });

  if (!plant.name) return;

  const existingIndex = state.plants.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.plants[existingIndex] = plant;
  } else {
    state.plants.push(plant);
  }

  if (entryKindValue === "culture") {
    applyCultureGroups(plant, selectedGroupIds);
  }

  if (entryKindValue === "group") {
    settingsCultures().forEach((item) => {
      const nextGroupIds = new Set(resolvedPlantGroupIds(item));
      if (selectedMemberIds.includes(item.id)) {
        nextGroupIds.add(plant.id);
      } else {
        nextGroupIds.delete(plant.id);
      }
      applyCultureGroups(item, [...nextGroupIds]);
    });
  }

  els.plantDialog.close();
  persistAndRender();
}

function plantTypeLabel(plant = {}) {
  const linkedGroup = firstPlantGroup(plant);
  if (linkedGroup) {
    return linkedGroup.name || linkedGroup.typeLabel || linkedGroup.type || "Другое";
  }
  return plant.typeLabel || PLANT_TYPE_LABELS[plant.type] || plant.type || "Другое";
}

function plantEntryKind(plant = {}) {
  if (plant.entryKind === "group" || plant.entryKind === "culture") return plant.entryKind;
  return "culture";
}

function settingsCultures() {
  return state.plants
    .filter((plant) => plantEntryKind(plant) === "culture")
    .filter((plant) => !isSiteCategoryPlant(plant));
}

function settingsGroups() {
  return state.plants
    .filter((plant) => plantEntryKind(plant) === "group")
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

function resolvedPlantGroupIds(plant = {}) {
  const directIds = [...new Set((Array.isArray(plant.groupIds) ? plant.groupIds : []).filter(Boolean))];
  if (directIds.length) {
    return directIds.filter((id) => state.plants.some((item) => item.id === id && plantEntryKind(item) === "group"));
  }
  const fallbackGroup = settingsGroups().find((group) => group.type === plant.type || group.name === plant.typeLabel || group.typeLabel === plant.typeLabel);
  return fallbackGroup ? [fallbackGroup.id] : [];
}

function firstPlantGroup(plant = {}) {
  const firstGroupId = resolvedPlantGroupIds(plant)[0];
  return state.plants.find((item) => item.id === firstGroupId) || null;
}

function applyCultureGroups(plant, groupIds = []) {
  const cleanGroupIds = [...new Set(groupIds.filter((id) => state.plants.some((item) => item.id === id && plantEntryKind(item) === "group")))];
  const firstGroup = cleanGroupIds.length ? state.plants.find((item) => item.id === cleanGroupIds[0]) : null;
  plant.groupIds = cleanGroupIds;
  if (firstGroup) {
    plant.type = firstGroup.type || normalizePlantTypeChoice(firstGroup.name).id;
    plant.typeLabel = firstGroup.name || firstGroup.typeLabel || plantTypeLabel(firstGroup);
  } else {
    plant.type = "other";
    plant.typeLabel = "Другое";
  }
  return plant;
}

function ensureDefaultPlantGroups() {
  const defaults = BUILTIN_PLANT_TYPES.map((item) => ({
    id: `group_${item.id}`,
    name: item.label,
    type: item.id,
    typeLabel: item.label,
    icon: groupIconForType(item.id),
    entryKind: "group",
  }));
  defaults.forEach((group) => {
    const exists = state.plants.some((plant) => plantEntryKind(plant) === "group" && plant.type === group.type);
    if (!exists) {
      state.plants.push(normalizePlant({
        ...group,
        planted: todayIso(),
        location: "",
        notes: "",
        tasks: [],
      }));
    }
  });
}

function groupIconForType(typeId = "") {
  const iconMap = {
    flower: "blossom",
    veg: "tomato",
    berry: "seedling",
    fruit: "seedling",
    herb: "herb",
    "spice-herb": "herb",
    leafy: "seedling",
    root: "seedling",
    legume: "seedling",
    cucurbit: "cucumber",
    nightshade: "tomato",
    brassica: "seedling",
    allium: "seedling",
    shrub: "seedling",
    tree: "seedling",
    vine: "seedling",
    other: "seedling",
  };
  return iconMap[typeId] || "seedling";
}

function renderGroupMembersEditor(groupPlant = {}) {
  const isGroup = plantEntryKind(groupPlant) === "group";
  els.groupMembersField.classList.toggle("is-hidden", !isGroup);
  if (!isGroup) {
    els.groupMembersList.innerHTML = "";
    return;
  }
  if (!groupPlant.id) {
    renderPlantDialogComboSelection("members");
    if (!selectedValues(els.groupMemberIds).length) {
      els.groupMembersList.innerHTML = '<p class="muted">Выберите культуры, которые входят в эту группу</p>';
    }
    return;
  }
  renderPlantDialogComboSelection("members");
  if (!selectedValues(els.groupMemberIds).length) {
    els.groupMembersList.innerHTML = '<p class="muted">В эту группу культуры пока не назначены</p>';
  }
}

function getGroupMembers(groupPlant = {}) {
  return settingsCultures()
    .filter((plant) => resolvedPlantGroupIds(plant).includes(groupPlant.id))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

function plantBadgeTone(type = "") {
  return ["flower", "veg", "herb", "other"].includes(type) ? type : "other";
}

function isSiteCategoryPlant(plant = {}) {
  return plant.id?.startsWith("cat_site_") || /категор/i.test(plant.location || "");
}

function resolvedPlantTypeChoice(plant = {}) {
  if (isSiteCategoryPlant(plant)) {
    const name = String(plant.name || "").toLowerCase();
    if (name.includes("овоч")) return normalizePlantTypeChoice("Овощи");
    if (name.includes("підкорм") || name.includes("ззр")) return normalizePlantTypeChoice("Другое");
    if (name.includes("ягод") || name.includes("полуниц") || name.includes("суниц") || name.includes("смород") || name.includes("малин")) {
      return normalizePlantTypeChoice("Ягоды");
    }
    if (name.includes("фрукт") || name.includes("ябл") || name.includes("груш") || name.includes("слив") || name.includes("виноград")) {
      return normalizePlantTypeChoice("Фрукты");
    }
    return normalizePlantTypeChoice("Цветы");
  }
  const linkedGroup = firstPlantGroup(plant);
  if (linkedGroup) {
    return normalizePlantTypeChoice(linkedGroup.name || linkedGroup.typeLabel || linkedGroup.type || "Другое");
  }
  return normalizePlantTypeChoice(plant.typeLabel || PLANT_TYPE_LABELS[plant.type] || plant.type || "Другое");
}

function existingWorkPlantGroups() {
  return settingsGroups().map((group) => ({
    id: group.id,
    label: group.name,
  }));
}

function normalizePlantTypeChoice(rawValue = "") {
  const label = String(rawValue || "").trim();
  const builtIn = BUILTIN_PLANT_TYPES.find((item) => item.label.toLowerCase() === label.toLowerCase() || item.id === label);
  if (builtIn) {
    return builtIn;
  }
  const id = slugify(label) || "other";
  return { id, label: label || "Другое" };
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function existingPlantTypeChoices() {
  const map = new Map(BUILTIN_PLANT_TYPES.map((item) => [item.id, item]));
  state.plants.forEach((plant) => {
    const label = plantTypeLabel(plant).trim();
    if (!label) return;
    map.set(plant.type || slugify(label), { id: plant.type || slugify(label), label });
  });
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));
}

function renderPlantGroupPicker(selectedIds = []) {
  const groups = settingsGroups();
  els.plantGroupIds.innerHTML = groups
    .map((group) => `<option value="${escapeHtml(group.id)}" ${selectedIds.includes(group.id) ? "selected" : ""}>${escapeHtml(group.name)}</option>`)
    .join("");
  renderPlantDialogComboOptions("groups");
}

function renderGroupMemberPicker(selectedIds = []) {
  const cultures = settingsCultures();
  els.groupMemberIds.innerHTML = cultures
    .map((plant) => `<option value="${escapeHtml(plant.id)}" ${selectedIds.includes(plant.id) ? "selected" : ""}>${escapeHtml(plant.name)}</option>`)
    .join("");
  renderPlantDialogComboOptions("members");
}

function renderPlantDialogComboOptions(kind) {
  const config = {
    groups: {
      select: els.plantGroupIds,
      searchInput: els.plantGroupSearch,
      container: els.plantGroupOptions,
      trigger: els.plantGroupTrigger,
      selectionContainer: els.plantGroupSelection,
      placeholder: "Выбрать группы",
    },
    members: {
      select: els.groupMemberIds,
      searchInput: els.groupMemberSearch,
      container: els.groupMemberOptions,
      trigger: els.groupMemberTrigger,
      selectionContainer: els.groupMembersList,
      placeholder: "Добавить культуры",
    },
  }[kind];
  if (!config) return;
  const { select, searchInput, container, trigger, selectionContainer, placeholder } = config;
  const search = searchInput.value.trim().toLowerCase();
  const selected = selectedValues(select);
  const options = [...select.options].filter((option) => !search || option.text.toLowerCase().includes(search));
  const allVisibleSelected = Boolean(options.length && options.every((option) => selected.includes(option.value)));
  const toggleAllRow = options.length ? `
    <button class="multi-combo-option multi-combo-option-all ${allVisibleSelected ? "is-selected" : ""}" type="button" data-plant-combo-kind="${kind}" data-plant-combo-action="toggle-all">
      <span class="multi-combo-check">${allVisibleSelected ? '<i class="ti ti-check"></i>' : ""}</span>
      <span class="multi-combo-option-copy"><span>Выбрать все</span></span>
    </button>
  ` : "";

  container.innerHTML = options.length
    ? `${toggleAllRow}${options.map((option) => {
      const checked = selected.includes(option.value);
      return `
        <button class="multi-combo-option ${checked ? "is-selected" : ""}" type="button" data-plant-combo-kind="${kind}" data-value="${escapeHtml(option.value)}">
          <span class="multi-combo-check">${checked ? '<i class="ti ti-check"></i>' : ""}</span>
          <span class="multi-combo-option-copy"><span>${escapeHtml(option.textContent?.trim() || "")}</span></span>
        </button>
      `;
    }).join("")}`
    : '<div class="combo-search-hint"><i class="ti ti-search"></i><span>Ничего не найдено</span></div>';

  const selectedLabels = [...select.selectedOptions].map((option) => option.textContent?.trim()).filter(Boolean);
  trigger.textContent = selectedLabels.length
    ? selectedLabels.length === 1
      ? selectedLabels[0]
      : `Выбрано: ${selectedLabels.length}`
    : placeholder;
  trigger.classList.toggle("is-empty", selectedLabels.length === 0);
  renderPlantDialogComboSelection(kind);
}

function renderPlantDialogComboSelection(kind) {
  const config = {
    groups: {
      select: els.plantGroupIds,
      container: els.plantGroupSelection,
      emptyText: "",
    },
    members: {
      select: els.groupMemberIds,
      container: els.groupMembersList,
      emptyText: '<p class="muted">В эту группу культуры пока не назначены</p>',
    },
  }[kind];
  if (!config) return;
  const { select, container, emptyText } = config;
  const selectedOptions = [...select.selectedOptions].filter((option) => option.value);
  container.classList.toggle("is-empty", selectedOptions.length === 0);
  container.innerHTML = selectedOptions.length
    ? selectedOptions.map((option) => `
      <button class="combo-selection-chip" type="button" data-remove-plant-combo="${kind}" data-value="${escapeHtml(option.value)}" title="Убрать">
        <span>${escapeHtml(option.textContent?.trim() || "")}</span>
        <i class="ti ti-x"></i>
      </button>
    `).join("")
    : emptyText;
}

function togglePlantDialogCombo(kind) {
  const panel = {
    groups: els.plantGroupPanel,
    members: els.groupMemberPanel,
  }[kind];
  const search = {
    groups: els.plantGroupSearch,
    members: els.groupMemberSearch,
  }[kind];
  if (!panel || !search) return;
  const shouldOpen = panel.classList.contains("is-hidden");
  closePlantDialogComboPanels();
  if (shouldOpen) {
    panel.classList.remove("is-hidden");
    search.focus();
  }
}

function closePlantDialogComboPanels() {
  els.plantGroupPanel.classList.add("is-hidden");
  els.groupMemberPanel.classList.add("is-hidden");
}

function onPlantDialogComboClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const option = event.target.closest("[data-plant-combo-kind]");
  if (!option) return;
  const kind = option.dataset.plantComboKind;
  const select = {
    groups: els.plantGroupIds,
    members: els.groupMemberIds,
  }[kind];
  const optionsContainer = {
    groups: els.plantGroupOptions,
    members: els.groupMemberOptions,
  }[kind];
  if (!select) return;
  const previousScrollTop = optionsContainer?.scrollTop ?? 0;
  if (option.dataset.plantComboAction === "toggle-all") {
    const searchInput = {
      groups: els.plantGroupSearch,
      members: els.groupMemberSearch,
    }[kind];
    const search = searchInput?.value.trim().toLowerCase() || "";
    const filteredOptions = [...select.options].filter((item) => !search || item.text.toLowerCase().includes(search));
    const shouldSelectAll = filteredOptions.some((item) => !item.selected);
    filteredOptions.forEach((item) => {
      item.selected = shouldSelectAll;
    });
    applyPlantDialogComboChange(kind);
    requestAnimationFrame(() => {
      if (optionsContainer) optionsContainer.scrollTop = previousScrollTop;
    });
    return;
  }
  const targetOption = [...select.options].find((item) => item.value === option.dataset.value);
  if (!targetOption) return;
  targetOption.selected = !targetOption.selected;
  applyPlantDialogComboChange(kind);
  requestAnimationFrame(() => {
    if (optionsContainer) optionsContainer.scrollTop = previousScrollTop;
  });
}

function onPlantDialogComboSelectionRemove(event) {
  const button = event.target.closest("[data-remove-plant-combo]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  const kind = button.dataset.removePlantCombo;
  const select = {
    groups: els.plantGroupIds,
    members: els.groupMemberIds,
  }[kind];
  if (!select) return;
  const targetOption = [...select.options].find((item) => item.value === button.dataset.value);
  if (!targetOption) return;
  targetOption.selected = false;
  applyPlantDialogComboChange(kind);
}

function applyPlantDialogComboChange(kind) {
  renderPlantDialogComboOptions(kind);
}

function onDocumentClick(event) {
  if (!event.target.closest('[data-plant-combo]')) {
    closePlantDialogComboPanels();
  }
  if (!event.target.closest(".multi-combo")) {
    closeWorkComboPanels();
  }
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
  const availableCultures = settingsCultures();
  if (!availableCultures.length) {
    alert("Сначала добавьте объект, затем планируйте работы.");
    openPlantDialog();
    return;
  }

  const existingLog = options.forceNew ? null : state.log.find((entry) => entry.id === options.logId);
  const selectedPlant = availableCultures.find((plant) => plant.id === (existingLog?.plantId || options.plantId || options.plantIds?.[0])) || availableCultures[0];
  const existingTask = options.forceNew ? null : selectedPlant?.tasks.find((task) => task.id === (options.taskId || existingLog?.taskId));
  const batchScope = resolveWorkBatchScope({ existingTask, existingLog });
  const type = existingTask?.type || existingLog?.taskType || options.type || "water";
  const isEditing = Boolean(existingTask || existingLog);
  const selectedGroups = Array.isArray(options.groupIds) && options.groupIds.length
    ? options.groupIds
    : batchScope.groupIds.length
      ? batchScope.groupIds
      : isEditing
        ? resolvedPlantGroupIds(selectedPlant)
      : [];
  const selectedPlantIds = Array.isArray(options.plantIds) && options.plantIds.length
    ? options.plantIds
    : batchScope.plantIds.length
      ? batchScope.plantIds
      : isEditing
        ? [selectedPlant?.id || options.plantId || ""].filter(Boolean)
      : [];
  const selectedTypeIds = Array.isArray(options.typeIds) && options.typeIds.length
    ? options.typeIds
    : batchScope.typeIds.length
      ? batchScope.typeIds
      : [type].filter(Boolean);

  els.workForm.reset();
  els.workTaskId.value = existingTask?.id || "";
  els.workLogId.value = existingLog?.id || "";
  configureWorkTargetSelectors(isEditing);
  renderWorkPlantGroupOptions(selectedGroups);
  renderWorkPlantOptions(selectedPlantIds, selectedGroups);
  renderWorkPreparationPicker(options.preparationIds || getPreparationIds(existingTask || existingLog || options));
  const derivedStatus = options.status || (existingLog ? "done" : (existingTask && isTaskMissed(existingTask) ? "missed" : "planned"));
  els.workStatus.value = derivedStatus;
  updateWorkStatusAppearance();
  els.workNextDate.value = existingTask?.nextDate || existingLog?.doneDate || options.date || selectedTimelineDate || todayIso();
  els.workRepeat.value = options.repeatMode || (existingTask ? workModeValue(existingTask, options) : logModeValue(existingLog));
  renderWorkTypeSelect(els.workType, selectedTypeIds);
  els.workRepeatDate.value = options.repeatDate || existingTask?.repeatDate || existingLog?.nextScheduled || addCalendarDays(existingTask?.nextDate || existingLog?.doneDate || todayIso(), existingTask?.interval || defaultIntervalForWork(type, selectedPlant?.type || "other"));
  els.workInterval.value = options.interval || existingTask?.interval || defaultIntervalForWork(type, selectedPlant?.type || "other");
  els.workNotes.value = options.notes || existingTask?.notes || existingLog?.note || "";
  els.workSubmitButton.textContent = isEditing && !options.forceNew ? "Сохранить" : "Добавить";
  els.workDeleteBtn.classList.toggle("is-hidden", !isEditing);
  els.workRepeatBtn.classList.toggle("is-hidden", !existingLog || Boolean(options.forceNew));
  updateWorkModeFields({ resetInterval: false });
  syncWorkDialogTitle();
  els.workDialog.showModal();
  resetWorkDialogScroll();
  if (options.animateIn) {
    els.workDialog.classList.add("is-switching-in");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resetWorkDialogScroll();
        els.workDialog.classList.remove("is-switching-in");
      });
    });
  }
}

function resolveWorkBatchScope({ existingTask = null, existingLog = null } = {}) {
  const batchId = existingTask?.batchId || existingLog?.batchId || "";
  if (!batchId) {
    return { batchId: "", plantIds: [], typeIds: [], groupIds: [] };
  }
  const taskItems = getAllTasks(state.plants).filter((item) => item.task.batchId === batchId);
  const logItems = state.log.filter((entry) => entry.batchId === batchId);
  const plantIds = [...new Set([
    ...taskItems.map((item) => item.plant.id),
    ...logItems.map((entry) => entry.plantId),
  ].filter(Boolean))];
  const typeIds = [...new Set([
    ...taskItems.map((item) => item.task.type),
    ...logItems.map((entry) => entry.taskType),
  ].filter(Boolean))];
  const groupIds = [...new Set(
    plantIds.flatMap((plantId) => {
      const plant = state.plants.find((item) => item.id === plantId);
      return plant ? resolvedPlantGroupIds(plant) : [];
    }),
  )];
  return { batchId, plantIds, typeIds, groupIds };
}

function resetWorkDialogScroll() {
  els.workDialog.scrollTop = 0;
  els.workForm.scrollTop = 0;
  requestAnimationFrame(() => {
    els.workDialog.scrollTop = 0;
    els.workForm.scrollTop = 0;
  });
}

function configureWorkTargetSelectors(isEditing = false) {
  els.workPlantGroup.multiple = true;
  els.workPlantId.multiple = true;
  els.workType.multiple = true;
  els.workPlantGroup.required = false;
  els.workPlantId.required = false;
  closeWorkComboPanels();
  els.workPlantGroupSearch.value = "";
  els.workPlantIdSearch.value = "";
  els.workTypeSearch.value = "";
  renderWorkComboSelection("group");
  renderWorkComboSelection("plant");
  renderWorkComboSelection("type");
}

function renderWorkPlantGroupOptions(selectedGroupId = "") {
  const groups = existingWorkPlantGroups();
  const selectedIds = Array.isArray(selectedGroupId) ? selectedGroupId.filter(Boolean) : [selectedGroupId].filter(Boolean);
  els.workPlantGroup.innerHTML = groups
    .map((group) => `<option value="${escapeHtml(group.id)}" ${selectedIds.includes(group.id) ? "selected" : ""}>${escapeHtml(group.label)}</option>`)
    .join("");
  if (!els.workPlantGroup.multiple && selectedIds[0] && groups.some((group) => group.id === selectedIds[0])) {
    els.workPlantGroup.value = selectedIds[0];
  } else if (!els.workPlantGroup.multiple && groups[0]) {
    els.workPlantGroup.value = groups[0].id;
  }
  renderWorkComboOptions("group");
}

function renderWorkPlantOptions(selectedPlantId = "", selectedGroupId = selectedValues(els.workPlantGroup)) {
  const selectedPlantIds = Array.isArray(selectedPlantId) ? selectedPlantId.filter(Boolean) : [selectedPlantId].filter(Boolean);
  const selectedGroupIds = Array.isArray(selectedGroupId) ? selectedGroupId.filter(Boolean) : [selectedGroupId].filter(Boolean);
  const filteredPlants = settingsCultures()
    .slice()
    .filter((plant) => !selectedGroupIds.length || resolvedPlantGroupIds(plant).some((groupId) => selectedGroupIds.includes(groupId)))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  els.workPlantId.innerHTML = filteredPlants
    .map((plant) => `<option value="${plant.id}" ${selectedPlantIds.includes(plant.id) ? "selected" : ""}>${escapeHtml(plant.name)}</option>`)
    .join("");

  if (!els.workPlantId.multiple && selectedPlantIds[0] && filteredPlants.some((plant) => plant.id === selectedPlantIds[0])) {
    els.workPlantId.value = selectedPlantIds[0];
  } else if (!els.workPlantId.multiple && filteredPlants[0]) {
    els.workPlantId.value = filteredPlants[0].id;
  }
  renderWorkComboOptions("plant");
}

function renderWorkPreparationPicker(selectedIds = []) {
  const ids = selectedIds.filter((id) => state.preparations.some((preparation) => preparation.id === id));
  const allPreparations = state.preparations
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  els.workPreparationId.innerHTML = allPreparations
    .map((preparation) => `<option value="${escapeHtml(preparation.id)}" ${ids.includes(preparation.id) ? "selected" : ""}>${escapeHtml(preparation.name)}</option>`)
    .join("");
  renderWorkPreparationSelection(ids);
  renderWorkComboOptions("preparation");
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
          ${preparation.waitingPeriod ? `<p class="preparation-preview-dosage">Срок ожидания: ${escapeHtml(preparation.waitingPeriod)}</p>` : ""}
        </div>
        <button class="icon-btn preparation-remove-btn" type="button" data-remove-work-preparation="${escapeHtml(preparation.id)}" title="Убрать препарат">
          <i class="ti ti-x"></i>
        </button>
      </article>
    `).join("")
    : '<p class="muted">Препараты не выбраны</p>';
}

function removeWorkPreparation(event) {
  const button = event.target.closest("[data-remove-work-preparation]");
  if (!button) return;

  renderWorkPreparationPicker(getWorkPreparationIds().filter((id) => id !== button.dataset.removeWorkPreparation));
}

function getWorkPreparationIds() {
  return selectedValues(els.workPreparationId);
}

function updateWorkIntervalDefault({ resetInterval = true } = {}) {
  updateWorkModeFields({ resetInterval });
}

function updateWorkStatusAppearance() {
  const value = els.workStatus.value || "planned";
  els.workStatus.classList.remove("status-select-planned", "status-select-done", "status-select-missed");
  if (value === "done") {
    els.workStatus.classList.add("status-select-done");
    return;
  }
  if (value === "missed") {
    els.workStatus.classList.add("status-select-missed");
    return;
  }
  els.workStatus.classList.add("status-select-planned");
}

function updateWorkModeFields({ resetInterval = true } = {}) {
  const selectedPlantId = selectedValues(els.workPlantId)[0] || els.workPlantId.value;
  const plant = state.plants.find((item) => item.id === selectedPlantId);
  const type = selectedWorkTypeIds()[0] || els.workType.value || "water";
  if (resetInterval) {
    els.workInterval.value = defaultIntervalForWork(type, plant?.type || "other");
  }
  const mode = els.workRepeat.value;
  const modeConfig = WORK_REPEAT_MODE_CONFIG[mode] || WORK_REPEAT_MODE_CONFIG.once;
  const { usesInterval, usesCalendar, detailLabel, staticValue } = modeConfig;
  els.workRepeatStatic.classList.toggle("is-hidden", usesInterval || usesCalendar);
  els.workRepeatDate.classList.toggle("is-hidden", !usesCalendar);
  els.workInterval.classList.toggle("is-hidden", !usesInterval);
  els.workRepeatStatic.value = staticValue;
  els.workRepeatDate.required = usesCalendar;
  els.workRepeatDate.disabled = !usesCalendar;
  els.workInterval.required = usesInterval;
  els.workInterval.disabled = !usesInterval;
  els.workRepeatDetailLabel.textContent = detailLabel;
  syncWorkDialogTitle();
}

function syncWorkDialogTitle() {
  const type = selectedWorkTypeIds()[0] || els.workType.value || "water";
  const plant = currentWorkDialogPlant();
  const heading = (els.workTaskId.value || els.workLogId.value) ? "Редактировать" : "Новое задание";
  els.workDialogTitle.innerHTML = `
    <span class="dialog-title-with-icons">
      <span>${escapeHtml(heading)}</span>
      <span class="dialog-title-icon">${iconImage(workIcon(type), "dialog-title-icon-image")}</span>
      ${plant ? `<span class="dialog-title-icon">${iconImage(plantIcon(plant), "dialog-title-icon-image")}</span>` : ""}
    </span>
  `;
}

function currentWorkDialogPlant() {
  const selectedPlantId = selectedValues(els.workPlantId)[0] || els.workPlantId.value;
  if (selectedPlantId) {
    return state.plants.find((item) => item.id === selectedPlantId) || null;
  }

  const selectedGroupIds = selectedValues(els.workPlantGroup);
  if (!selectedGroupIds.length) {
    return null;
  }

  return settingsCultures()
    .filter((plant) => resolvedPlantGroupIds(plant).some((groupId) => selectedGroupIds.includes(groupId)))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))[0] || null;
}

function workModeValue(existingTask, options = {}) {
  if (existingTask?.repeatMode === "after") return "after";
  if (existingTask?.repeatMode === "calendar" || existingTask?.repeatMode === "again") return "calendar";
  if (existingTask?.repeatMode === "repeat" || existingTask?.repeat === true) return "repeat";
  if (existingTask) return "once";
  return options.repeat ? "repeat" : "once";
}

function logModeValue(existingLog) {
  if (!existingLog?.nextScheduled) return "once";
  return "calendar";
}

function saveWorkFromForm(event) {
  event.preventDefault();
  const selectedPlantIds = resolveSelectedWorkPlantIds();
  const selectedTypeIds = selectedWorkTypeIds();
  const targetPlants = selectedPlantIds
    .map((plantId) => state.plants.find((item) => item.id === plantId))
    .filter(Boolean);
  if (!targetPlants.length || !selectedTypeIds.length) return;
  const logId = els.workLogId.value;
  const repeatMode = els.workRepeat.value;
  const status = els.workStatus.value || "planned";
  let existingTask = null;
  let existingTaskPlant = null;
  const existingLog = logId ? state.log.find((entry) => entry.id === logId) : null;

  if (els.workTaskId.value) {
    state.plants.forEach((item) => {
      const foundTask = item.tasks.find((task) => task.id === els.workTaskId.value);
      if (foundTask) {
        existingTask = foundTask;
        existingTaskPlant = item;
      }
    });
  }

  const batchId = existingTask?.batchId || existingLog?.batchId || (targetPlants.length > 1 || selectedTypeIds.length > 1 ? makeId("batch") : "");
  const taskSeed = {
    preparationIds: getWorkPreparationIds(),
    nextDate: els.workNextDate.value,
    interval: Number(els.workInterval.value),
    repeat: repeatMode === "repeat",
    repeatMode,
    repeatDate: repeatMode === "calendar" ? els.workRepeatDate.value : "",
    notes: els.workNotes.value,
    batchId,
  };

  if (existingLog) {
    if (existingLog.batchId) {
      state.log = state.log.filter((entry) => entry.batchId !== existingLog.batchId);
      removeTaskBatch(existingLog.batchId);
    } else {
      state.log = state.log.filter((entry) => entry.id !== existingLog.id);
      if (existingLog.taskId) {
        removeTaskById(existingLog.taskId);
      }
    }
  }

  if (existingTaskPlant && existingTask) {
    if (existingTask.batchId) {
      removeTaskBatch(existingTask.batchId);
    } else {
      existingTaskPlant.tasks = existingTaskPlant.tasks.filter((task) => task.id !== existingTask.id);
    }
  }

  if (status === "planned" || status === "missed") {
    targetPlants.forEach((targetPlant, plantIndex) => {
      selectedTypeIds.forEach((typeId, typeIndex) => {
        const preservedTaskId = plantIndex === 0 && typeIndex === 0 ? (els.workTaskId.value || existingLog?.taskId || "") : "";
        targetPlant.tasks.push(normalizeTask({
          id: preservedTaskId || makeId("task"),
          type: typeId,
          ...taskSeed,
        }, targetPlant.type));
      });
    });
  } else {
    targetPlants.forEach((targetPlant, plantIndex) => {
      selectedTypeIds.forEach((typeId, typeIndex) => {
        const preservedTaskId = plantIndex === 0 && typeIndex === 0 ? (els.workTaskId.value || existingLog?.taskId || "") : "";
        const taskForCompletion = normalizeTask({
          id: preservedTaskId || makeId("task"),
          type: typeId,
          ...taskSeed,
        }, targetPlant.type);
        targetPlant.tasks.push(taskForCompletion);
        const logEntry = completeTask({
          plant: targetPlant,
          task: taskForCompletion,
          doneDate: els.workNextDate.value,
          note: els.workNotes.value,
          interval: Number(els.workInterval.value),
          repeat: repeatMode === "repeat",
          repeatMode,
          repeatDate: repeatMode === "calendar" ? els.workRepeatDate.value : "",
        });
        if (existingLog && plantIndex === 0 && typeIndex === 0) {
          logEntry.id = existingLog.id;
        }
        state.log.push(logEntry);
      });
    });
  }

  els.workDialog.close();
  persistAndRender();
  setDashboardView("timeline");
}

function resolveSelectedWorkPlantIds() {
  const selectedPlantIds = selectedValues(els.workPlantId);
  if (selectedPlantIds.length) {
    return selectedPlantIds;
  }

  const selectedGroupIds = selectedValues(els.workPlantGroup);
  return settingsCultures()
    .filter((plant) => !selectedGroupIds.length || resolvedPlantGroupIds(plant).some((groupId) => selectedGroupIds.includes(groupId)))
    .map((plant) => plant.id);
}

function selectedWorkTypeIds() {
  const selectedIds = selectedValues(els.workType);
  if (selectedIds.length) {
    return selectedIds;
  }
  return [els.workType.value].filter(Boolean);
}

function renderWorkComboOptions(kind) {
  const config = {
    group: {
      select: els.workPlantGroup,
      searchInput: els.workPlantGroupSearch,
      container: els.workPlantGroupOptions,
      trigger: els.workPlantGroupTrigger,
      selectionContainer: els.workPlantGroupSelection,
      placeholder: "Выбрать группу",
    },
    plant: {
      select: els.workPlantId,
      searchInput: els.workPlantIdSearch,
      container: els.workPlantIdOptions,
      trigger: els.workPlantIdTrigger,
      selectionContainer: els.workPlantIdSelection,
      placeholder: "Выбрать культуру",
    },
    type: {
      select: els.workType,
      searchInput: els.workTypeSearch,
      container: els.workTypeOptions,
      trigger: els.workTypeTrigger,
      selectionContainer: els.workTypeSelection,
      placeholder: "Выбрать работу",
    },
    preparation: {
      select: els.workPreparationId,
      searchInput: els.workPreparationSearch,
      container: els.workPreparationOptions,
      trigger: els.workPreparationTrigger,
      placeholder: "Выбрать препараты",
    },
  }[kind];
  if (!config) return;
  const { select, searchInput, container, trigger, selectionContainer, placeholder } = config;
  const search = searchInput.value.trim().toLowerCase();
  const selected = selectedValues(select);
  const options = [...select.options].filter((option) => !search || option.text.toLowerCase().includes(search));

  const allVisibleSelected = Boolean(select.multiple && options.length && options.every((option) => selected.includes(option.value)));
  const toggleAllRow = select.multiple && options.length ? `
      <button class="multi-combo-option multi-combo-option-all ${allVisibleSelected ? "is-selected" : ""}" type="button" data-work-combo-kind="${kind}" data-work-combo-action="toggle-all">
        <span class="multi-combo-check">${allVisibleSelected ? '<i class="ti ti-check"></i>' : ""}</span>
        <span class="multi-combo-option-copy">
          <span>Выбрать все</span>
        </span>
      </button>
    ` : "";

  container.innerHTML = options.length
    ? `${toggleAllRow}${options.map((option) => {
      const checked = selected.includes(option.value);
      const title = comboOptionTitle(kind, option.value, option.text);
      return `
        <button class="multi-combo-option ${checked ? "is-selected" : ""}" type="button" data-work-combo-kind="${kind}" data-value="${escapeHtml(option.value)}">
          <span class="multi-combo-check">${checked ? '<i class="ti ti-check"></i>' : ""}</span>
          <span class="multi-combo-option-copy">
            <span>${escapeHtml(title)}</span>
          </span>
        </button>
      `;
    }).join("")}`
    : '<div class="combo-search-hint"><i class="ti ti-search"></i><span>Ничего не найдено</span></div>';

  const selectedLabels = [...select.selectedOptions].map((option) => option.textContent?.trim()).filter(Boolean);
  trigger.textContent = selectedLabels.length
    ? select.multiple
      ? selectedLabels.length === 1
        ? selectedLabels[0]
        : `Выбрано: ${selectedLabels.length}`
      : selectedLabels[0]
    : placeholder;
  trigger.classList.toggle("is-empty", selectedLabels.length === 0);
  if (selectionContainer) {
    renderWorkComboSelection(kind);
  }
}

function renderWorkComboSelection(kind) {
  const config = {
    group: {
      select: els.workPlantGroup,
      container: els.workPlantGroupSelection,
    },
    plant: {
      select: els.workPlantId,
      container: els.workPlantIdSelection,
    },
    type: {
      select: els.workType,
      container: els.workTypeSelection,
    },
  }[kind];
  if (!config) return;
  const { select, container } = config;
  if (!container) return;
  const selectedOptions = [...select.selectedOptions].filter((option) => option.value);
  container.classList.toggle("is-empty", selectedOptions.length === 0);
  container.innerHTML = selectedOptions.length
    ? selectedOptions.map((option) => `
      <button class="combo-selection-chip" type="button" data-remove-work-combo="${kind}" data-value="${escapeHtml(option.value)}" title="Убрать">
        <span>${escapeHtml(option.textContent?.trim() || "")}</span>
        <i class="ti ti-x"></i>
      </button>
    `).join("")
    : "";
}

function comboOptionTitle(kind, value, fallbackText = "") {
  if (kind !== "preparation") return fallbackText;
  const preparation = state.preparations.find((item) => item.id === value);
  return formatPreparationOptionTitle(preparation, fallbackText);
}

function formatPreparationOptionTitle(preparation, fallbackText = "") {
  if (!preparation) return fallbackText;
  const baseName = preparationBaseTitle(preparation.name || fallbackText);
  const shortLabel = preparationShortLabel(preparation);
  return shortLabel ? `${baseName} (${shortLabel})` : baseName;
}

function preparationBaseTitle(name = "") {
  const value = String(name || "").trim();
  return value
    .replace(/\s*\(\s*від[^)]+\)\s*$/i, "")
    .replace(/\s*\(\s*от[^)]+\)\s*$/i, "")
    .replace(/\s+\bВід\s+[^()]+$/i, "")
    .trim();
}

function preparationShortLabel(preparation) {
  if (!preparation) return "";
  if (PREPARATION_SHORT_LABELS[preparation.id]) {
    return PREPARATION_SHORT_LABELS[preparation.id];
  }

  const purpose = String(preparationPurpose(preparation) || "").trim();
  if (!purpose) return "";

  return purpose
    .replace(/^проти\s+/i, "")
    .replace(/^для\s+/i, "")
    .replace(/^захищає рослини від\s+/i, "")
    .replace(/^захищає від\s+/i, "")
    .replace(/^допоможе у боротьбі з\s+/i, "")
    .replace(/^ефективний засіб для боротьби з\s+/i, "")
    .replace(/^інсектицид\s+/i, "")
    .replace(/^фунгіцид\s+/i, "")
    .replace(/\s+та інших.*$/i, "")
    .replace(/\s+та іншими.*$/i, "")
    .replace(/\s+за\s+культурами.*$/i, "")
    .replace(/\s+за\s+регламентом.*$/i, "")
    .replace(/[.]+$/g, "")
    .trim();
}

function toggleWorkCombo(kind) {
  const panel = {
    group: els.workPlantGroupPanel,
    plant: els.workPlantIdPanel,
    type: els.workTypePanel,
    preparation: els.workPreparationPanel,
  }[kind];
  const search = {
    group: els.workPlantGroupSearch,
    plant: els.workPlantIdSearch,
    type: els.workTypeSearch,
    preparation: els.workPreparationSearch,
  }[kind];
  if (!panel || !search) return;
  const shouldOpen = panel.classList.contains("is-hidden");
  closeWorkComboPanels();
  if (shouldOpen) {
    panel.classList.remove("is-hidden");
    search.focus();
  }
}

function closeWorkComboPanels() {
  els.workPlantGroupPanel.classList.add("is-hidden");
  els.workPlantIdPanel.classList.add("is-hidden");
  els.workTypePanel.classList.add("is-hidden");
  els.workPreparationPanel.classList.add("is-hidden");
}

function onWorkComboClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const option = event.target.closest("[data-work-combo-kind]");
  if (!option) return;
  const kind = option.dataset.workComboKind;
  const select = {
    group: els.workPlantGroup,
    plant: els.workPlantId,
    type: els.workType,
    preparation: els.workPreparationId,
  }[kind];
  if (!select) return;
  const optionsContainer = {
    group: els.workPlantGroupOptions,
    plant: els.workPlantIdOptions,
    type: els.workTypeOptions,
    preparation: els.workPreparationOptions,
  }[kind];
  const previousScrollTop = optionsContainer?.scrollTop ?? 0;

  if (option.dataset.workComboAction === "toggle-all" && select.multiple) {
    const searchInput = {
      group: els.workPlantGroupSearch,
      plant: els.workPlantIdSearch,
      type: els.workTypeSearch,
      preparation: els.workPreparationSearch,
    }[kind];
    const search = searchInput?.value.trim().toLowerCase() || "";
    const filteredOptions = [...select.options].filter((item) => !search || item.text.toLowerCase().includes(search));
    const shouldSelectAll = filteredOptions.some((item) => !item.selected);
    filteredOptions.forEach((item) => {
      item.selected = shouldSelectAll;
    });
    applyWorkComboChange(kind);
    if (optionsContainer) {
      requestAnimationFrame(() => {
        optionsContainer.scrollTop = previousScrollTop;
      });
    }
    return;
  }

  const value = option.dataset.value;
  const targetOption = [...select.options].find((item) => item.value === value);
  if (!targetOption) return;

  if (select.multiple) {
    targetOption.selected = !targetOption.selected;
  } else {
    select.value = value;
    closeWorkComboPanels();
  }

  applyWorkComboChange(kind);
  if (select.multiple && optionsContainer) {
    requestAnimationFrame(() => {
      optionsContainer.scrollTop = previousScrollTop;
    });
  }
}

function onWorkComboSelectionRemove(event) {
  const button = event.target.closest("[data-remove-work-combo]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  const kind = button.dataset.removeWorkCombo;
  const select = {
    group: els.workPlantGroup,
    plant: els.workPlantId,
    type: els.workType,
  }[kind];
  if (!select) return;
  const targetOption = [...select.options].find((item) => item.value === button.dataset.value);
  if (!targetOption) return;
  targetOption.selected = false;
  applyWorkComboChange(kind);
}

function applyWorkComboChange(kind) {
  if (kind === "group") {
    renderWorkPlantOptions(selectedValues(els.workPlantId), selectedValues(els.workPlantGroup));
    updateWorkIntervalDefault();
    renderWorkComboOptions("group");
    syncWorkDialogTitle();
    return;
  }
  if (kind === "plant") {
    renderWorkComboOptions("plant");
    updateWorkIntervalDefault({ resetInterval: false });
    syncWorkDialogTitle();
    return;
  }
  if (kind === "type") {
    renderWorkComboOptions("type");
    updateWorkIntervalDefault();
    syncWorkDialogTitle();
    return;
  }
  if (kind === "preparation") {
    renderWorkPreparationSelection(getWorkPreparationIds());
    renderWorkComboOptions("preparation");
  }
}

function deleteWorkFromDialog() {
  const logId = els.workLogId.value;
  const taskId = els.workTaskId.value;
  if (!logId && !taskId) return;
  if (!confirm("Удалить это событие?")) return;

  if (logId) {
    const logEntry = state.log.find((entry) => entry.id === logId);
    if (logEntry?.batchId) {
      state.log = state.log.filter((entry) => entry.batchId !== logEntry.batchId);
    } else {
      state.log = state.log.filter((entry) => entry.id !== logId);
    }
  }

  if (taskId) {
    const task = findTaskById(taskId);
    if (task?.batchId) {
      removeTaskBatch(task.batchId);
    } else {
      removeTaskById(taskId);
    }
  }

  els.workDialog.close();
  persistAndRender();
  setDashboardView("timeline");
}

function repeatWorkFromDialog() {
  const groupIds = selectedValues(els.workPlantGroup);
  const plantIds = selectedValues(els.workPlantId);
  const typeIds = selectedWorkTypeIds();
  const sourceDate = els.workNextDate.value || todayIso();
  const repeatLead = `Повтор работ от ${formatDate(sourceDate)}.`;
  const sourceNotes = els.workNotes.value.trim();
  const prefill = {
    forceNew: true,
    status: "planned",
    type: typeIds[0] || els.workType.value,
    typeIds,
    date: sourceDate,
    repeatMode: els.workRepeat.value,
    repeatDate: els.workRepeatDate.value,
    interval: Number(els.workInterval.value || 0),
    notes: sourceNotes ? `${repeatLead} ${sourceNotes}` : repeatLead,
    preparationIds: getWorkPreparationIds(),
    groupIds,
    plantIds,
    plantId: plantIds[0] || "",
  };
  els.workDialog.classList.add("is-switching-out");
  setTimeout(() => {
    els.workDialog.classList.remove("is-switching-out");
    els.workDialog.close();
    openWorkDialog({ ...prefill, animateIn: true });
  }, 150);
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

function removeTaskById(taskId) {
  if (!taskId) return;
  state.plants.forEach((plant) => {
    plant.tasks = plant.tasks.filter((task) => task.id !== taskId);
  });
}

function findTaskById(taskId) {
  if (!taskId) return null;
  for (const plant of state.plants) {
    const task = plant.tasks.find((item) => item.id === taskId);
    if (task) return task;
  }
  return null;
}

function removeTaskBatch(batchId) {
  if (!batchId) return;
  state.plants.forEach((plant) => {
    plant.tasks = plant.tasks.filter((task) => task.batchId !== batchId);
  });
}

function nextScheduledForMode(doneDate, repeatMode, interval, repeatDate) {
  if (repeatMode === "after" || repeatMode === "repeat") {
    return addCalendarDays(doneDate, interval);
  }
  if (repeatMode === "calendar") {
    return repeatDate || "";
  }
  return "";
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
  if (!preparations.length) return "";
  const columns = Math.min(preparations.length, 4);
  return `<div class="preparation-stack" style="--prep-cols:${columns}">${preparations.map(preparationInline).join("")}</div>`;
}

function preparationInline(preparation) {
  return `
    <div class="preparation-inline-link">
      ${preparationImage(preparation, "preparation-inline-image")}
      <span>${escapeHtml(preparation.name)}</span>
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
