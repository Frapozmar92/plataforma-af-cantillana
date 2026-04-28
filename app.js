const STORAGE_KEY = "didactic_modules_config_v2";
const LEGACY_STORAGE_KEY = "didactic_modules_config_v1";
const ADMIN_SESSION_KEY = "didactic_admin_enabled_v1";
const TEACHER_PASSWORD = "cambiar-esta-clave";

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
  modules: loadModules(),
  editingIndex: null
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
const adminAccessBtn = document.getElementById("admin-access-btn");
const adminLogoutBtn = document.getElementById("admin-logout-btn");

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultModules));
}

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

function loadModules() {
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
      if (migrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {}
  }

  return cloneDefaults();
}

function persistModules() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.modules));
}

function isAdminEnabled() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

function setAdminEnabled(enabled) {
  if (enabled) sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function refreshAdminVisibility() {
  const enabled = isAdminEnabled();
  adminPanelEl.hidden = !enabled;
  adminLogoutBtn.hidden = !enabled;
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

  state.modules.forEach((module, index) => {
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
    editBtn.addEventListener("click", () => startEdit(index));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "secondary";
    deleteBtn.textContent = "Borrar";
    deleteBtn.addEventListener("click", () => removeModule(index));

    actions.append(editBtn, deleteBtn);
    head.append(title, url);
    item.append(head, text, actions);
    adminListEl.appendChild(item);
  });
}

function clearForm() {
  formEl.reset();
  state.editingIndex = null;
  saveBtn.textContent = "Guardar modulo";
}

function startEdit(index) {
  const target = state.modules[index];
  state.editingIndex = index;
  nameInput.value = target.name;
  noteInput.value = target.note;
  urlInput.value = target.url;
  saveBtn.textContent = "Actualizar modulo";
}

function removeModule(index) {
  state.modules.splice(index, 1);
  persistModules();
  renderModules();
  renderAdminList();
}

function upsertModule(moduleData) {
  if (state.editingIndex !== null) {
    state.modules[state.editingIndex] = moduleData;
  } else {
    state.modules.push(moduleData);
  }

  persistModules();
  renderModules();
  renderAdminList();
  clearForm();
}

function exportConfig() {
  const blob = new Blob([JSON.stringify(state.modules, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "modulos-didacticos.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function importConfig(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));

      if (isValidModuleArray(parsed)) {
        state.modules = parsed;
      } else {
        const migrated = migrateLegacyConfig(parsed);
        if (!migrated) {
          alert("El archivo JSON no tiene el formato correcto.");
          return;
        }
        state.modules = migrated;
      }

      persistModules();
      renderModules();
      renderAdminList();
      clearForm();
    } catch {
      alert("No se pudo leer el archivo JSON.");
    }
  };
  reader.readAsText(file);
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const note = noteInput.value.trim();
  const url = urlInput.value.trim();

  if (!name || !note || !url) return;
  upsertModule({ name, note, url });
});

cancelEditBtn.addEventListener("click", clearForm);
exportBtn.addEventListener("click", exportConfig);
importInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importConfig(file);
  importInput.value = "";
});

adminAccessBtn.addEventListener("click", () => {
  const value = window.prompt("Introduce la clave de profesor:");
  if (value === null) return;
  if (value !== TEACHER_PASSWORD) {
    alert("Clave incorrecta.");
    return;
  }
  setAdminEnabled(true);
  refreshAdminVisibility();
});

adminLogoutBtn.addEventListener("click", () => {
  setAdminEnabled(false);
  refreshAdminVisibility();
});

renderModules();
renderAdminList();
refreshAdminVisibility();
