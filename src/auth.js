import { normalizeState } from "./storage.js";
import { SUPABASE_CONFIG } from "./supabase-config.js";

const SUPABASE_CLIENT_URL = "https://esm.sh/@supabase/supabase-js@2";

export async function initializeAuth({ fallbackState }) {
  const screen = document.querySelector("#auth-screen");
  const appShell = document.querySelector("#app-shell");
  const signInBtn = document.querySelector("#auth-google-btn");
  const signOutBtn = document.querySelector("#auth-sign-out-btn");
  const status = document.querySelector("#auth-status");
  const userLabel = document.querySelector("#auth-user-label");

  const authUi = {
    show(message, tone = "muted") {
      if (!screen) return;
      screen.classList.remove("is-hidden");
      appShell?.classList.add("is-auth-locked");
      if (status) {
        status.textContent = message;
        status.dataset.tone = tone;
      }
    },
    unlock(member) {
      screen?.classList.add("is-hidden");
      appShell?.classList.remove("is-auth-locked");
      if (userLabel) {
        userLabel.textContent = member?.email ? `${member.email}${member.role === "admin" ? " · admin" : ""}` : "";
      }
      signOutBtn?.classList.toggle("is-hidden", !member?.email);
    },
  };

  if (!isSupabaseConfigured()) {
    authUi.unlock(null);
    if (userLabel) userLabel.textContent = "Локальный режим";
    return { mode: "local", canUseApp: true, store: null, member: null };
  }

  authUi.show("Проверяем вход через Google...", "muted");

  let supabase;
  try {
    const { createClient } = await import(SUPABASE_CLIENT_URL);
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  } catch {
    authUi.show("Не удалось загрузить модуль входа. Проверьте интернет и настройки Supabase.", "error");
    return { mode: "remote", canUseApp: false, store: null, member: null };
  }

  signInBtn?.addEventListener("click", () => signInWithGoogle(supabase));
  signOutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.reload();
  });

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session?.user) {
    authUi.show("Войдите через Google. Доступ к базе получат только одобренные пользователи.", "muted");
    return { mode: "remote", canUseApp: false, store: null, member: null };
  }

  const member = await getApprovedMember(supabase, session.user);
  if (!member) {
    authUi.show(`Аккаунт ${session.user.email || ""} вошёл, но ещё не одобрен администратором.`, "warning");
    return { mode: "remote", canUseApp: false, store: null, member: null };
  }

  const store = createRemoteStore(supabase);
  const remoteState = await store.loadState();

  if (!remoteState) {
    await store.saveState(fallbackState);
  }

  authUi.unlock(member);
  return {
    mode: "remote",
    canUseApp: true,
    store,
    member,
    state: remoteState || fallbackState,
  };
}

function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_CONFIG.enabled
      && SUPABASE_CONFIG.url
      && SUPABASE_CONFIG.anonKey
      && SUPABASE_CONFIG.url.includes(".supabase.co")
  );
}

async function signInWithGoogle(supabase) {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.href.split("#")[0],
      scopes: "https://www.googleapis.com/auth/userinfo.email",
    },
  });
}

async function getApprovedMember(supabase, user) {
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) return null;

  const { data, error } = await supabase
    .from("app_members")
    .select("email, role, status")
    .eq("email", email)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function createRemoteStore(supabase) {
  let saveTimer = 0;

  return {
    async loadState() {
      const { data, error } = await supabase
        .from("garden_app_state")
        .select("data")
        .eq("id", SUPABASE_CONFIG.appStateId || "main")
        .maybeSingle();

      if (error || !data?.data) return null;
      return normalizeState(data.data);
    },

    saveState(state) {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(async () => {
        await supabase
          .from("garden_app_state")
          .upsert({
            id: SUPABASE_CONFIG.appStateId || "main",
            data: normalizeState(state),
            updated_at: new Date().toISOString(),
          });
      }, 500);
    },
  };
}
