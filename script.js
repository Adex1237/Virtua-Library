// ====== CONFIGURACIÓN DE APIS ======
const URL_BACKEND_BASH = "http://localhost:8585"; // Servidor Git Bash local
const URL_API_ARCHIVOS = "https://script.google.com/macros/s/AKfycbyU1_OX6GhnXGVD3U85pVF6WACZOobQzeO1JKlSuhoWn1PbHKxjZgz9immhkqHHwYKMzA/exec"; // El script que lee las carpetas

let listaArchivosGlobal = [];
let categoriaActual = "todos";

// ====== PALETA DE COLORES (CON VERDE OSCURO EN AUDIO Y VERDE BRILLANTE EN AGREGAR) ======
const coloresCategorias = {
    todos: "linear-gradient(135deg, #7300e6 0%, #a832ff 100%)",
    documentos: "linear-gradient(135deg, #1e3c72 0%, #2a52be 100%)",
    videos: "linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)",      
    audio: "linear-gradient(135deg, #0b5345 0%, #117a65 100%)",       // Verde Pino
    imagenes: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",    
    juegos: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",    
    otros: "linear-gradient(135deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%)",
    agregar: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"      // Verde Esmeralda
};

// ====== INICIALIZACIÓN DE LA APLICACIÓN ======
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosDesdeDrive();
    inicializarFiltros();
    inicializarBusqueda();
    inicializarModoOscuro();
    inicializarModalesAuth();
    actualizarBotonUsuario(); // Verifica sesión al cargar la página
});

// ====== CARGAR ARCHIVOS DESDE GOOGLE DRIVE ======
async function cargarDatosDesdeDrive() {
    try {
        const respuesta = await fetch(URL_API_ARCHIVOS);
        const datos = await respuesta.json();
        
        listaArchivosGlobal = datos.archivos || [];
        actualizarBadges(datos.contadores);
        renderizarTarjetas();
    } catch (error) {
        console.error("Error al cargar archivos de Drive:", error);
        document.getElementById("content").innerHTML = `<p class="error-msg">Error al conectar con la biblioteca en la nube.</p>`;
    }
}

// ====== ACTUALIZAR CONTADORES (BADGES) ======
function actualizarBadges(contadores) {
    if (!contadores) return;
    for (let cat in contadores) {
        const badge = document.getElementById(`badge-${cat}`);
        if (badge) badge.textContent = contadores[cat];
    }
}

// ====== FILTROS DE CATEGORÍAS ======
function inicializarFiltros() {
    const botones = document.querySelectorAll(".btn-category");
    botones.forEach(btn => {
        btn.addEventListener("click", () => {
            botones.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            categoriaActual = btn.getAttribute("data-category");
            renderizarTarjetas();
        });
    });
}

// ====== SISTEMA DE BÚSQUEDA ======
function inicializarBusqueda() {
    const inputBusqueda = document.querySelector("#search-container input");
    inputBusqueda.addEventListener("input", (e) => {
        const termino = e.target.value.toLowerCase().trim();
        renderizarTarjetas(termino);
    });
}

// ====== RENDERIZAR TARJETAS EN PANTALLA ======
function renderizarTarjetas(terminoBusqueda = "") {
    const contenedor = document.getElementById("content");
    contenedor.innerHTML = "";

    // MÓDULO VISUAL DE AGREGAR (Estructura base estable)
    if (categoriaActual === "agregar") {
        contenedor.innerHTML = `
            <div class="modulo-info-box">
                <i class="fa-solid fa-circle-plus" style="font-size: 48px; color: #11998e; margin-bottom: 15px;"></i>
                <h3>Módulo Agregar</h3>
                <p>Aquí se integrará el cargador físico de archivos vinculados a tu cuenta corporativa.</p>
            </div>
        `;
        return;
    }

    // Filtrar la lista global por categoría y búsqueda
    const archivosFiltrados = listaArchivosGlobal.filter(archivo => {
        const coincideCategoria = (categoriaActual === "todos" || archivo.categoria === categoriaActual);
        const coincideBusqueda = archivo.nombre.toLowerCase().includes(terminoBusqueda);
        return coincideCategoria && coincideBusqueda;
    });

    if (archivosFiltrados.length === 0) {
        contenedor.innerHTML = `<p class="no-results">No se encontraron archivos en esta sección.</p>`;
        return;
    }

    // Construir los elementos multimedia
    archivosFiltrados.forEach(archivo => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "card";
        
        // Asignar color según su categoría
        const gradiente = coloresCategorias[archivo.categoria] || coloresCategorias.otros;
        
        tarjeta.innerHTML = `
            <div class="card-icon" style="background: ${gradiente}">
                ${obtenerIconoCategoria(archivo.categoria)}
            </div>
            <div class="card-info">
                <h4 title="${archivo.nombre}">${archivo.nombre}</h4>
                <p><i class="fa-solid fa-weight-hanging"></i> ${archivo.tamano || 'S/N'}</p>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function obtenerIconoCategoria(cat) {
    switch(cat) {
        case "documentos": return '<i class="fa-solid fa-file-lines"></i>';
        case "videos": return '<i class="fa-solid fa-video"></i>';
        case "audio": return '<i class="fa-solid fa-music"></i>';
        case "imagenes": return '<i class="fa-solid fa-image"></i>';
        default: return '<i class="fa-solid fa-ellipsis"></i>';
    }
}

// ====== INTERFAZ DINÁMICA DE USUARIOS ======
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

// ====== CONTROLADOR DE MODALES Y AUTENTICACIÓN ======
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

    // Lógica del Botón Principal: Desplegar menú o abrir Login
    btnAbrirLogin.addEventListener("click", (e) => {
        e.stopPropagation(); 
        const usuarioLogueado = localStorage.getItem("sesion-usuario");
        if (usuarioLogueado) {
            dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        } else {
            loginModal.style.display = "flex";
        }
    });

    // Acción Cerrar Sesión
    btnCerrarSesion.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("sesion-usuario");
        localStorage.removeItem("sesion-rol");
        
        dropdown.style.display = "none";
        actualizarBotonUsuario();
        
        document.querySelector('[data-category="todos"]').click();
        alert("Sesión cerrada correctamente.");
    });

    // Cerrar menú al hacer clic en el cuerpo de la página
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

    // Envío del Formulario de Login
    loginModal.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const inputs = loginModal.querySelectorAll("input");
        ejecutarAutenticacion({
            accion: "login",
            usuario: inputs[0].value.trim(),
            password: inputs[1].value
        });
    });

    // Envío del Formulario de Registro
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

// ====== PETICIONES AL CIFRADOR LOCAL BASH ======
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
                
                // Desaparece el modal directamente sin ventanas emergentes intermedias
                document.getElementById("login-modal").style.display = "none";
                
                actualizarBotonUsuario();
            } else {
                alert("¡Registro exitoso! Ya puedes iniciar sesión.");
                document.getElementById("register-modal").style.display = "none";
                document.getElementById("login-modal").style.display = "flex";
            }
        } else {
            alert(resultado.mensaje);
        }
    } catch (err) {
        console.error("Error al conectar con Bash:", err);
        alert("Error al conectar con el servidor de autenticación local.");
    }
}

// ====== MODO OSCURO (OPCIONAL/BÁSICO) ======
function inicializarModoOscuro() {
    const toggle = document.getElementById("dark-mode-toggle");
    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const icono = toggle.querySelector("i");
        if (document.body.classList.contains("dark-mode")) {
            icono.className = "fa-solid fa-sun";
        } else {
            icono.className = "fa-solid fa-moon";
        }
    });
}