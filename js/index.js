/* ==========================================================================
   SISTEMA DE GESTIÓN DINÁMICA DEL CATÁLOGO
   ========================================================================== */

// 🔑 CONFIGURACIÓN DE TU USUARIO Y CONTRASEÑA DIRECTA LOCAL
const ADMIN_USER = "Ivan_salcedo";
const ADMIN_PASSWORD = "Ivan0826$";

// -------- ESTADO GLOBAL --------
let products = JSON.parse(localStorage.getItem("catalogProducts") || "[]");
let uploadedImages = [];
let currentViewIndex = 0;
let currentProduct = null;
let isAdmin = sessionStorage.getItem("adminAuthenticated") === "true";

// -------- ELEMENTOS DEL PANEL EN EL DOM --------
const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const statTotal = document.getElementById("statTotal");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const btnAdminAuth = document.getElementById("btnAdminAuth");

// Referencias Modales internos
const loginOverlay = document.getElementById("loginOverlay");
const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const btnSubmitLogin = document.getElementById("btnSubmitLogin");
const btnCloseLogin = document.getElementById("btnCloseLogin");

const modalOverlay = document.getElementById("modalOverlay");
const dropZone = document.getElementById("dropZone");
const dropZoneInner = document.getElementById("dropZoneInner");
const fileInput = document.getElementById("fileInput");
const previewGrid = document.getElementById("previewGrid");
const prodName = document.getElementById("prodName");
const prodPrice = document.getElementById("prodPrice");
const prodCategory = document.getElementById("prodCategory");
const prodDesc = document.getElementById("prodDesc");
const prodWhatsapp = document.getElementById("prodWhatsapp");

const viewOverlay = document.getElementById("viewOverlay");
const viewImage = document.getElementById("viewImage");
const viewImgCount = document.getElementById("viewImgCount");
const viewPrev = document.getElementById("viewPrev");
const viewNext = document.getElementById("viewNext");
const viewCategory = document.getElementById("viewCategory");
const viewName = document.getElementById("viewName");
const viewPrice = document.getElementById("viewPrice");
const viewDesc = document.getElementById("viewDesc");
const viewWhatsapp = document.getElementById("viewWhatsapp");

// -------- INICIALIZACIÓN --------
applySecurityUI();
renderAll();
updateCategoryFilter();

// -------- SISTEMA INTERNO DE INICIO DE SESIÓN --------
btnAdminAuth.addEventListener("click", () => {
  if (isAdmin) {
    isAdmin = false;
    sessionStorage.removeItem("adminAuthenticated");
    alert("Sesión administrativa cerrada correctamente.");
    applySecurityUI();
    renderAll();
  } else {
    openLoginModal();
  }
});

function openLoginModal() {
  loginUser.value = "";
  loginPass.value = "";
  loginOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLoginModal() {
  loginOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

btnSubmitLogin.addEventListener("click", procesarAutenticacion);
loginPass.addEventListener("keypress", (e) => {
  if (e.key === "Enter") procesarAutenticacion();
});
loginUser.addEventListener("keypress", (e) => {
  if (e.key === "Enter") procesarAutenticacion();
});

function procesarAutenticacion() {
  const u = loginUser.value.trim();
  const p = loginPass.value;

  if (u === ADMIN_USER && p === ADMIN_PASSWORD) {
    isAdmin = true;
    sessionStorage.setItem("adminAuthenticated", "true");
    alert("¡Acceso correcto! Bienvenido al panel de control.");
    closeLoginModal();
    applySecurityUI();
    renderAll();
  } else {
    alert("Credenciales incorrectas. Inténtalo de nuevo.");
  }
}

btnCloseLogin.addEventListener("click", closeLoginModal);
loginOverlay.addEventListener("click", (e) => {
  if (e.target === loginOverlay) closeLoginModal();
});

function applySecurityUI() {
  const adminElements = document.querySelectorAll(".id-admin-only");
  const visitorElements = document.querySelectorAll(".id-visitor-only");

  if (isAdmin) {
    btnAdminAuth.textContent = "🔓 Salir Modo Admin";
    btnAdminAuth.classList.add("active-session");
    adminElements.forEach((el) => (el.style.display = ""));
    visitorElements.forEach((el) => (el.style.display = "none"));
  } else {
    btnAdminAuth.textContent = "🔒 Modo Admin";
    btnAdminAuth.classList.remove("active-session");
    adminElements.forEach((el) => (el.style.display = "none"));
    visitorElements.forEach((el) => (el.style.display = ""));
  }
}

// -------- CONTROL MODAL DE SUBIDA --------
function openModal() {
  if (!isAdmin) {
    openLoginModal();
    return;
  }
  modalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modalOverlay.classList.remove("active");
  document.body.style.overflow = "";
  resetForm();
}

document.getElementById("btnHeroUpload").addEventListener("click", openModal);
document.getElementById("btnCatalogAdd").addEventListener("click", openModal);
document.getElementById("btnEmptyAdd").addEventListener("click", openModal);
document.getElementById("btnCloseModal").addEventListener("click", closeModal);
document.getElementById("btnCancelModal").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// -------- PROCESAMIENTO DRAG & DROP MULTIFOTO (LÍMITE 20 IMÁGENES) --------
dropZoneInner.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("drag-over"),
);
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", () => handleFiles(fileInput.files));

function handleFiles(files) {
  if (uploadedImages.length + files.length > 20) {
    alert(
      "¡Límite excedido! Solo puedes subir un máximo de 20 imágenes de alta resolución.",
    );
    return;
  }

  Array.from(files).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages.push(e.target.result);
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  previewGrid.innerHTML = "";
  uploadedImages.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "preview-thumb";
    previewGrid.appendChild(img);
  });
  if (uploadedImages.length > 0) {
    dropZoneInner.style.display = "none";
  }
}

// -------- CONTROL GUARDAR PRODUCTO --------
document.getElementById("btnSaveProduct").addEventListener("click", () => {
  const name = prodName.value.trim();
  const price = parseFloat(prodPrice.value);
  const category = prodCategory.value.trim();

  if (!name || isNaN(price) || !category) {
    alert(
      "Por favor completa los campos obligatorios (*) Nombre, Precio y Categoría.",
    );
    return;
  }

  const product = {
    id: Date.now(),
    images: [...uploadedImages],
    name,
    price,
    category: category,
    description: prodDesc.value.trim(),
    whatsapp: prodWhatsapp.value.trim(),
    createdAt: new Date().toISOString(),
  };

  products.unshift(product);
  saveProducts();
  renderAll();
  updateCategoryFilter();
  closeModal();
});

function resetForm() {
  uploadedImages = [];
  previewGrid.innerHTML = "";
  dropZoneInner.style.display = "";
  fileInput.value = "";
  prodName.value = "";
  prodPrice.value = "";
  prodCategory.value = "";
  prodDesc.value = "";
  prodWhatsapp.value = "";
}

// -------- RENDERIZADO DE LA GRILLA DINÁMICA --------
function renderAll() {
  const query = searchInput.value.toLowerCase();
  const cat = categoryFilter.value;

  const filtered = products.filter((p) => {
    const matchQ =
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query);
    const matchC = !cat || p.category === cat;
    return matchQ && matchC;
  });

  statTotal.textContent = products.length;

  if (products.length === 0) {
    emptyState.classList.remove("hidden");
    productGrid.classList.add("hidden");
  } else {
    emptyState.classList.add("hidden");
    productGrid.classList.remove("hidden");
    productGrid.innerHTML = "";

    filtered.forEach((p, index) => {
      const card = buildCard(p, index);
      productGrid.appendChild(card);
    });

    if (filtered.length === 0) {
      productGrid.innerHTML =
        '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:50px; font-size:15px;">No se encontraron artículos con esos términos.</p>';
    }
  }
}

function buildCard(p, delay) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.style.animationDelay = `${delay * 40}ms`;

  const imgHTML =
    p.images && p.images.length > 0
      ? `<img class="card-image" src="${p.images[0]}" alt="${p.name}" loading="lazy"/>`
      : `<div class="card-image-placeholder">📷</div>`;

  const priceFormatted = p.price.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

  card.innerHTML = `
    ${imgHTML}
    <div class="card-body">
      <p class="card-category">${p.category}</p>
      <h3 class="card-name">${p.name}</h3>
      <p class="card-price">${priceFormatted}</p>
      ${p.description ? `<p class="card-desc">${p.description}</p>` : ""}
    </div>
    <div class="card-footer">
      <span class="card-imgs-count">${p.images.length > 0 ? "🖼️ " + p.images.length + " fotos" : "📷 Sin foto"}</span>
      <span class="card-action-text">Ver detalle →</span>
    </div>
  `;

  card.addEventListener("click", () => openView(p));
  return card;
}

// -------- CARRUSEL MULTIFOTO DETALLE --------
function openView(p) {
  currentProduct = p;
  currentViewIndex = 0;
  updateViewImage();

  viewCategory.textContent = p.category;
  viewName.textContent = p.name;

  const priceText = p.price.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
  viewPrice.textContent = priceText;
  viewDesc.textContent =
    p.description ||
    "Este producto no tiene una descripción adicional asignada.";

  if (p.whatsapp) {
    const cleanNum = p.whatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `¡Hola! Me interesa la mercancía: *${p.name}* (${priceText}). ¿Está disponible?`,
    );
    viewWhatsapp.href = `https://wa.me/${cleanNum}?text=${msg}`;
    viewWhatsapp.style.display = "";
  } else {
    viewWhatsapp.style.display = "none";
  }

  const btnDelete = document.getElementById("btnDeleteProduct");
  btnDelete.style.display = isAdmin ? "" : "none";

  viewOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function updateViewImage() {
  const p = currentProduct;
  if (!p || !p.images || p.images.length === 0) {
    viewImage.src = "";
    viewImage.alt = "Sin imágenes";
    viewImgCount.textContent = "0 / 0";
    viewPrev.style.display = "none";
    viewNext.style.display = "none";
    return;
  }

  viewImage.src = p.images[currentViewIndex];
  viewImgCount.textContent = `${currentViewIndex + 1} / ${p.images.length}`;
  viewPrev.style.display = p.images.length > 1 ? "" : "none";
  viewNext.style.display = p.images.length > 1 ? "" : "none";
}

viewPrev.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!currentProduct) return;
  currentViewIndex =
    (currentViewIndex - 1 + currentProduct.images.length) %
    currentProduct.images.length;
  updateViewImage();
});

viewNext.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!currentProduct) return;
  currentViewIndex = (currentViewIndex + 1) % currentProduct.images.length;
  updateViewImage();
});

function closeView() {
  viewOverlay.classList.remove("active");
  document.body.style.overflow = "";
  currentProduct = null;
}
document.getElementById("btnCloseView").addEventListener("click", closeView);
viewOverlay.addEventListener("click", (e) => {
  if (e.target === viewOverlay) closeView();
});

// -------- ELIMINAR ARTÍCULO --------
document.getElementById("btnDeleteProduct").addEventListener("click", () => {
  if (!isAdmin) return;
  if (
    !confirm(
      `¿Deseas quitar permanentemente "${currentProduct.name}" del inventario?`,
    )
  )
    return;

  products = products.filter((p) => p.id !== currentProduct.id);
  saveProducts();
  renderAll();
  updateCategoryFilter();
  closeView();
});

// -------- BUSCADORES Y FILTRADO --------
searchInput.addEventListener("input", renderAll);
categoryFilter.addEventListener("change", renderAll);

function updateCategoryFilter() {
  const cats = [...new Set(products.map((p) => p.category))].sort();
  const selected = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
  cats.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    if (c === selected) opt.selected = true;
    categoryFilter.appendChild(opt);
  });
}

// -------- COPIAR ENLACE INTERNO --------
document.getElementById("btnShare").addEventListener("click", () => {
  const url = window.location.href;
  navigator.clipboard
    .writeText(url)
    .then(() => {
      const feed = document.getElementById("shareFeedback");
      feed.textContent =
        "✓ Enlace del catálogo copiado correctamente al portapapeles.";
      setTimeout(() => (feed.textContent = ""), 4000);
    })
    .catch(() => {
      prompt("Copia este enlace para compartir el catálogo:", url);
    });
});

// -------- ALMACENAMIENTO LOCAL EN NAVEGADOR --------
function saveProducts() {
  try {
    localStorage.setItem("catalogProducts", JSON.stringify(products));
  } catch (e) {
    alert(
      "La memoria del navegador se encuentra saturada. Las imágenes ocupan espacio, intenta reducir la resolución antes de cargarlas.",
    );
  }
}
