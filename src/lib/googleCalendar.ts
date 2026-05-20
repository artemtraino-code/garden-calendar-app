import type { AppState, Status, Task } from "./types";
import { getEffectiveStatus } from "./utils";

const GIS_SCRIPT = "https://accounts.google.com/gsi/client";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SCOPE = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
].join(" ");
const TOKEN_KEY = "garden-calendar-google-token-v1";
const SETTINGS_KEY = "garden-calendar-google-settings-v1";
const DEFAULT_GOOGLE_CLIENT_ID = "149244479390-u8bk08lluj1tb58593kpdmgfmbj7bl94.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

export interface CalendarSettings {
  clientId: string;
  calendarId: string;
  enabled: boolean;
  eventTime: string;
  reminderMinutes: number;
}

export interface GoogleCalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

export interface SyncResult {
  ok: boolean;
  task: Task;
  message: string;
}

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  clientId: DEFAULT_GOOGLE_CLIENT_ID,
  calendarId: "primary",
  enabled: true,
  eventTime: "09:00",
  reminderMinutes: 60,
};

export function loadCalendarSettings(): CalendarSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_CALENDAR_SETTINGS;
    const parsed = JSON.parse(raw);
    const stored = { ...DEFAULT_CALENDAR_SETTINGS, ...parsed };
    const hadClientId = Boolean(parsed.clientId);
    return {
      ...stored,
      clientId: stored.clientId || DEFAULT_GOOGLE_CLIENT_ID,
      enabled: hadClientId ? stored.enabled : true,
    };
  } catch {
    return DEFAULT_CALENDAR_SETTINGS;
  }
}

export function saveCalendarSettings(settings: CalendarSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function hasValidGoogleToken(): boolean {
  const token = readToken();
  return Boolean(token && token.expiresAt > Date.now() + 30_000);
}

export function disconnectGoogleCalendar() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function connectGoogleCalendar(settings: CalendarSettings): Promise<void> {
  if (!settings.clientId.trim()) {
    throw new Error("Укажите Google OAuth Client ID в настройках.");
  }

  await loadGisScript();

  await new Promise<void>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: settings.clientId.trim(),
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || "Google не выдал доступ к календарю."));
          return;
        }

        writeToken({
          accessToken: response.access_token,
          expiresAt: Date.now() + Math.max(0, (response.expires_in ?? 3600) - 60) * 1000,
        });
        resolve();
      },
      error_callback: reject,
    });

    tokenClient?.requestAccessToken({ prompt: hasValidGoogleToken() ? "" : "consent" });
  });
}

export async function syncTaskToGoogle(task: Task, state: AppState, settings: CalendarSettings): Promise<SyncResult> {
  if (!settings.enabled) return { ok: true, task, message: "Google Calendar выключен." };

  const token = readToken();
  if (!token || token.expiresAt <= Date.now() + 30_000) {
    throw new Error("Подключите Google Calendar заново. Срок доступа истёк.");
  }

  const calendarId = encodeURIComponent(settings.calendarId.trim() || "primary");
  const event = taskToGoogleEvent(task, state, settings);
  const method = task.googleEventId ? "PATCH" : "POST";
  const endpoint = task.googleEventId
    ? `${CALENDAR_API}/calendars/${calendarId}/events/${encodeURIComponent(task.googleEventId)}`
    : `${CALENDAR_API}/calendars/${calendarId}/events`;

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(await readGoogleError(response));
  }

  const data = await response.json();
  return {
    ok: true,
    task: {
      ...task,
      googleEventId: data.id || task.googleEventId,
      googleEventLink: data.htmlLink || task.googleEventLink,
      googleSyncedAt: new Date().toISOString(),
    },
    message: task.googleEventId ? "Событие Google Calendar обновлено." : "Событие Google Calendar создано.",
  };
}

export async function deleteGoogleEvent(task: Task, settings: CalendarSettings): Promise<void> {
  if (!settings.enabled || !task.googleEventId) return;

  const token = readToken();
  if (!token || token.expiresAt <= Date.now() + 30_000) {
    throw new Error("Подключите Google Calendar заново. Срок доступа истёк.");
  }

  const calendarId = encodeURIComponent(settings.calendarId.trim() || "primary");
  const response = await fetch(`${CALENDAR_API}/calendars/${calendarId}/events/${encodeURIComponent(task.googleEventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new Error(await readGoogleError(response));
  }
}

export async function listGoogleCalendars(): Promise<GoogleCalendarListItem[]> {
  const token = readToken();
  if (!token || token.expiresAt <= Date.now() + 30_000) {
    throw new Error("Подключите Google Calendar заново. Срок доступа истёк.");
  }

  const response = await fetch(`${CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });

  if (!response.ok) {
    throw new Error(await readGoogleError(response));
  }

  const data = await response.json();
  return (data.items || []).map((item: GoogleCalendarListItem) => ({
    id: item.id,
    summary: item.summary,
    primary: item.primary,
    backgroundColor: item.backgroundColor,
  }));
}

export async function syncAllTasksToGoogle(state: AppState, settings: CalendarSettings): Promise<AppState> {
  let nextState = state;

  for (const task of state.tasks) {
    const result = await syncTaskToGoogle(task, nextState, settings);
    nextState = {
      ...nextState,
      tasks: nextState.tasks.map((item) => (item.id === task.id ? result.task : item)),
    };
  }

  return nextState;
}

function taskToGoogleEvent(task: Task, state: AppState, settings: CalendarSettings) {
  const status = getEffectiveStatus(task);
  const workNames = namesByIds(state.workTypes, task.workTypeIds);
  const cultureNames = namesByIds(state.cultures, task.cultureIds);
  const preparationNames = namesByIds(state.preparations, task.preparationIds);
  const statusLabel = status === "done" ? "Выполнено" : status === "missed" ? "Пропущено" : "Запланировано";
  const summary = `Огород: ${workNames || "Работа"}${cultureNames ? ` - ${cultureNames}` : ""}`;

  const descriptionLines = [
    `Статус: ${statusLabel}`,
    cultureNames && `Культуры: ${cultureNames}`,
    preparationNames && `Препараты: ${preparationNames}`,
    task.notes && `Заметка: ${task.notes}`,
    "",
    `ID задания: ${task.id}`,
  ].filter(Boolean);

  return {
    summary,
    description: descriptionLines.join("\n"),
    start: { dateTime: `${task.date}T${normalizeEventTime(settings.eventTime)}:00`, timeZone: "Europe/Kyiv" },
    end: { dateTime: `${task.date}T${addThirtyMinutes(settings.eventTime)}:00`, timeZone: "Europe/Kyiv" },
    colorId: statusToGoogleColor(status),
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: settings.reminderMinutes }],
    },
    extendedProperties: {
      private: {
        gardenTaskId: task.id,
        gardenTaskStatus: status,
        gardenTaskDate: task.date,
      },
    },
  };
}

function normalizeEventTime(value: string): string {
  return /^\d{2}:\d{2}$/.test(value) ? value : "09:00";
}

function addThirtyMinutes(value: string): string {
  const [hh, mm] = normalizeEventTime(value).split(":").map(Number);
  const date = new Date(2000, 0, 1, hh, mm);
  date.setMinutes(date.getMinutes() + 30);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function namesByIds<T extends { id: string; name: string }>(items: T[], ids: string[]): string {
  return ids
    .map((id) => items.find((item) => item.id === id)?.name)
    .filter(Boolean)
    .join(", ");
}

function statusToGoogleColor(status: Status): string {
  if (status === "done") return "10";
  if (status === "missed") return "11";
  return "9";
}

function readToken(): StoredToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeToken(token: StoredToken) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

async function loadGisScript() {
  if (window.google?.accounts?.oauth2) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Не удалось загрузить Google Identity Services.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить Google Identity Services."));
    document.head.appendChild(script);
  });
}

async function readGoogleError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.error?.message || `Google Calendar вернул ошибку ${response.status}.`;
  } catch {
    return `Google Calendar вернул ошибку ${response.status}.`;
  }
}
