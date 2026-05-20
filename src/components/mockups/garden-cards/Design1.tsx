import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react";
import { TaskDialog as WorkingTaskDialog } from "../../TaskDialog";
import { SettingsDialog as WorkingSettingsDialog } from "../../SettingsDialog";
import { initialPreparations } from "../../../lib/preparations";
import type { AppState, Culture, Group, Preparation, Status, Task, WorkType } from "../../../lib/types";

interface DateTile {
  date: string;
  label: string;
}

const DATE_WINDOW = 14;

const SEED: AppState = {
  version: 1,
  groups: [
    { id: "g_flowers", name: "Цветы", icon: "🌸", cultureIds: ["c_petunia", "c_rose"] },
    { id: "g_veggies", name: "Овощи", icon: "🥦", cultureIds: ["c_tomato", "c_pepper", "c_basil"] },
    { id: "g_berries", name: "Ягоды", icon: "🍓", cultureIds: ["c_strawberry"] },
    { id: "g_trees", name: "Деревья", icon: "🌳", cultureIds: ["c_apple"] },
  ],
  cultures: [
    { id: "c_petunia", name: "Петунии", icon: "🌸", groupIds: ["g_flowers"] },
    { id: "c_rose", name: "Розы", icon: "🌹", groupIds: ["g_flowers"] },
    { id: "c_tomato", name: "Томаты", icon: "🍅", groupIds: ["g_veggies"] },
    { id: "c_pepper", name: "Перцы", icon: "🫑", groupIds: ["g_veggies"] },
    { id: "c_basil", name: "Базилик", icon: "🌿", groupIds: ["g_veggies"] },
    { id: "c_strawberry", name: "Клубника", icon: "🍓", groupIds: ["g_berries"] },
    { id: "c_apple", name: "Яблони", icon: "🍎", groupIds: ["g_trees"] },
  ],
  workTypes: [
    { id: "w_water", name: "Полив", icon: "💧" },
    { id: "w_treat", name: "Обработка", icon: "🐛" },
    { id: "w_feed", name: "Подкормка", icon: "🌿" },
    { id: "w_plant", name: "Посадка", icon: "🌱" },
    { id: "w_tie", name: "Подвязка", icon: "🪢" },
    { id: "w_prune", name: "Пасынкование", icon: "✂️" },
    { id: "w_mulch", name: "Мульчирование", icon: "🪵" },
  ],
  preparations: initialPreparations,
  tasks: [
    {
      id: "t_1",
      batchId: "b_1",
      status: "missed",
      date: "2026-05-17",
      groupIds: ["g_flowers"],
      cultureIds: ["c_petunia", "c_rose"],
      workTypeIds: ["w_treat"],
      preparationIds: ["prep_topas", "prep_vertimek", "prep_megafol"],
      repeat: { mode: "after", intervalDays: 7, repeatDate: "" },
      notes: "Повторная обработка после баковой смеси",
      createdAt: "2026-05-10",
      updatedAt: "2026-05-17",
    },
    {
      id: "t_2",
      batchId: "b_2",
      status: "done",
      date: "2026-05-18",
      groupIds: ["g_veggies"],
      cultureIds: ["c_tomato", "c_pepper"],
      workTypeIds: ["w_water"],
      preparationIds: [],
      repeat: { mode: "repeat", intervalDays: 2, repeatDate: "" },
      notes: "",
      createdAt: "2026-05-10",
      updatedAt: "2026-05-18",
    },
    {
      id: "t_3",
      batchId: "b_3",
      status: "missed",
      date: "2026-05-18",
      groupIds: ["g_flowers"],
      cultureIds: ["c_petunia"],
      workTypeIds: ["w_feed"],
      preparationIds: ["prep_megafol"],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "Листовая подкормка по влажным листьям",
      createdAt: "2026-05-15",
      updatedAt: "2026-05-18",
    },
    {
      id: "t_4",
      batchId: "b_4",
      status: "missed",
      date: "2026-05-19",
      groupIds: ["g_veggies"],
      cultureIds: ["c_basil"],
      workTypeIds: ["w_plant"],
      preparationIds: [],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "",
      createdAt: "2026-05-17",
      updatedAt: "2026-05-19",
    },
    {
      id: "t_5",
      batchId: "b_5",
      status: "done",
      date: "2026-05-20",
      groupIds: ["g_flowers"],
      cultureIds: ["c_rose"],
      workTypeIds: ["w_treat"],
      preparationIds: ["prep_topas"],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "",
      createdAt: "2026-05-18",
      updatedAt: "2026-05-20",
    },
    {
      id: "t_6",
      batchId: "b_6",
      status: "planned",
      date: "2026-05-20",
      groupIds: ["g_veggies"],
      cultureIds: ["c_tomato", "c_pepper", "c_basil"],
      workTypeIds: ["w_water"],
      preparationIds: [],
      repeat: { mode: "repeat", intervalDays: 2, repeatDate: "" },
      notes: "Капельный полив 30 мин",
      createdAt: "2026-05-18",
      updatedAt: "2026-05-20",
    },
    {
      id: "t_7",
      batchId: "b_7",
      status: "planned",
      date: "2026-05-20",
      groupIds: ["g_flowers"],
      cultureIds: ["c_petunia"],
      workTypeIds: ["w_feed"],
      preparationIds: ["prep_megafol", "prep_master_202020"],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "",
      createdAt: "2026-05-18",
      updatedAt: "2026-05-20",
    },
    {
      id: "t_8",
      batchId: "b_8",
      status: "planned",
      date: "2026-05-21",
      groupIds: ["g_veggies"],
      cultureIds: ["c_tomato", "c_pepper"],
      workTypeIds: ["w_treat"],
      preparationIds: ["prep_aktara", "prep_store_kvadris"],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "Профилактическая обработка",
      createdAt: "2026-05-18",
      updatedAt: "2026-05-21",
    },
    {
      id: "t_9",
      batchId: "b_9",
      status: "planned",
      date: "2026-05-21",
      groupIds: ["g_veggies"],
      cultureIds: ["c_tomato"],
      workTypeIds: ["w_tie"],
      preparationIds: [],
      repeat: { mode: "repeat", intervalDays: 7, repeatDate: "" },
      notes: "",
      createdAt: "2026-05-18",
      updatedAt: "2026-05-21",
    },
    {
      id: "t_10",
      batchId: "b_10",
      status: "planned",
      date: "2026-05-21",
      groupIds: ["g_flowers"],
      cultureIds: ["c_petunia"],
      workTypeIds: ["w_plant"],
      preparationIds: [],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "Пересадка рассады в кашпо",
      createdAt: "2026-05-19",
      updatedAt: "2026-05-21",
    },
    {
      id: "t_11",
      batchId: "b_11",
      status: "planned",
      date: "2026-05-22",
      groupIds: ["g_flowers"],
      cultureIds: ["c_rose"],
      workTypeIds: ["w_water"],
      preparationIds: [],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "",
      createdAt: "2026-05-19",
      updatedAt: "2026-05-22",
    },
    {
      id: "t_12",
      batchId: "b_12",
      status: "planned",
      date: "2026-05-24",
      groupIds: ["g_flowers"],
      cultureIds: ["c_rose", "c_petunia"],
      workTypeIds: ["w_treat"],
      preparationIds: ["prep_topas", "prep_vertimek"],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "Повтор работ от 17 мая",
      createdAt: "2026-05-17",
      updatedAt: "2026-05-24",
    },
    {
      id: "t_13",
      batchId: "b_13",
      status: "planned",
      date: "2026-05-25",
      groupIds: ["g_veggies"],
      cultureIds: ["c_tomato"],
      workTypeIds: ["w_feed"],
      preparationIds: ["prep_master_202020"],
      repeat: { mode: "none", intervalDays: 0, repeatDate: "" },
      notes: "",
      createdAt: "2026-05-19",
      updatedAt: "2026-05-25",
    },
  ],
};

const STATUS_LABEL = { planned: "Запланировано", done: "Выполнено", missed: "Пропущено" };

const STATUS_STYLES = {
  planned: { pill: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", card: "bg-blue-50/70 border-blue-200" },
  done: { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", card: "bg-emerald-50/70 border-emerald-200" },
  missed: { pill: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", card: "bg-red-50/70 border-red-200" },
};

const PREP_PALETTE = [
  "bg-amber-50  text-amber-800  border-amber-200",
  "bg-orange-50 text-orange-800 border-orange-200",
  "bg-purple-50 text-purple-800 border-purple-200",
  "bg-teal-50   text-teal-800   border-teal-200",
  "bg-rose-50   text-rose-800   border-rose-200",
  "bg-indigo-50 text-indigo-800 border-indigo-200",
];

function cn(...inputs: Array<string | false | undefined | null>) {
  return inputs.filter(Boolean).join(" ");
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function getWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][d.getDay()];
}

function getWeekdayFull(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"][d.getDay()];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isBeforeToday(dateStr: string): boolean {
  return dateStr < today();
}

function getEffectiveStatus(task: Task): Status {
  if (task.status === "done") return "done";
  if (task.status === "missed") return "missed";
  if (task.status === "planned" && isBeforeToday(task.date)) return "missed";
  return "planned";
}

function getDateStats(tasks: Task[], dateStr: string) {
  const dayTasks = tasks.filter((t) => t.date === dateStr);
  return {
    done: dayTasks.filter((t) => getEffectiveStatus(t) === "done").length,
    planned: dayTasks.filter((t) => getEffectiveStatus(t) === "planned").length,
    missed: dayTasks.filter((t) => getEffectiveStatus(t) === "missed").length,
  };
}

function getEntityIcons<T extends { id: string; icon: string; name: string }>(list: T[], ids: string[]): T[] {
  return ids.flatMap((id) => {
    const found = list.find((e) => e.id === id);
    return found ? [found] : [];
  });
}

function formatTodayFull(): string {
  const d = new Date();
  return d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function tileBg(done: number, planned: number, missed: number, isActive: boolean) {
  if (isActive) return "bg-stone-800 border-stone-800 text-white";
  if (missed > 0) return "bg-red-50 border-red-200 hover:bg-red-100 text-red-800";
  if (planned > 0) return "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800";
  if (done > 0) return "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800";
  return "bg-white border-stone-200 hover:bg-stone-50 text-stone-500";
}

function daySummaryStatus(done: number, planned: number, missed: number): { count: number; dot: string; text: string } | null {
  if (missed > 0) return { count: missed, dot: "bg-red-500", text: "text-red-700" };
  if (planned > 0) return { count: planned, dot: "bg-blue-500", text: "text-blue-700" };
  if (done > 0) return { count: done, dot: "bg-emerald-500", text: "text-emerald-700" };
  return null;
}

function dayStatusFromTasks(tasks: Task[]): Status {
  if (tasks.some((task) => getEffectiveStatus(task) === "missed")) return "missed";
  if (tasks.some((task) => getEffectiveStatus(task) === "planned")) return "planned";
  return "done";
}

function prepColor(preparations: Preparation[], prepId: string): string {
  const idx = preparations.findIndex((p) => p.id === prepId);
  return PREP_PALETTE[(idx >= 0 ? idx : 0) % PREP_PALETTE.length];
}

function prepAbbr(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function prepShortName(preparation: Preparation): string {
  return preparation.shortName || preparation.name.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function mergeDayTasks(tasks: Task[]): Task {
  const base = tasks[0];
  return {
    ...base,
    status: dayStatusFromTasks(tasks),
    groupIds: uniqueIds(tasks.flatMap((task) => task.groupIds)),
    cultureIds: uniqueIds(tasks.flatMap((task) => task.cultureIds)),
    workTypeIds: uniqueIds(tasks.flatMap((task) => task.workTypeIds)),
    preparationIds: uniqueIds(tasks.flatMap((task) => task.preparationIds)),
    notes: tasks.map((task) => task.notes.trim()).filter(Boolean).join(" · "),
    updatedAt: today(),
  };
}

function DateStrip({
  tiles,
  activeDate,
  tasks,
  onSelect,
}: {
  tiles: DateTile[];
  activeDate: string;
  tasks: Task[];
  onSelect: (date: string) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const todayStr = today();

  function scrollStrip(direction: -1 | 1) {
    stripRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  }

  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-date="${activeDate}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeDate]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => scrollStrip(-1)}
        className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-800"
        aria-label="Прокрутить даты назад"
      >
        <ChevronLeft size={16} />
      </button>

      <div ref={stripRef} className="flex flex-1 gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        {tiles.map(({ date, label }) => {
          const { done, planned, missed } = getDateStats(tasks, date);
          const isActive = date === activeDate;
          const isToday = date === todayStr;
          const total = done + planned + missed;
          const summary = daySummaryStatus(done, planned, missed);

          return (
            <button
              key={date}
              data-date={date}
              onClick={() => onSelect(date)}
              className={cn(
                "shrink-0 basis-[calc((100%-3rem)/7)] sm:basis-auto sm:min-w-[64px] min-w-0 flex flex-col items-center gap-1 px-1 sm:px-3 py-2 sm:py-2.5 rounded-xl border transition-all",
                tileBg(done, planned, missed, isActive),
              )}
            >
              <span className={cn("text-base sm:text-lg font-bold leading-none", isActive && "text-white")}>{label}</span>
              <span className={cn("text-[9px] sm:text-[10px] uppercase tracking-wide font-medium leading-none", isActive ? "text-white/80" : "opacity-70")}>
                {getWeekday(date)}
                {isToday && " •"}
              </span>
              {total > 0 ? (
                <div className="flex gap-1 items-center min-h-[14px]">
                  {summary && (
                    <span className="flex items-center gap-0.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-white/80" : summary.dot)} />
                      <span className={cn("text-[9px] font-semibold", isActive ? "text-white/80" : summary.text)}>{summary.count}</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="min-h-[14px]" />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollStrip(1)}
        className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-800"
        aria-label="Прокрутить даты вперед"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function TaskCard({ task, state, onEdit }: { task: Task; state: AppState; onEdit: (task: Task) => void }) {
  const status = getEffectiveStatus(task);
  const s = STATUS_STYLES[status];
  const works = getEntityIcons(state.workTypes, task.workTypeIds);
  const cultures = getEntityIcons(state.cultures, task.cultureIds);
  const preps = task.preparationIds.flatMap((id) => {
    const found = state.preparations.find((p) => p.id === id);
    return found ? [found] : [];
  });

  return (
    <div className={cn("rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden", s.card)}>
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2.5">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {works.map((w) => (
              <span key={w.id} className="flex items-center gap-1.5">
                <span className="text-xl leading-none">{w.icon}</span>
                <span className="text-base font-bold text-stone-800 leading-none">{w.name}</span>
              </span>
            ))}
            {cultures.length > 0 && (
              <>
                <span className="text-stone-200 select-none">·</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  {cultures.map((c) => (
                    <span key={c.id} className="flex items-center gap-0.5 text-sm text-stone-500">
                      <span className="text-base leading-none">{c.icon}</span>
                      {c.name}
                    </span>
                  ))}
                </span>
              </>
            )}
          </div>

          {preps.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {preps.map((p) => (
                <span
                  key={p.id}
                  title={`${p.name} — ${p.purposeShort}${p.dosage ? ` · ${p.dosage}` : ""}`}
                  className="inline-flex items-center gap-1.5 min-w-0 text-xs font-semibold text-stone-700"
                >
                  {p.image ? (
                    <img
                      className="w-7 h-7 rounded-md object-contain bg-white border border-stone-100 shadow-sm"
                      src={p.image}
                      alt=""
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center text-[10px] font-bold">
                      {prepAbbr(p.name)}
                    </span>
                  )}
                  <span className="leading-tight">{prepShortName(p)}</span>
                </span>
              ))}
            </div>
          )}

          {task.notes && <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">{task.notes}</p>}
        </div>

        <button
          onClick={() => onEdit(task)}
          className={cn(
            "flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
            "text-[11px] font-semibold border whitespace-nowrap",
            "transition-all hover:opacity-80 active:scale-95",
            s.pill,
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
          {STATUS_LABEL[status]}
        </button>
      </div>
    </div>
  );
}

function DayCard({ tasks, state, onEdit }: { tasks: Task[]; state: AppState; onEdit: (task: Task) => void }) {
  const dayStatus = dayStatusFromTasks(tasks);
  const s = STATUS_STYLES[dayStatus];
  const works = getEntityIcons(state.workTypes, [...new Set(tasks.flatMap((task) => task.workTypeIds))]);
  const cultures = getEntityIcons(state.cultures, [...new Set(tasks.flatMap((task) => task.cultureIds))]);
  const preps = [...new Set(tasks.flatMap((task) => task.preparationIds))].flatMap((id) => {
    const found = state.preparations.find((p) => p.id === id);
    return found ? [found] : [];
  });
  const notes = tasks.map((task) => task.notes.trim()).filter(Boolean);

  return (
    <div className={cn("rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden", s.card)}>
      <div className="px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {works.map((w) => (
              <span key={w.id} className="flex items-center gap-1.5">
                <span className="text-xl leading-none">{w.icon}</span>
                <span className="text-base font-bold text-stone-800 leading-none">{w.name}</span>
              </span>
            ))}
          </div>

          <button
            onClick={() => onEdit(tasks[0])}
            className={cn(
              "flex-shrink-0 inline-flex min-h-[28px] items-center gap-1.5 px-2.5 py-1 rounded-full",
              "text-[10px] font-semibold border whitespace-nowrap leading-none",
              "transition-all hover:opacity-80 active:scale-95",
              s.pill,
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            {STATUS_LABEL[dayStatus]}
          </button>
        </div>

        <div className="mt-1.5 flex flex-col gap-1.5 w-full min-w-0">
          {cultures.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-sm text-stone-500">
              {cultures.map((c) => (
                <span key={c.id} className="flex items-center gap-0.5">
                  <span className="text-base leading-none">{c.icon}</span>
                  {c.name}
                </span>
              ))}
            </div>
          )}

          {preps.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {preps.map((p) => (
                <span
                  key={p.id}
                  title={`${p.name} — ${p.purposeShort}${p.dosage ? ` · ${p.dosage}` : ""}`}
                  className="inline-flex items-center gap-1.5 min-w-0 text-xs font-semibold text-stone-700"
                >
                  {p.image ? (
                    <img className="w-7 h-7 rounded-md object-contain bg-white border border-stone-100 shadow-sm" src={p.image} alt="" />
                  ) : (
                    <span className="w-7 h-7 rounded-md bg-white/70 text-stone-600 flex items-center justify-center text-[10px] font-bold">
                      {prepAbbr(p.name)}
                    </span>
                  )}
                  <span className="leading-tight">{prepShortName(p)}</span>
                </span>
              ))}
            </div>
          )}

          {notes.length > 0 && (
            <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{notes.join(" · ")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Design1() {
  const [state, setState] = useState<AppState>(SEED);
  const todayStr = today();
  const [activeDate, setActiveDate] = useState(todayStr);
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task: Task | null; originDate?: string; forceNew?: boolean }>({ open: false, task: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const startDate = addDays(todayStr, -3);
  const tiles = Array.from({ length: DATE_WINDOW }, (_, i) => {
    const d = addDays(startDate, i);
    return { date: d, label: new Date(d + "T00:00:00").getDate().toString() };
  });

  const allDates = Array.from(new Set(state.tasks.map((t) => t.date))).sort();
  const uniqueDates = [...new Set([...tiles.map((t) => t.date), ...allDates])].sort();
  const missedCount = state.tasks.filter((t) => getEffectiveStatus(t) === "missed").length;
  const plannedCount = state.tasks.filter((t) => getEffectiveStatus(t) === "planned").length;
  const doneCount = state.tasks.filter((t) => getEffectiveStatus(t) === "done").length;

  function scrollToDate(date: string) {
    setActiveDate(date);
    const el = feedRef.current?.querySelector(`[data-section="${date}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function openNew() {
    setTaskDialog({ open: true, task: null });
  }

  function openDayEdit(tasks: Task[]) {
    setTaskDialog({ open: true, task: mergeDayTasks(tasks), originDate: tasks[0]?.date });
  }

  function saveTask(task: Task) {
    setState((current) => {
      const exists = current.tasks.some((item) => item.id === task.id);
      if (!exists) return { ...current, tasks: [...current.tasks, task] };
      const originDate = taskDialog.originDate;
      const tasks = current.tasks.filter((item) => item.id !== task.id && (!originDate || item.date !== originDate));
      return { ...current, tasks: [...tasks, task] };
    });
  }

  function deleteTask(id: string) {
    setState((current) => {
      const originDate = taskDialog.originDate;
      return { ...current, tasks: current.tasks.filter((item) => item.id !== id && (!originDate || item.date !== originDate)) };
    });
  }

  function repeatTask(task: Task) {
    const note = `Повтор работ от ${formatDateLong(task.date)}`;
    const repeated: Task = {
      ...task,
      id: createId("t"),
      batchId: createId("b"),
      status: "planned",
      date: addDays(task.date, task.repeat.intervalDays > 0 ? task.repeat.intervalDays : 7),
      notes: note,
      createdAt: today(),
      updatedAt: today(),
    };
    setTaskDialog({ open: false, task: null });
    window.setTimeout(() => {
      setTaskDialog({ open: true, task: repeated, forceNew: true });
    }, 180);
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 sm:gap-5">
          <div className="flex-shrink-0">
            <span className="text-base font-bold text-stone-800">🌱 Огородный</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-sm text-stone-400 flex-shrink-0">
            <span className="w-px h-4 bg-stone-200" />
            <span>{formatTodayFull()}</span>
          </div>

          <div className="hidden lg:flex items-center gap-4 ml-2">
            {missedCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="w-2 h-2 rounded-full bg-red-500" /> {missedCount} пропущено
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> {plannedCount} запланировано
            </span>
            <span className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {doneCount} выполнено
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setSettingsOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors font-medium">
              <Settings size={14} /> Настройки
            </button>
            <button onClick={() => setSettingsOpen(true)} className="sm:hidden w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors">
              <Settings size={15} />
            </button>
            <button onClick={openNew} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm transition-colors shadow-sm">
              <Plus size={15} />
              <span className="hidden sm:inline">Новое задание</span>
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3">
          <DateStrip tiles={tiles} activeDate={activeDate} tasks={state.tasks} onSelect={scrollToDate} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-col gap-5 flex-1">
        <div ref={feedRef} className="flex flex-col gap-5 pb-24">
          {uniqueDates.map((date) => {
            const dayTasks = state.tasks
              .filter((t) => t.date === date)
              .sort((a, b) => {
                const order: Record<string, number> = { missed: 0, planned: 1, done: 2 };
                return (order[getEffectiveStatus(a)] ?? 9) - (order[getEffectiveStatus(b)] ?? 9);
              });

            if (dayTasks.length === 0) return null;
            const isToday = date === todayStr;

            return (
              <div key={date} data-section={date}>
                <div className="flex items-baseline gap-2 mb-2.5">
                  <span className={`text-sm font-semibold whitespace-nowrap ${isToday ? "text-emerald-700" : "text-stone-700"}`}>{formatDateLong(date)}</span>
                  <span className="text-xs text-stone-400">{getWeekdayFull(date)}</span>
                  {isToday && <span className="text-[10px] font-bold bg-emerald-500 text-white rounded-full px-2 py-0.5 leading-none">Сегодня</span>}
                  <div className="h-px flex-1 bg-stone-100 ml-1" />
                  <span className="text-xs text-stone-300">{dayTasks.length}</span>
                </div>

                <DayCard tasks={dayTasks} state={state} onEdit={() => openDayEdit(dayTasks)} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="sm:hidden fixed bottom-5 right-4 z-30">
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-colors">
          <Plus size={16} /> Новое задание
        </button>
      </div>

      <WorkingTaskDialog
        open={taskDialog.open}
        task={taskDialog.task}
        forceNew={taskDialog.forceNew}
        state={state}
        defaultDate={activeDate}
        onClose={() => setTaskDialog({ open: false, task: null })}
        onSave={saveTask}
        onDelete={deleteTask}
        onRepeat={repeatTask}
      />
      <WorkingSettingsDialog
        open={settingsOpen}
        state={state}
        onClose={() => setSettingsOpen(false)}
        onChange={setState}
      />
    </div>
  );
}
