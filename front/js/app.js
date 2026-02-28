// Configuración - Cambia esto por la URL de tu backend
const API_URL = "http://localhost:8000";

// Estado
let currentType = "nota";

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  loadInbox();
  loadProcessed();
  initDragAndDrop();

  document
    .getElementById("fileInput")
    .addEventListener("change", handleFileSelect);
});

// Funciones de UI
function showTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.getElementById(tabName + "-tab").classList.add("active");
  event.target.classList.add("active");
}

function setType(type) {
  currentType = type;
  document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.classList.remove("active-type");
  });
  event.target.classList.add("active-type");
}

// Capturar texto
async function captureText() {
  const content = document.getElementById("text-input").value;

  if (!content.trim()) {
    showNotification("Escribe algo primero", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("content", content);
  formData.append("tipo", currentType);

  try {
    const response = await fetch(`${API_URL}/api/capture/text`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById("text-input").value = "";
      showNotification("¡Capturado!", "success");
      loadInbox();
    }
  } catch (error) {
    showNotification("Error de conexión", "error");
  }
}

// Drag & Drop
function initDragAndDrop() {
  const dropZone = document.getElementById("dropZone");

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.background = "#e3f2fd";
    dropZone.style.borderColor = "#2196f3";
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.style.background = "#f8fafc";
    dropZone.style.borderColor = "#cbd5e0";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.background = "#f8fafc";
    dropZone.style.borderColor = "#cbd5e0";

    const files = e.dataTransfer.files;
    uploadFiles(files);
  });
}

function handleFileSelect(event) {
  const files = event.target.files;
  uploadFiles(files);
}

async function uploadFiles(files) {
  const preview = document.getElementById("filePreview");

  for (let file of files) {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";
    fileItem.innerHTML = `
            <span>📄 ${file.name}</span>
            <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
        `;
    preview.appendChild(fileItem);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        fileItem.classList.add("success");
        showNotification(`${file.name} subido`, "success");
      } else {
        fileItem.classList.add("error");
      }
    } catch (error) {
      fileItem.classList.add("error");
      showNotification(`Error con ${file.name}`, "error");
    }
  }

  setTimeout(() => {
    preview.innerHTML = "";
    document.getElementById("fileInput").value = "";
  }, 3000);

  loadInbox();
}

// Cargar datos
async function loadInbox() {
  try {
    const response = await fetch(`${API_URL}/api/entries/inbox`);
    const entries = await response.json();

    const inboxList = document.getElementById("inboxList");
    const inboxCount = document.getElementById("inboxCount");

    inboxCount.textContent = entries.length;

    if (entries.length === 0) {
      inboxList.innerHTML = '<p class="empty-message">📭 Inbox vacío</p>';
      return;
    }

    inboxList.innerHTML = entries
      .map(
        (entry) => `
            <div class="entry-card">
                <div class="entry-icon">${getIcon(entry.tipo)}</div>
                <div class="entry-content">
                    <div class="entry-type">${getTypeName(entry.tipo)}</div>
                    <div class="entry-text">${formatContent(entry)}</div>
                    <div class="entry-meta">
                        ${new Date(entry.fecha).toLocaleString()}
                        ${entry.tamano ? ` • ${(entry.tamano / 1024).toFixed(1)} KB` : ""}
                    </div>
                </div>
                <div class="entry-actions">
                    <button onclick="processEntry('${entry.id}')" class="process-btn">✓ Procesar</button>
                    <button onclick="deleteEntry('${entry.id}')" class="delete-btn">✗</button>
                </div>
            </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error:", error);
  }
}

async function loadProcessed() {
  try {
    const response = await fetch(`${API_URL}/api/entries/processed`);
    const entries = await response.json();

    const processedList = document.getElementById("processedList");
    const processedCount = document.getElementById("processedCount");

    processedCount.textContent = entries.length;

    if (entries.length === 0) {
      processedList.innerHTML =
        '<p class="empty-message">📖 No hay entradas procesadas</p>';
      return;
    }

    processedList.innerHTML = entries
      .map(
        (entry) => `
            <div class="entry-card processed">
                <div class="entry-icon">${getIcon(entry.tipo)}</div>
                <div class="entry-content">
                    <div class="entry-type">${getTypeName(entry.tipo)}</div>
                    <div class="entry-text">${formatContent(entry)}</div>
                    <div class="entry-meta">
                        ${new Date(entry.fecha).toLocaleString()}
                    </div>
                </div>
            </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Acciones
async function processEntry(entryId) {
  try {
    const response = await fetch(`${API_URL}/api/entries/process/${entryId}`, {
      method: "POST",
    });

    if (response.ok) {
      loadInbox();
      loadProcessed();
      showNotification("Entrada procesada", "success");
    }
  } catch (error) {
    showNotification("Error al procesar", "error");
  }
}

async function deleteEntry(entryId) {
  if (!confirm("¿Eliminar esta entrada?")) return;

  try {
    const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      loadInbox();
      loadProcessed();
      showNotification("Entrada eliminada", "success");
    }
  } catch (error) {
    showNotification("Error al eliminar", "error");
  }
}

// Utilidades
function getIcon(tipo) {
  const icons = {
    nota: "📝",
    tarea: "✅",
    idea: "💡",
    enlace: "🔗",
    audio: "🎵",
    video: "🎥",
    imagen: "🖼️",
    documento: "📄",
    hoja_calculo: "📊",
    presentacion: "📽️",
    comprimido: "📦",
    codigo: "💻",
    otros: "📁",
  };
  return icons[tipo] || "📌";
}

function getTypeName(tipo) {
  const names = {
    nota: "Nota",
    tarea: "Tarea",
    idea: "Idea",
    enlace: "Enlace",
    audio: "Audio",
    video: "Video",
    imagen: "Imagen",
    documento: "Documento",
    hoja_calculo: "Hoja de cálculo",
    presentacion: "Presentación",
    comprimido: "Comprimido",
    codigo: "Código",
    otros: "Otros",
  };
  return names[tipo] || tipo;
}

function formatContent(entry) {
  if (entry.contenido) {
    if (entry.contenido.startsWith("http")) {
      return `<a href="${entry.contenido}" target="_blank">${entry.contenido}</a>`;
    }
    return entry.contenido;
  }
  return entry.nombre_original || "Sin contenido";
}

// Notificaciones
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
