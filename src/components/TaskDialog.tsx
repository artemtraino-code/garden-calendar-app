import { useState, useEffect } from "react";
import { X, Trash2, RefreshCw } from "lucide-react";
import { MultiPicker } from "./MultiPicker";
import { cn, nanoid, today, addDays } from "../lib/utils";
import type { Task, AppState, Status, RepeatMode, RepeatConfig } from "../lib/types";

interface TaskDialogProps {
  open: boolean;
  task: Task | null;
  forceNew?: boolean;
  state: AppState;
  defaultDate?: string;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onRepeat: (task: Task) => void;
}

const STATUS_OPTIONS: { value: Status; label: string; badge: string }[] = [
  { value: "planned", label: "Запланировано", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "done",    label: "Выполнено",     badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "missed",  label: "Пропущено",     badge: "bg-red-50 text-red-700 border-red-200" },
];

const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: "none",   label: "Не повторять"    },
  { value: "once",   label: "Повторить один раз" },
  { value: "after",  label: "Повторить через" },
  { value: "repeat", label: "Повторять каждые" },
];

const BLANK_REPEAT: RepeatConfig = { mode: "none", intervalDays: 7, repeatDate: "" };

function blankTask(date = today()): Task {
  const id = nanoid();
  return {
    id,
    batchId: "b_" + id,
    status: "planned",
    date,
    groupIds: [],
    cultureIds: [],
    workTypeIds: [],
    preparationIds: [],
    repeat: { ...BLANK_REPEAT },
    notes: "",
    createdAt: today(),
    updatedAt: today(),
  };
}

export function TaskDialog({ open, task, forceNew, state, defaultDate, onClose, onSave, onDelete, onRepeat }: TaskDialogProps) {
  const isNew = task === null || forceNew;
  const [form, setForm] = useState<Task>(blankTask);

  useEffect(() => {
    if (open) {
      setForm(task ? { ...task, repeat: { ...task.repeat } } : blankTask(defaultDate));
    }
  }, [open, task, defaultDate]);

  if (!open) return null;

  function set<K extends keyof Task>(key: K, value: Task[K]) {
    setForm((f) => ({ ...f, [key]: value, updatedAt: today() }));
  }

  function setRepeat<K extends keyof RepeatConfig>(key: K, value: RepeatConfig[K]) {
    setForm((f) => ({ ...f, repeat: { ...f.repeat, [key]: value }, updatedAt: today() }));
  }

  function handleSave() {
    if (form.workTypeIds.length === 0) return;
    onSave(form);
    onClose();
  }

  function handleDelete() {
    if (task) { onDelete(task.id); onClose(); }
  }

  function handleRepeat() {
    if (task) { onRepeat(task); onClose(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-4 sm:pt-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-2xl shadow-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[92dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
          <h2 className="text-base font-bold text-stone-800">
            {isNew ? "Новое задание" : "Редактировать задание"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors">
            <X size={14} className="text-stone-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5 overscroll-contain">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Статус</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("status", opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    form.status === opt.value
                      ? opt.badge + " ring-2 ring-offset-1 ring-stone-400"
                      : "bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <MultiPicker
                label="Группы"
                options={state.groups}
                selected={form.groupIds}
                onChange={(ids) => set("groupIds", ids)}
                placeholder="Выберите группы..."
              />
            </div>

            <div className="min-w-0">
              <MultiPicker
                label="Культуры"
                options={state.cultures.filter((c) =>
                  form.groupIds.length === 0 || c.groupIds.some((g) => form.groupIds.includes(g))
                )}
                selected={form.cultureIds}
                onChange={(ids) => set("cultureIds", ids)}
                placeholder="Выберите культуры..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <MultiPicker
                label="Работы"
                options={state.workTypes}
                selected={form.workTypeIds}
                onChange={(ids) => set("workTypeIds", ids)}
                placeholder="Выберите работы..."
              />
            </div>

            <div className="min-w-0">
              <MultiPicker
                label="Препараты"
                options={state.preparations}
                selected={form.preparationIds}
                onChange={(ids) => set("preparationIds", ids)}
                placeholder="Выберите препараты..."
              />
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Дата</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Repeat */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-stone-700">Повторение</label>
            <div className="flex flex-wrap gap-1.5">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRepeat("mode", opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    form.repeat.mode === opt.value
                      ? "bg-stone-800 text-white border-stone-800"
                      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(form.repeat.mode === "after" || form.repeat.mode === "repeat") && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.repeat.intervalDays}
                  onChange={(e) => setRepeat("intervalDays", Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <span className="text-sm text-stone-500">дней</span>
              </div>
            )}
            {form.repeat.mode === "once" && (
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-xs text-stone-500">Дата повтора</label>
                <input
                  type="date"
                  value={form.repeat.repeatDate || addDays(form.date, 7)}
                  onChange={(e) => setRepeat("repeatDate", e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            )}
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Заметка</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Дополнительная информация..."
              className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white resize-none focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t border-stone-100 bg-white px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            {!isNew && (
              <>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
              >
                <Trash2 size={13} /> Удалить
              </button>
              {task?.status === "done" && (
                <button
                  type="button"
                  onClick={handleRepeat}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                >
                  <RefreshCw size={13} /> Повторить
                </button>
              )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors",
                !isNew ? "sm:ml-auto" : "col-start-1 sm:ml-auto"
              )}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={form.workTypeIds.length === 0}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {isNew ? "Создать" : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

