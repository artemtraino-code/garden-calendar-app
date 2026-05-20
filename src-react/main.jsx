import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react";
import { loadState } from "../src/storage.js";
import { addDays } from "../src/calendar.js";
import {
  byId,
  displayDate,
  displayWeekday,
  taskStatusMeta,
  toDashboardState,
} from "./adapters/legacyState.js";
import "./styles.css";

function App() {
  const [legacyState] = useState(() => loadState());
  const dashboard = useMemo(() => toDashboardState(legacyState), [legacyState]);
  const [activeDate, setActiveDate] = useState(dashboard.today);
  const dateStripRef = useRef(null);

  const dates = useMemo(() => {
    const start = addDays(dashboard.today, -3);
    return Array.from({ length: 13 }, (_, index) => addDays(start, index));
  }, [dashboard.today]);

  function scrollToDate(date) {
    setActiveDate(date);
    requestAnimationFrame(() => {
      document.querySelector(`[data-react-date="${date}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function slideDateStrip(direction) {
    const strip = dateStripRef.current;
    const tile = strip?.querySelector(".date-tile");
    if (!strip || !tile) return;

    const tileRect = tile.getBoundingClientRect();
    strip.scrollBy({
      left: direction * (tileRect.width + 7),
      behavior: "smooth",
    });
  }

  const workDates = useMemo(
    () => [...new Set(dashboard.tasks.map((task) => task.date))].sort(),
    [dashboard.tasks],
  );
  const grouped = workDates.map((date) => ({
    date,
    tasks: dashboard.tasks.filter((task) => task.date === date),
  }));

  return (
    <main className="react-app">
      <header className="app-topbar">
        <div className="brand">
          <span className="brand-mark">🌱</span>
          <div>
            <strong><span className="brand-full">Огородный</span><span className="brand-short">Огородный</span></strong>
            <span>{new Date(`${dashboard.today}T00:00:00`).toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button"><Settings size={16} /> <span>Настройки</span></button>
          <button className="primary-button" type="button"><Plus size={17} /> <span>Новое задание</span></button>
        </div>
      </header>

      <div className="date-carousel" aria-label="Календарь">
        <button className="date-arrow" type="button" aria-label="Предыдущие даты" onClick={() => slideDateStrip(-1)}>
          <ChevronLeft size={14} />
        </button>
        <section ref={dateStripRef} className="date-strip" aria-label="Лента дат">
          {dates.map((date) => {
            const stats = getDateStats(dashboard.tasks, date);
            const tone = stats.missed ? "missed" : stats.planned ? "planned" : stats.done ? "done" : "empty";
            return (
              <button
                key={date}
                type="button"
                className={`date-tile ${tone} ${activeDate === date ? "active" : ""}`}
                onClick={() => scrollToDate(date)}
              >
                <strong>
                  <span className="date-tile-day">{new Date(`${date}T00:00:00`).getDate()}</span>
                  <span className="date-tile-month"> мая</span>
                </strong>
                <span>{shortWeekday(date)}</span>
                <small>
                  {stats.done ? `✓ ${stats.done} ` : ""}
                  {stats.planned ? `• ${stats.planned} ` : ""}
                  {stats.missed ? `↺ ${stats.missed}` : ""}
                </small>
              </button>
            );
          })}
        </section>
        <button className="date-arrow" type="button" aria-label="Следующие даты" onClick={() => slideDateStrip(1)}>
          <ChevronRight size={14} />
        </button>
      </div>

      <section className="timeline">
        {grouped.map(({ date, tasks }) => (
          <section key={date} className="date-section" data-react-date={date}>
            <div className="date-heading">
              <strong>{displayDate(date)}</strong>
              <span>{displayWeekday(date)}</span>
            </div>
            <div className="task-list">
              {tasks.map((task) => <TaskCard key={task.id} task={task} dashboard={dashboard} />)}
            </div>
          </section>
        ))}
      </section>
      <button className="mobile-fab" type="button"><Plus size={22} /> <span>Новое задание</span></button>
    </main>
  );
}

function TaskCard({ task, dashboard }) {
  const status = taskStatusMeta(task.status);
  const works = task.workTypeIds.map((id) => byId(dashboard.workTypes, id)).filter(Boolean);
  const cultures = task.cultureIds.map((id) => byId(dashboard.cultures, id)).filter(Boolean);
  const preparations = task.preparationIds.map((id) => byId(dashboard.preparations, id)).filter(Boolean);
  const firstWorkIcon = workIcon(works[0]);
  const workTitle = works.map((work) => work.label || work.name).join(", ") || "Работа";
  const firstCultureIcon = cultureIcon(cultures[0]);

  return (
    <article className={`task-card ${status.tone}`}>
      <button className={`status-pill ${status.tone}`} type="button">{status.label}</button>
      <div className="task-main">
        <div className="task-row task-row-work">
          <span className="task-row-icon work-icon">{firstWorkIcon}</span>
          <span className="work-title">{workTitle}</span>
        </div>
        <div className="task-row task-row-culture">
          <span className="task-row-icon culture-icon">{firstCultureIcon}</span>
          <div className="culture-line">
            {cultures.map((culture, index) => (
              <span className="culture-item" key={culture.id}>
                {index > 0 ? <span className="culture-inline-icon">{cultureIcon(culture)}</span> : null}
                <span>{culture.name}</span>
              </span>
            ))}
            {!cultures.length ? <span>Культура не выбрана</span> : null}
          </div>
        </div>
      </div>
      <div className="task-side">
        {preparations.length ? (
          <div className="prep-row">
            {preparations.map((prep) => (
              <span className="prep-chip" key={prep.id} title={prep.name}>
                {prep.image ? <img src={prep.image} alt="" loading="lazy" /> : <b>{prep.name.slice(0, 2)}</b>}
                <em>{prep.name}</em>
              </span>
            ))}
          </div>
        ) : (
          <span className="no-preps">Без препаратов</span>
        )}
      </div>
      {task.note ? <p className="task-note">{task.note}</p> : null}
    </article>
  );
}

function getDateStats(tasks, date) {
  const day = tasks.filter((task) => task.date === date);
  return {
    done: day.filter((task) => task.status === "done").length,
    planned: day.filter((task) => task.status === "planned").length,
    missed: day.filter((task) => task.status === "missed").length,
  };
}

function iconToEmoji(icon) {
  const icons = {
    seedling: "🌱",
    blossom: "🌸",
    hibiscus: "🌺",
    rose: "🌹",
    sunflower: "🌻",
    tomato: "🍅",
    droplet: "💧",
    bug: "🐛",
    herb: "🌿",
    scissors: "✂️",
    basket: "🧺",
    "potted-plant": "🪴",
    "hot-pepper": "🌶️",
    cucumber: "🥒",
    "ear-of-corn": "🌽",
  };
  return icons[icon] || icon || "";
}

function workIcon(work) {
  const label = `${work?.id || ""} ${work?.label || ""} ${work?.name || ""}`.toLowerCase();
  return iconToEmoji(work?.icon)
    || (label.includes("полив") ? "💧" : "")
    || (label.includes("посад") ? "🌱" : "")
    || (label.includes("подкорм") ? "🌿" : "")
    || (label.includes("обработ") ? "🐛" : "")
    || "🌱";
}

function cultureIcon(culture) {
  const label = `${culture?.icon || ""} ${culture?.name || ""}`.toLowerCase();
  return iconToEmoji(culture?.icon)
    || (label.includes("клуб") ? "🍓" : "")
    || (label.includes("петун") ? "🌸" : "")
    || (label.includes("роз") ? "🌹" : "")
    || (label.includes("томат") ? "🍅" : "")
    || (label.includes("пер") ? "🫑" : "")
    || (label.includes("огур") ? "🥒" : "")
    || (label.includes("базил") ? "🌿" : "")
    || (label.includes("цвет") ? "🌸" : "")
    || "🌱";
}

function shortWeekday(date) {
  return displayWeekday(date).slice(0, 2).toUpperCase();
}

createRoot(document.getElementById("react-root")).render(<App />);
