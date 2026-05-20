import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, Plus, Settings } from "lucide-react";
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

  const grouped = dates.map((date) => ({
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

      <section className="date-strip" aria-label="Лента дат">
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

      <section className="timeline">
        {grouped.map(({ date, tasks }) => (
          <section key={date} className="date-section" data-react-date={date}>
            <div className="date-heading">
              <strong>{displayDate(date)}</strong>
              <span>{displayWeekday(date)}</span>
            </div>
            {tasks.length ? (
              <div className="task-list">
                {tasks.map((task) => <TaskCard key={task.id} task={task} dashboard={dashboard} />)}
              </div>
            ) : (
              <div className="empty-day">На эту дату работы не назначены.</div>
            )}
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

  return (
    <article className={`task-card ${status.tone}`}>
      <button className={`status-pill ${status.tone}`} type="button">{status.label}</button>
      <div className="task-main">
        <div className="task-title">
          <span className="date-chip">{displayDate(task.date)}</span>
          <span className="title-stack">
            <span>{works.map((work) => `${work.icon ? iconToEmoji(work.icon) + " " : ""}${work.label || work.name}`).join(", ") || "Работа"}</span>
            <span>{cultures.map((culture) => `${iconToEmoji(culture.icon)} ${culture.name}`).join(", ") || "Культура не выбрана"}</span>
          </span>
        </div>
        {task.note ? <p className="task-note">{task.note}</p> : null}
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

function shortWeekday(date) {
  return displayWeekday(date).slice(0, 2).toUpperCase();
}

createRoot(document.getElementById("react-root")).render(<App />);
