import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { X, ChevronDown, Search } from "lucide-react";

interface Option {
  id: string;
  name: string;
  icon?: string;
}

interface MultiPickerProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function MultiPicker({ label, options, selected, onChange, placeholder }: MultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  }

  function selectAll() {
    onChange(options.map((o) => o.id));
  }

  function removeChip(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  const selectedOptions = selected.flatMap((id) => {
    const o = options.find((opt) => opt.id === id);
    return o ? [o] : [];
  });

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-white text-sm transition-colors",
            open ? "border-emerald-400 ring-2 ring-emerald-100" : "border-stone-200 hover:border-stone-300"
          )}
        >
          <span className="text-stone-400 truncate">
            {selected.length === 0
              ? (placeholder ?? "Выберите...")
              : `Выбрано: ${selected.length}`}
          </span>
          <ChevronDown
            size={14}
            className={cn("text-stone-400 transition-transform flex-shrink-0", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-stone-100 flex items-center gap-2">
              <Search size={14} className="text-stone-400 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-stone-400"
              />
            </div>
            <div className="p-1 border-b border-stone-100">
              <button
                type="button"
                onClick={selectAll}
                className="w-full text-left text-xs text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg"
              >
                Выбрать все
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">Ничего не найдено</p>
              ) : (
                filtered.map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(o.id)}
                      onChange={() => toggle(o.id)}
                      className="accent-emerald-600 w-4 h-4 flex-shrink-0"
                    />
                    {o.icon && <span>{o.icon}</span>}
                    <span className="text-sm text-stone-700">{o.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full px-2 py-0.5"
            >
              {o.icon && <span>{o.icon}</span>}
              {o.name}
              <button type="button" onClick={() => removeChip(o.id)} className="hover:text-emerald-600">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

