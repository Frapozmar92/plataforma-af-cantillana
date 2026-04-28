import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Rellena estos valores con tu proyecto Supabase.
const SUPABASE_URL = "https://hvvpilxnkpeqpaugnxrh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dnBpbHhua3BlcXBhdWdueHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjc0MTQsImV4cCI6MjA5Mjk0MzQxNH0.bcjgQDf-kBTDFt13BMas7DsTE7JUjviVaZhQavsTh3o";

const STORAGE_KEY = "didactic_modules_config_backup_v1";
const LEGACY_STORAGE_KEY = "didactic_modules_config_v1";

const defaultModules = [
  {
    name: "Modulo 01 - Sistemas Informaticos",
    note: "Practicas y simuladores",
    url: "https://ejemplo.com/modulo-01"
  },
  {
    name: "Modulo 02 - Bases de Datos",
    note: "Actividades y herramientas interactivas",
    url: "https://ejemplo.com/modulo-02"
  }
];

const state = {
  modules: [],
  editingId: null,
  isReady: false
};

const gridEl = document.getElementById("modules-grid");
const adminListEl = document.getElementById("admin-list");
const formEl = document.getElementById("module-form");
const nameInput = document.getElementById("form-name");
const noteInput = document.getElementById("form-note");
const urlInput = document.getElementById("form-url");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const exportBtn = document.getElementById("export-btn");
const importInput = document.getElementById("import-input");
const adminPanelEl = document.querySelector(".admin-panel");
const authPanelEl = document.getElementById("auth-panel");
const authFormEl = document.getElementById("auth-form");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authStatusEl = document.getElementById("auth-status");
const adminAccessBtn = document.getElementById("admin-access-btn");
const adminLogoutBtn = document.getElementById("admin-logout-btn");

const hasSupabaseConfig = !SUPABASE_URL.includes("TU-PROYECTO") && !SUPABASE_ANON_KEY.includes("TU_SUPABASE");
const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function isValidModule(item) {
  return item
    && typeof item.name === "string"
    && typeof item.note === "string"
    && typeof item.url === "string";
}

function isValidModuleArray(config) {
  return Array.isArray(config) && config.every(isValidModule);
}

function migrateLegacyConfig(config) {
  if (!config || typeof config !== "object") return null;
  if (!Array.isArray(config.alumno) || !Array.isArray(config.profesor)) return null;
  const merged = [...config.alumno, ...config.profesor];
  if (!merged.every(isValidModule)) return null;
  return merged;
}

function loadLocalBackup() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isValidModuleArray(parsed)) return parsed;
    } catch {}
  }

  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyRaw) {
    try {
      const legacyParsed = JSON.parse(legacyRaw);
      const migrated = migrateLegacyConfig(legacyParsed);
      if (migrated) return migrated;
    } catch {}
  }

  return JSON.parse(JSON.stringify(defaultModules));
}

function persistLocalBackup() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.modules));
}

function renderModules() {
  gridEl.innerHTML = "";

  state.modules.forEach((module) => {
    const card = document.createElement("article");
    card.className = "module-card";

    const moduleName = document.createElement("h3");
    moduleName.className = "module-name";
    moduleName.textContent = module.name;

    const moduleNote = document.createElement("p");
    moduleNote.className = "module-note";
    moduleNote.textContent = module.note;

    const link = document.createElement("a");
    link.className = "module-link";
    link.href = module.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Entrar al modulo";

    card.append(moduleName, moduleNote, link);
    gridEl.appendChild(card);
  });
}

function renderAdminList() {
  adminListEl.innerHTML = "";

  state.modules.forEach((module) => {
    const item = document.createElement("article");
    item.className = "admin-item";

    const head = document.createElement("div");
    head.className = "admin-item-head";

    const title = document.createElement("strong");
    title.textContent = module.name;

    const url = document.createElement("a");
    url.href = module.url;
    url.target = "_blank";
    url.rel = "noopener noreferrer";
    url.textContent = "Abrir";

    const text = document.createElement("p");
    text.textContent = module.note;

    const actions = document.createElement("div");
    actions.className = "admin-item-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "secondary";
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => startEdit(module.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "secondary";
    deleteBtn.textContent = "Borrar";
    deleteBtn.addEventListener("click", () => removeModule(module.id));

    actions.append(editBtn, deleteBtn);
    head.append(title, url);
    item.append(head, text, actions);
    adminListEl.appendChild(item);
  });
}

function clearForm() {
  formEl.reset();
  state.editingId = null;
  saveBtn.textContent = "Guardar modulo";
}

function startEdit(id) {
  const target = state.modules.find((m) => m.id === id);
  if (!target) return;
  state.editingId = id;
  nameInput.value = target.name;
  noteInput.value = target.note;
  urlInput.value = target.url;
  saveBtn.textContent = "Actualizar modulo";
}

function setAuthUI(session, extraText = "") {
  const isLogged = Boolean(session?.user);
  adminPanelEl.hidden = !isLogged;
  adminLogoutBtn.hidden = !isLogged;
  authPanelEl.hidden = isLogged;
  authStatusEl.textContent = isLogged
    ? `Sesion iniciada: ${session.user.email}${extraText ? ` - ${extraText}` : ""}`
    : extraText || "Sin autenticar";
}

async function fetchModulesFromCloud() {
  const { data, error } = await supabase
    .from("modules")
    .select("id,name,note,url,created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  state.modules = data ?? [];
  persistLocalBackup();
  renderModules();
  renderAdminList();
}

async function seedCloudIfEmpty() {
  const { count, error: countError } = await supabase
    .from("modules")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;
  if (count && count > 0) return;

  const backup = loadLocalBackup();
  const rows = backup.map((m) => ({ name: m.name, note: m.note, url: m.url }));
  const { error: insertError } = await supabase.from("modules").insert(rows);
  if (insertError) throw insertError;
}

async function removeModule(id) {
  if (!supabase) return;
  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) {
    alert(`No se pudo borrar: ${error.message}`);
    return;
  }
  await fetchModulesFromCloud();
}

async function upsertModule(moduleData) {
  if (!supabase) return;
  if (state.editingId) {
    const { error } = await supabase
      .from("modules")
      .update(moduleData)
      .eq("id", state.editingId);
    if (error) {
      alert(`No se pudo actualizar: ${error.message}`);
      return;
    }
  } else {
    const { error } = await supabase.from("modules").insert(moduleData);
    if (error) {
      alert(`No se pudo guardar: ${error.message}`);
      return;
    }
  }

  clearForm();
  await fetchModulesFromCloud();
}

function exportConfig() {
  const exportable = state.modules.map((m) => ({ name: m.name, note: m.note, url: m.url }));
  const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "modulos-didacticos.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function importConfig(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      let modules = null;

      if (isValidModuleArray(parsed)) {
        modules = parsed;
      } else {
        modules = migrateLegacyConfig(parsed);
      }

      if (!modules) {
        alert("El archivo JSON no tiene el formato correcto.");
        return;
      }

      const { error: deleteError } = await supabase.from("modules").delete().neq("id", 0);
      if (deleteError) {
        alert(`No se pudo limpiar la tabla: ${deleteError.message}`);
        return;
      }

      const rows = modules.map((m) => ({ name: m.name, note: m.note, url: m.url }));
      const { error: insertError } = await supabase.from("modules").insert(rows);
      if (insertError) {
        alert(`No se pudo importar: ${insertError.message}`);
        return;
      }

      await fetchModulesFromCloud();
      clearForm();
    } catch {
      alert("No se pudo leer el archivo JSON.");
    }
  };
  reader.readAsText(file);
}

async function bootstrapSupabase() {
  if (!supabase) {
    state.modules = loadLocalBackup();
    renderModules();
    renderAdminList();
    setAuthUI(null, "Configura SUPABASE_URL y SUPABASE_ANON_KEY en app.js");
    return;
  }

  try {
    await seedCloudIfEmpty();
    await fetchModulesFromCloud();
    const { data: { session } } = await supabase.auth.getSession();
    setAuthUI(session);

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthUI(session);
      if (session) await fetchModulesFromCloud();
    });
  } catch (error) {
    state.modules = loadLocalBackup();
    renderModules();
    renderAdminList();
    setAuthUI(null, `Error nube: ${error.message}`);
  } finally {
    state.isReady = true;
  }
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.isReady || !supabase) return;

  const name = nameInput.value.trim();
  const note = noteInput.value.trim();
  const url = urlInput.value.trim();
  if (!name || !note || !url) return;

  await upsertModule({ name, note, url });
});

authFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;

  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;
  if (!email || !password) return;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert(`Login incorrecto: ${error.message}`);
    return;
  }
  authFormEl.reset();
});

cancelEditBtn.addEventListener("click", clearForm);
exportBtn.addEventListener("click", exportConfig);
importInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file && supabase) importConfig(file);
  importInput.value = "";
});

adminAccessBtn.addEventListener("click", async () => {
  if (!supabase) {
    setAuthUI(null, "Configura Supabase para activar login docente");
    authPanelEl.hidden = false;
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    setAuthUI(session);
    return;
  }
  authPanelEl.hidden = false;
  authStatusEl.textContent = "Introduce tus credenciales";
});

adminLogoutBtn.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  clearForm();
});

bootstrapSupabase();
