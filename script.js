// ====== CONFIGURACIÓN DE APIS SEPARADAS ======
const URL_API_ARCHIVOS = "https://script.google.com/macros/s/AKfycbziXvFsUOWxO0luoU1YEx86qOV9KIrr7rW4PmIptemO6uvs2RgaihdSZBqMaCE9DCI25g/exec"; 
const URL_BACKEND_BASH = "http://localhost:8585";
// =============================================

const coloresCategorias = {
    todos: "linear-gradient(135deg, #a832ff 0%, #3b52ff 100%)",
    documentos: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", 
    videos: "linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)",     
    audio: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",     
    imagenes: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",  
    otros: "linear-gradient(135deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%)",
    "mis-archivos": "linear-gradient(135deg, #3b52ff 0%, #2193b0 100%)",
    agregar: "linear-gradient(135deg, #11998e 0%, #1ee596 100%)" 
};

let baseDeDatosArchivos = [];
let categoriaActual = "todos";
let textoBusquedaActual = "";
let player = null; 

// Carga archivos desde tu script de Drive original
async function cargarDatosDesdeDrive() {
    const contenedor = document.getElementById("content");
    contenedor.innerHTML = "<p style='color: #777; padding: 20px; grid-column: 1/-1; text-align: center;'>Conectando con Google Drive...</p>";

    try {
        const respuesta = await fetch(URL_API_ARCHIVOS); 
        const datos = await respuesta.json();

        baseDeDatosArchivos = datos.archivos;

        document.getElementById("badge-todos").textContent = datos.contadores.todos;
        document.getElementById("badge-documentos").textContent = datos.contadores.documentos;
        document.getElementById("badge-videos").textContent = datos.contadores.videos;
        document.getElementById("badge-audio").textContent = datos.contadores.audio;
        document.getElementById("badge-imagenes").textContent = datos.contadores.imagenes;
        document.getElementById("badge-otros").textContent = datos.contadores.otros;

        renderizarTarjetas();

    } catch (error) {
        console.error("Error al conectar con la API de Drive:", error);
        contenedor.innerHTML = "<p style='color: red; padding: 20px; grid-column: 1/-1; text-align: center;'>Error al cargar los archivos de Google Drive.</p>";
    }
}

function renderizarTarjetas() {
    const contenedor = document.getElementById("content");
    contenedor.innerHTML = "";
    const usuarioLogueado = localStorage.getItem("sesion-usuario") || "Invitado";

    // === VISTA: MIS ARCHIVOS ===
    if (categoriaActual === "mis-archivos") {
        const misArchivos = baseDeDatosArchivos.filter(arc => arc.propietario === usuarioLogueado);
        const categoriasOrdenadas = ["documentos", "videos", "audio", "imagenes", "otros"];
        let filasHTML = "";
        
        const iconosFilas = {
            documentos: "fa-file-lines",
            videos: "fa-video",
            audio: "fa-music",
            imagenes: "fa-image",
            otros: "fa-ellipsis"
        };

        categoriasOrdenadas.forEach(cat => {
            const archivosDeEstaCat = misArchivos.filter(arc => arc.categoria === cat);
            const iconoActual = iconosFilas[cat] || "fa-folder";

            filasHTML += `
                <div class="category-row">
                    <h4><i class="fa-solid ${iconoActual}"></i> Mis ${cat.toUpperCase()}</h4>
                    <div class="row-products-list">
                        ${archivosDeEstaCat.length === 0 
                            ? `<p class="empty-row-text">No tienes archivos guardados en esta sección.</p>`
                            : archivosDeEstaCat.map(archivo => `
                                <div class="user-file-item">
                                    <span><i class="fa-solid ${iconoActual}" style="margin-right: 8px; opacity: 0.7;"></i>${archivo.nombre} <small>(${archivo.tamano})</small></span>
                                    <button class="btn-delete-file" onclick="eliminarArchivoSimulado('${archivo.id}')">
                                        <i class="fa-solid fa-trash-can"></i> Eliminar
                                    </button>
                                </div>
                              `).join('')
                        }
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = `
            <div class="manager-container">
                <h3 class="manager-title">
                    <i class="fa-solid fa-folder-user"></i> Repositorio de: <strong>${usuarioLogueado}</strong>
                </h3>
                ${filasHTML}
            </div>
        `;
        return;
    }

    // === VISTA: AGREGAR ===
    if (categoriaActual === "agregar") {
        contenedor.innerHTML = `
            <div class="manager-container compact-view">
                <div class="upload-form-card">
                    <h3><i class="fa-solid fa-cloud-arrow-up"></i> Agregar Nuevo Archivo</h3>
                    <form onsubmit="event.preventDefault(); alert('Subida simulada con éxito.');">
                        <div class="form-group">
                            <label>Nombre del Archivo</label>
                            <input type="text" placeholder="Escribe el título..." required>
                        </div>
                        <div class="form-group">
                            <label>Categoría</label>
                            <select required>
                                <option value="documentos">Documentos</option>
                                <option value="videos">Videos</option>
                                <option value="audio">Audio</option>
                                <option value="imagenes">Imágenes</option>
                                <option value="otros">Otros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="file-label-btn" for="simple-file">
                                <i class="fa-solid fa-paperclip"></i> Elegir Archivo
                            </label>
                            <input type="file" id="simple-file" style="display:none;" onchange="document.getElementById('simple-file-text').textContent = this.files[0].name">
                            <span id="simple-file-text" class="file-status-text">Ningún archivo seleccionado</span>
                        </div>
                        <button type="submit" class="btn-upload-submit">
                            <i class="fa-solid fa-arrow-up-from-bracket"></i> Subir Archivo
                        </button>
                    </form>
                </div>
            </div>
        `;
        return;
    }

    const archivosFiltrados = baseDeDatosArchivos.filter(archivo => {
        const cumpleCategoria = (categoriaActual === "todos" || archivo.categoria === categoriaActual);
        const cumpleBusqueda = archivo.nombre.toLowerCase().includes(textoBusquedaActual.toLowerCase());
        return cumpleCategoria && cumpleBusqueda;
    });

    if (archivosFiltrados.length === 0) {
        contenedor.innerHTML = "<p style='color: #777; padding:20px; grid-column: 1/-1; text-align:center;'>No se encontraron archivos en esta sección.</p>";
        return;
    }

    archivosFiltrados.forEach(archivo => {
        const card = document.createElement("div");
        card.className = "video-card";
        card.setAttribute("data-category", archivo.categoria);
        card.style.cursor = "pointer";

        let elementoVisual = "";
        
        if (archivo.categoria === "imagenes") {
            const urlPreviewImagen = `https://drive.google.com/file/d/${archivo.id}/preview`;
            elementoVisual = `
                <div style="width:100%; height:180px; position:relative; overflow:hidden; border-radius:16px 16px 0 0;">
                    <iframe src="${urlPreviewImagen}" scrolling="no" style="width:100%; height:100%; border:none; pointer-events: none;"></iframe>
                    <div style="position:absolute; top:0; left:0; width:100%; height:100%; background:transparent;"></div>
                </div>`;
        } else if (archivo.categoria === "videos") {
            elementoVisual = `
                <div style="width:100%; height:180px; background:#1e1e1e; display:flex; align-items:center; justify-content:center; border-radius:16px 16px 0 0; position:relative;">
                    <i class="fa-solid fa-circle-play" style="font-size: 50px; color: #ff4b2b; z-index:2;"></i>
                    <div style="position:absolute; width:100%; height:100%; background: linear-gradient(transparent, rgba(0,0,0,0.7)); border-radius:16px 16px 0 0;"></div>
                </div>`;
        } else {
            const urlPreview = `https://drive.google.com/file/d/${archivo.id}/preview`;
            elementoVisual = `<iframe src="${urlPreview}" scrolling="no"></iframe>`;
        }

        card.innerHTML = `
            ${elementoVisual}
            <div class="video-info">
                <h4>${archivo.nombre}</h4>
                <p>${archivo.categoria.toUpperCase()} • ${archivo.tamano}</p>
            </div>
        `;

        if (archivo.categoria === "videos") {
            card.addEventListener("click", () => abrirReproductorVideo(archivo.id, archivo.nombre));
        } else if (archivo.categoria === "imagenes") {
            card.addEventListener("click", () => abrirVisorImagen(archivo.id, archivo.nombre));
        }

        contenedor.appendChild(card);
    });
}

function abrirVisorImagen(idArchivo, nombreImagen) {
    const modal = document.getElementById("video-modal");
    const container = modal.querySelector(".video-container");
    
    container.innerHTML = `
        <iframe src="https://drive.google.com/file/d/${idArchivo}/preview" 
                style="width:100%; height:100%; border:none;" 
                allow="autoplay">
        </iframe>
    `;
    modal.style.display = "flex";
}

function abrirReproductorVideo(idArchivo, nombreVideo) {
    const modal = document.getElementById("video-modal");
    const container = modal.querySelector(".video-container");
    
    container.innerHTML = `
        <iframe src="https://drive.google.com/file/d/${idArchivo}/preview" 
                style="width:100%; height:100%; border:none;" 
                allow="autoplay; encrypted-media" 
                allowfullscreen>
        </iframe>
    `;
    modal.style.display = "flex";
}

function inicializarEventosModal() {
    const modal = document.getElementById("video-modal");
    const botonCerrar = modal.querySelector(".close-modal");

    const cerrar = () => {
        modal.style.display = "none";
        modal.querySelector(".video-container").innerHTML = ""; 
    };

    botonCerrar.addEventListener("click", cerrar);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) cerrar();
    });
}

function inicializarFiltros() {
    const botones = document.querySelectorAll(".btn-category");
    const header = document.getElementById("hero-header");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            categoriaActual = boton.getAttribute("data-category");

            botones.forEach(b => b.classList.remove("active"));
            boton.classList.add("active");

            if (coloresCategorias[categoriaActual]) {
                header.style.background = coloresCategorias[categoriaActual];
                document.documentElement.style.setProperty('--color-activo', coloresCategorias[categoriaActual]);
            }

            renderizarTarjetas();
        });
    });
}

function inicializarBusqueda() {
    const inputBusqueda = document.querySelector("#search-container input");
    inputBusqueda.addEventListener("input", (evento) => {
        textoBusquedaActual = evento.target.value;
        renderizarTarjetas();
    });
}

function inicializarModoOscuro() {
    const botonToggle = document.getElementById("dark-mode-toggle");
    const iconoBoton = botonToggle.querySelector("i");
    const cuerpo = document.body;

    const modoOscuroGuardado = localStorage.getItem("modo-oscuro");
    
    if (modoOscuroGuardado === "activado") {
        cuerpo.classList.add("dark-mode");
        iconoBoton.classList.replace("fa-moon", "fa-sun");
    } else {
        cuerpo.classList.remove("dark-mode");
        iconoBoton.classList.replace("fa-sun", "fa-moon");
    }

    botonToggle.addEventListener("click", () => {
        cuerpo.classList.toggle("dark-mode");
        
        if (cuerpo.classList.contains("dark-mode")) {
            iconoBoton.classList.replace("fa-moon", "fa-sun");
            localStorage.setItem("modo-oscuro", "activado");
        } else {
            iconoBoton.classList.replace("fa-sun", "fa-moon");
            localStorage.setItem("modo-oscuro", "desactivado");
        }
    });
}

async function ejecutarAutenticacion(payload) {
    try {
        const respuesta = await fetch(URL_BACKEND_BASH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await respuesta.json();
        
        if (resultado.estatus === "ok") {
            if (payload.accion === "login") {
                localStorage.setItem("sesion-usuario", resultado.usuario);
                localStorage.setItem("sesion-rol", resultado.rol); 
                
                document.getElementById("login-modal").style.display = "none";
                
                actualizarBotonUsuario();
                aplicarRestriccionesDeModulo();
            } else {
                alert("¡Registro exitoso! Ya puedes iniciar sesión.");
                document.getElementById("register-modal").style.display = "none";
                document.getElementById("login-modal").style.display = "flex";
            }
        } else {
            alert(resultado.mensaje);
        }
    } catch (err) {
        console.error("Error al conectar con el cifrador Bash:", err);
        alert("Error de conexión con el servidor de autenticación local.");
    }
}

function actualizarBotonUsuario() {
    const usuarioLogueado = localStorage.getItem("sesion-usuario");
    const botonAuth = document.getElementById("auth-modal-trigger");
    const dropdown = document.getElementById("logout-dropdown");
    
    if (usuarioLogueado) {
        botonAuth.innerHTML = `
            <i class="fa-solid fa-user-check" style="color: #38ef7d;"></i>
            <span>${usuarioLogueado}</span>
            <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 5px; color: #aaa;"></i>
        `;
        botonAuth.title = "Opciones de cuenta";
    } else {
        botonAuth.innerHTML = `
            <i class="fa-solid fa-user-gear"></i>
            <span>Ingresar</span>
        `;
        botonAuth.title = "Acceder a la cuenta";
        dropdown.style.display = "none";
    }
}

function aplicarRestriccionesDeModulo() {
    const botonesCategorias = document.querySelectorAll(".btn-category");
    botonesCategorias.forEach(boton => {
        boton.style.display = "flex"; 
    });
}

function inicializarModalesAuth() {
    const loginModal = document.getElementById("login-modal");
    const registerModal = document.getElementById("register-modal");
    const btnAbrirLogin = document.getElementById("auth-modal-trigger");
    const dropdown = document.getElementById("logout-dropdown");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    
    const btnCerrarLogin = document.getElementById("close-login");
    const btnCerrarRegister = document.getElementById("close-register");
    
    const linkARegistro = document.getElementById("go-to-register");
    const linkALogin = document.getElementById("go-to-login");

    btnAbrirLogin.addEventListener("click", (e) => {
        e.stopPropagation();
        const usuarioLogueado = localStorage.getItem("sesion-usuario");
        if (usuarioLogueado) {
            dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        } else {
            loginModal.style.display = "flex";
        }
    });

    btnCerrarSesion.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("sesion-usuario");
        localStorage.removeItem("sesion-rol");
        
        dropdown.style.display = "none";
        actualizarBotonUsuario();
        aplicarRestriccionesDeModulo();
        
        document.querySelector('[data-category="todos"]').click();
        alert("Sesión cerrada correctamente.");
    });

    window.addEventListener("click", () => {
        dropdown.style.display = "none";
    });

    btnCerrarLogin.addEventListener("click", () => loginModal.style.display = "none");
    btnCerrarRegister.addEventListener("click", () => registerModal.style.display = "none");

    linkARegistro.addEventListener("click", (e) => {
        e.preventDefault(); loginModal.style.display = "none"; registerModal.style.display = "flex";
    });
    linkALogin.addEventListener("click", (e) => {
        e.preventDefault(); registerModal.style.display = "none"; loginModal.style.display = "flex";
    });

    loginModal.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const inputs = loginModal.querySelectorAll("input");
        ejecutarAutenticacion({
            accion: "login",
            usuario: inputs[0].value.trim(),
            password: inputs[1].value
        });
    });

    registerModal.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const inputs = registerModal.querySelectorAll("input");
        ejecutarAutenticacion({
            accion: "registro",
            usuario: inputs[0].value.trim(),
            correo: inputs[1].value.trim(),
            password: inputs[2].value
        });
    });

    window.addEventListener("click", (e) => {
        if (e.target === loginModal) loginModal.style.display = "none";
        if (e.target === registerModal) registerModal.style.display = "none";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosDesdeDrive();
    inicializarFiltros();
    inicializarBusqueda();
    inicializarModoOscuro();
    inicializarEventosModal();
    inicializarModalesAuth();
    aplicarRestriccionesDeModulo();
    actualizarBotonUsuario(); 
});