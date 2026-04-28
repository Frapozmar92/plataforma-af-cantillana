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
  isReady: false,
  sessionUser: null,
  accessToken: null
};

const gridEl = document.getElementById("modules-grid");
const adminListEl = document.getElementById("admin-list");
const formEl = document.getElementById("module-form");
const nameInput = document.getElementById("form-name");
const noteInput = document.getElementById("form-note");
const urlInput = document.getElementById("form-url");
const courseInput = document.getElementById("form-course");
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
const adminFeedbackEl = document.getElementById("admin-feedback");
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

function normalizeUrl(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return parsed.toString();
  } catch {
    return null;
  }
}

function courseToTag(course) {
  return course === "SEGUNDO CURSO" ? "[[COURSE:2]] " : "[[COURSE:1]] ";
}

function parseCourseAndNote(note) {
  if (typeof note !== "string") return { course: "PRIMER CURSO", noteText: "" };
  if (note.startsWith("[[COURSE:2]] ")) {
    return { course: "SEGUNDO CURSO", noteText: note.replace("[[COURSE:2]] ", "") };
  }
  if (note.startsWith("[[COURSE:1]] ")) {
    return { course: "PRIMER CURSO", noteText: note.replace("[[COURSE:1]] ", "") };
  }
  return { course: "PRIMER CURSO", noteText: note };
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
  const groups = { "PRIMER CURSO": [], "SEGUNDO CURSO": [] };

  state.modules.forEach((module) => {
    const { course, noteText } = parseCourseAndNote(module.note);
    groups[course].push({ ...module, displayNote: noteText });
  });

  ["PRIMER CURSO", "SEGUNDO CURSO"].forEach((courseName) => {
    const wrapper = document.createElement("section");
    wrapper.className = "course-group";

    const title = document.createElement("h3");
    title.className = "course-title";
    title.textContent = courseName;
    wrapper.appendChild(title);

    const courseGrid = document.createElement("div");
    courseGrid.className = "modules-grid";

    groups[courseName].forEach((module) => {
      const card = document.createElement("article");
      card.className = "module-card";

      const moduleName = document.createElement("h3");
      moduleName.className = "module-name";
      moduleName.textContent = module.name;

      const moduleNote = document.createElement("p");
      moduleNote.className = "module-note";
      moduleNote.textContent = module.displayNote;

      const link = document.createElement("a");
      link.className = "module-link";
      link.href = module.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Entrar al modulo";

      card.append(moduleName, moduleNote, link);
      courseGrid.appendChild(card);
    });

    if (!groups[courseName].length) {
      const empty = document.createElement("p");
      empty.className = "module-note";
      empty.textContent = "Sin modulos en este curso por ahora.";
      wrapper.appendChild(empty);
    } else {
      wrapper.appendChild(courseGrid);
    }

    gridEl.appendChild(wrapper);
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
    const parsed = parseCourseAndNote(module.note);
    title.textContent = `${parsed.course} - ${module.name}`;

    const url = document.createElement("a");
    url.href = module.url;
    url.target = "_blank";
    url.rel = "noopener noreferrer";
    url.textContent = "Abrir";

    const text = document.createElement("p");
    text.textContent = parsed.noteText;

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
  courseInput.value = "PRIMER CURSO";
  state.editingId = null;
  saveBtn.textContent = "Guardar modulo";
  adminFeedbackEl.textContent = "";
}

function startEdit(id) {
  const target = state.modules.find((m) => m.id === id);
  if (!target) return;
  const parsed = parseCourseAndNote(target.note);
  state.editingId = id;
  nameInput.value = target.name;
  noteInput.value = parsed.noteText;
  courseInput.value = parsed.course;
  urlInput.value = target.url;
  saveBtn.textContent = "Actualizar modulo";
}

function setAuthUI(session, extraText = "") {
  const isLogged = Boolean(session?.user);
  state.sessionUser = session?.user ?? null;
  state.accessToken = session?.access_token ?? null;
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

async function writeModulesREST(method, query = "", body = null) {
  if (!state.accessToken) {
    return { ok: false, error: "No hay token de sesion activo." };
  }

  const endpoint = `${SUPABASE_URL}/rest/v1/modules${query}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${state.accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };

  const response = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const raw = await response.text();
    return { ok: false, error: raw || `HTTP ${response.status}` };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { ok: true, data: payload };
}

async function removeModule(id) {
  if (!supabase) return;
  const result = await writeModulesREST("DELETE", `?id=eq.${id}`);
  if (!result.ok) {
    adminFeedbackEl.textContent = `No se pudo borrar: ${result.error}`;
    return;
  }
  adminFeedbackEl.textContent = "Modulo borrado correctamente.";
  await fetchModulesFromCloud();
}

async function upsertModule(moduleData) {
  if (!supabase) return;
  let successMessage = "";
  if (state.editingId) {
    const result = await writeModulesREST("PATCH", `?id=eq.${state.editingId}`, moduleData);
    if (!result.ok) {
      adminFeedbackEl.textContent = `No se pudo actualizar: ${result.error}`;
      return;
    }
    successMessage = "Modulo actualizado correctamente.";
  } else {
    const result = await writeModulesREST("POST", "", [moduleData]);
    if (!result.ok) {
      adminFeedbackEl.textContent = `No se pudo guardar: ${result.error}`;
      return;
    }
    successMessage = "Modulo guardado correctamente.";
  }

  clearForm();
  await fetchModulesFromCloud();
  adminFeedbackEl.textContent = successMessage;
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
        adminFeedbackEl.textContent = "El archivo JSON no tiene el formato correcto.";
        return;
      }

      const { error: deleteError } = await supabase.from("modules").delete().neq("id", 0);
      if (deleteError) {
        adminFeedbackEl.textContent = `No se pudo limpiar la tabla: ${deleteError.message}`;
        return;
      }

      const rows = modules.map((m) => ({ name: m.name, note: m.note, url: m.url }));
      const { error: insertError } = await supabase.from("modules").insert(rows);
      if (insertError) {
        adminFeedbackEl.textContent = `No se pudo importar: ${insertError.message}`;
        return;
      }

      await fetchModulesFromCloud();
      clearForm();
      adminFeedbackEl.textContent = "Importacion completada.";
    } catch {
      adminFeedbackEl.textContent = "No se pudo leer el archivo JSON.";
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
  if (!state.isReady || !supabase) {
    adminFeedbackEl.textContent = "La app aun no ha terminado de conectar con Supabase.";
    return;
  }
  if (!state.sessionUser) {
    adminFeedbackEl.textContent = "Debes iniciar sesion como profesor para guardar.";
    return;
  }

  const name = nameInput.value.trim();
  const note = noteInput.value.trim();
  const course = courseInput.value;
  const normalizedUrl = normalizeUrl(urlInput.value);
  if (!name || !note || !normalizedUrl) {
    adminFeedbackEl.textContent = "Completa todos los campos y revisa la URL.";
    return;
  }

  urlInput.value = normalizedUrl;
  const encodedNote = `${courseToTag(course)}${note}`;
  await upsertModule({ name, note: encodedNote, url: normalizedUrl });
});

authFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;

  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;
  if (!email || !password) return;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    adminFeedbackEl.textContent = `Login incorrecto: ${error.message}`;
    return;
  }
  setAuthUI(data.session);
  authFormEl.reset();
  adminFeedbackEl.textContent = "Sesion iniciada. Ya puedes guardar modulos.";
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
