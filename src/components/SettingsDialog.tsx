import { useState } from "react";
import { X, Plus, Trash2, Check, Upload, CalendarDays } from "lucide-react";
import { MultiPicker } from "./MultiPicker";
import { nanoid, today, cn } from "../lib/utils";
import type { AppState, Group, Culture, WorkType, Preparation } from "../lib/types";
import type { CalendarSettings, GoogleCalendarListItem } from "../lib/googleCalendar";

interface SettingsDialogProps {
  open: boolean;
  state: AppState;
  calendarSettings: CalendarSettings;
  onClose: () => void;
  onChange: (state: AppState) => void;
  onCalendarSettingsChange: (settings: CalendarSettings) => void;
  onGoogleConnect: () => void;
  onGoogleDisconnect: () => void;
  onGoogleSyncAll: () => void;
  onGoogleLoadCalendars: () => void;
  googleCalendars: GoogleCalendarListItem[];
  googleConnected: boolean;
  googleBusy: boolean;
}

type Tab = "groups" | "works" | "preps" | "calendar";

const TABS: { id: Tab; label: string }[] = [
  { id: "groups", label: "Группы" },
  { id: "works",  label: "Работы"            },
  { id: "preps",  label: "Препараты"         },
  { id: "calendar", label: "Google" },
];

const ICONS = ["🌸","🌹","🌿","🌱","🌻","🍅","🫑","🍓","🍎","🌳","🌲","🌾","🥦","🧅","🧄","💧","🐛","🪢","✂️","🪵","🌼","🌺","🍇","🍋","🫐","🥕","🌽","🥒","🧆"];

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-lg hover:bg-stone-50 transition-colors"
      >
        {value || "?"}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 p-2 bg-white border border-stone-200 rounded-xl shadow-lg grid grid-cols-6 gap-1 w-44">
          {ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => { onChange(ic); setOpen(false); }}
              className={cn("text-lg p-1 rounded-lg hover:bg-stone-100 transition-colors", value === ic && "bg-emerald-50")}
            >
              {ic}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface InlineEditProps { text: string; onSave: (v: string) => void; }
function InlineEdit({ text, onSave }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);
  if (!editing) {
    return (
      <span className="text-sm font-medium text-stone-800 cursor-pointer hover:underline" onClick={() => { setVal(text); setEditing(true); }}>
        {text}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
        className="text-sm border-b border-emerald-400 outline-none bg-transparent"
      />
      <button type="button" onClick={() => { onSave(val); setEditing(false); }} className="text-emerald-600">
        <Check size={13} />
      </button>
    </div>
  );
}

function prepAbbr(name: string): string {
  const letters = name
    .replace(/\([^)]*\)/g, "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("");
  return (letters || name.slice(0, 2) || "П").slice(0, 2).toUpperCase();
}

export function SettingsDialog({
  open,
  state,
  calendarSettings,
  onClose,
  onChange,
  onCalendarSettingsChange,
  onGoogleConnect,
  onGoogleDisconnect,
  onGoogleSyncAll,
  onGoogleLoadCalendars,
  googleCalendars,
  googleConnected,
  googleBusy,
}: SettingsDialogProps) {
  const [tab, setTab] = useState<Tab>("groups");

  if (!open) return null;

  function updateState(patch: Partial<AppState>) {
    onChange({ ...state, ...patch });
  }

  function updateCalendarSettings(patch: Partial<CalendarSettings>) {
    onCalendarSettingsChange({ ...calendarSettings, ...patch });
  }

  // ---- Groups ----
  function addGroup() {
    const id = "g_" + nanoid();
    updateState({ groups: [...state.groups, { id, name: "Новая группа", icon: "🌿", cultureIds: [] }] });
  }
  function updateGroup(id: string, patch: Partial<Group>) {
    updateState({ groups: state.groups.map((g) => g.id === id ? { ...g, ...patch } : g) });
  }
  function deleteGroup(id: string) {
    updateState({ groups: state.groups.filter((g) => g.id !== id), cultures: state.cultures.map((c) => ({ ...c, groupIds: c.groupIds.filter((gid) => gid !== id) })) });
  }

  // ---- Cultures ----
  function addCulture() {
    const id = "c_" + nanoid();
    updateState({ cultures: [...state.cultures, { id, name: "Новая культура", icon: "🌱", groupIds: [] }] });
  }
  function updateCulture(id: string, patch: Partial<Culture>) {
    updateState({ cultures: state.cultures.map((c) => c.id === id ? { ...c, ...patch } : c) });
  }
  function deleteCulture(id: string) {
    updateState({ cultures: state.cultures.filter((c) => c.id !== id), groups: state.groups.map((g) => ({ ...g, cultureIds: g.cultureIds.filter((cid) => cid !== id) })) });
  }

  // ---- WorkTypes ----
  function addWork() {
    const id = "w_" + nanoid();
    updateState({ workTypes: [...state.workTypes, { id, name: "Новая работа", icon: "🌿" }] });
  }
  function updateWork(id: string, patch: Partial<WorkType>) {
    updateState({ workTypes: state.workTypes.map((w) => w.id === id ? { ...w, ...patch } : w) });
  }
  function deleteWork(id: string) {
    updateState({ workTypes: state.workTypes.filter((w) => w.id !== id) });
  }

  // ---- Preparations ----
  function addPrep() {
    const id = "p_" + nanoid();
    updateState({ preparations: [...state.preparations, { id, name: "Новый препарат", purposeShort: "", dosage: "", waitingPeriod: "", image: "", shortName: "" }] });
  }
  function updatePrep(id: string, patch: Partial<Preparation>) {
    updateState({ preparations: state.preparations.map((p) => p.id === id ? { ...p, ...patch } : p) });
  }
  function deletePrep(id: string) {
    updateState({ preparations: state.preparations.filter((p) => p.id !== id) });
  }
  function uploadPrepImage(id: string, file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updatePrep(id, { image: String(reader.result || "") });
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100">
          <h2 className="text-base font-bold text-stone-800">Настройки</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200">
            <X size={14} className="text-stone-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-4 sm:px-6 pt-3 pb-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 inline-flex h-9 min-h-9 items-center justify-center whitespace-nowrap px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors",
                tab === t.id ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Groups & Cultures tab */}
          {tab === "groups" && (
            <div className="flex flex-col gap-6">
              {/* Groups */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-600 uppercase tracking-wide">Группы</h3>
                  <button onClick={addGroup} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg">
                    <Plus size={12} /> Добавить
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {state.groups.map((g) => (
                    <div key={g.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <IconPicker value={g.icon} onChange={(v) => updateGroup(g.id, { icon: v })} />
                      <div className="flex-1 flex flex-col gap-2">
                        <InlineEdit text={g.name} onSave={(v) => updateGroup(g.id, { name: v })} />
                        <MultiPicker
                          label="Культуры в группе"
                          options={state.cultures}
                          selected={g.cultureIds}
                          onChange={(ids) => {
                            updateGroup(g.id, { cultureIds: ids });
                            ids.forEach((cid) => {
                              const c = state.cultures.find((c) => c.id === cid);
                              if (c && !c.groupIds.includes(g.id)) {
                                updateCulture(cid, { groupIds: [...c.groupIds, g.id] });
                              }
                            });
                          }}
                          placeholder="Культуры..."
                        />
                      </div>
                      <button onClick={() => deleteGroup(g.id)} className="text-red-400 hover:text-red-600 mt-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultures */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-600 uppercase tracking-wide">Культуры</h3>
                  <button onClick={addCulture} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg">
                    <Plus size={12} /> Добавить
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {state.cultures.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <IconPicker value={c.icon} onChange={(v) => updateCulture(c.id, { icon: v })} />
                      <div className="flex-1 flex flex-col gap-2">
                        <InlineEdit text={c.name} onSave={(v) => updateCulture(c.id, { name: v })} />
                        <MultiPicker
                          label="Группы культуры"
                          options={state.groups}
                          selected={c.groupIds}
                          onChange={(ids) => updateCulture(c.id, { groupIds: ids })}
                          placeholder="Группы..."
                        />
                      </div>
                      <button onClick={() => deleteCulture(c.id)} className="text-red-400 hover:text-red-600 mt-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Works tab */}
          {tab === "works" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-600 uppercase tracking-wide">Виды работ</h3>
                <button onClick={addWork} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg">
                  <Plus size={12} /> Добавить
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {state.workTypes.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <IconPicker value={w.icon} onChange={(v) => updateWork(w.id, { icon: v })} />
                    <InlineEdit text={w.name} onSave={(v) => updateWork(w.id, { name: v })} />
                    <button onClick={() => deleteWork(w.id)} className="ml-auto text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preparations tab */}
          {tab === "preps" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-600 uppercase tracking-wide">Препараты</h3>
                <button onClick={addPrep} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg">
                  <Plus size={12} /> Добавить
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {state.preparations.map((p) => (
                  <div key={p.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex gap-3">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center overflow-hidden">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-sm font-bold text-stone-500">{prepAbbr(p.shortName || p.name)}</span>
                        )}
                      </div>
                      <input
                        id={`prep-image-${p.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          uploadPrepImage(p.id, event.currentTarget.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                      <label
                        htmlFor={`prep-image-${p.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[10px] font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                      >
                        <Upload size={11} /> Иконка
                      </label>
                      <button
                        type="button"
                        onClick={() => updatePrep(p.id, { image: "" })}
                        className="text-[10px] font-semibold text-stone-400 hover:text-red-500"
                      >
                        Без иконки
                      </button>
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <InlineEdit text={p.name} onSave={(v) => updatePrep(p.id, { name: v })} />
                        <button onClick={() => deletePrep(p.id)} className="text-red-400 hover:text-red-600 shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide">Короткое название</label>
                          <input
                            value={p.shortName || ""}
                            placeholder={p.name}
                            onChange={(e) => updatePrep(p.id, { shortName: e.target.value })}
                            className="w-full text-xs border-b border-stone-200 bg-transparent outline-none py-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide">Назначение</label>
                          <input value={p.purposeShort} onChange={(e) => updatePrep(p.id, { purposeShort: e.target.value })}
                            className="w-full text-xs border-b border-stone-200 bg-transparent outline-none py-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide">Дозировка</label>
                          <input value={p.dosage} onChange={(e) => updatePrep(p.id, { dosage: e.target.value })}
                            className="w-full text-xs border-b border-stone-200 bg-transparent outline-none py-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide">Срок ожидания</label>
                          <input value={p.waitingPeriod} onChange={(e) => updatePrep(p.id, { waitingPeriod: e.target.value })}
                            className="w-full text-xs border-b border-stone-200 bg-transparent outline-none py-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "calendar" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <CalendarDays size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-stone-800">Настройки Google календаря</h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      Задания будут создаваться как события на весь день. При изменении статуса обновляется цвет и описание события.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={calendarSettings.enabled}
                  onChange={(event) => updateCalendarSettings({ enabled: event.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
                Включить синхронизацию
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Google OAuth Client ID</label>
                  <input
                    value={calendarSettings.clientId}
                    onChange={(event) => updateCalendarSettings({ clientId: event.target.value.trim() })}
                    placeholder="xxxxx.apps.googleusercontent.com"
                    className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Календарь аккаунта</label>
                  <select
                    value={calendarSettings.calendarId}
                    onChange={(event) => updateCalendarSettings({ calendarId: event.target.value || "primary" })}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="primary">Основной календарь</option>
                    {googleCalendars.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.summary}{calendar.primary ? " · основной" : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={onGoogleLoadCalendars}
                    disabled={googleBusy || !googleConnected}
                    className="self-start text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40"
                  >
                    Загрузить список календарей
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Время события</label>
                  <input
                    type="time"
                    value={calendarSettings.eventTime}
                    onChange={(event) => updateCalendarSettings({ eventTime: event.target.value || "09:00" })}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Напоминание, минут</label>
                  <input
                    type="number"
                    min={0}
                    max={10080}
                    value={calendarSettings.reminderMinutes}
                    onChange={(event) => updateCalendarSettings({ reminderMinutes: Number(event.target.value) || 0 })}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Calendar ID вручную</label>
                  <input
                    value={calendarSettings.calendarId}
                    onChange={(event) => updateCalendarSettings({ calendarId: event.target.value.trim() || "primary" })}
                    placeholder="primary или адрес календаря"
                    className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={onGoogleConnect}
                  disabled={googleBusy || !calendarSettings.clientId.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {googleConnected ? "Обновить доступ" : "Подключить Google"}
                </button>
                <button
                  type="button"
                  onClick={onGoogleSyncAll}
                  disabled={googleBusy || !googleConnected || !calendarSettings.enabled}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Синхронизировать всё
                </button>
                <button
                  type="button"
                  onClick={onGoogleDisconnect}
                  disabled={googleBusy || !googleConnected}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Отключить
                </button>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">
                Для GitHub Pages доступ Google действует как браузерная сессия. Если Google попросит вход повторно, нажмите “Подключить Google” ещё раз.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 border-t border-stone-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold bg-stone-800 text-white hover:bg-stone-700 transition-colors">
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

