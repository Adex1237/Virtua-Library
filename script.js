// ====== CONFIGURACIÓN DE APIS SEPARADAS ======
const URL_API_ARCHIVOS = "https://script.google.com/macros/s/AKfycbziXvFsUOWxO0luoU1YEx86qOV9KIrr7rW4PmIptemO6uvs2RgaihdSZBqMaCE9DCI25g/exec"; 
const URL_BACKEND_BASH = "http://localhost:8585";
// =============================================

const coloresCategorias = {
    todos: "linear-gradient(135deg, #7300e6 0%, #a832ff 100%)",
    documentos: "linear-gradient(135deg, #1e3c72 0%, #2a52be 100%)", 
    videos: "linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)",      
    audio: "linear-gradient(135deg, #0b5345 0%, #117a65 100%)",       
    imagenes: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",    
    juegos: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",    
    otros: "linear-gradient(135deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%)",
    agregar: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"      
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
        document.getElementById("badge-juegos").textContent = datos.contadores.juegos;
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

    // --- NUEVO: FORMULARIO DINÁMICO PARA AGREGAR ARCHIVOS ---
    if (categoriaActual === "agregar") {
        // Tomamos el usuario actual para mostrar quién está subiendo el archivo
        const usuarioActual = localStorage.getItem("sesion-usuario") || "Invitado";

        contenedor.innerHTML = `
            <div class="upload-container">
                <div class="upload-header">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    <h3>Subir Nuevo Archivo</h3>
                    <p>El archivo se asociará a tu cuenta: <strong>${usuarioActual}</strong></p>
                </div>
                <form id="form-agregar-archivo">
                    <div class="upload-group">
                        <label for="upload-name"><i class="fa-solid fa-file-signature"></i> Nombre del Archivo</label>
                        <input type="text" id="upload-name" placeholder="Ej. Álgebra Lineal - Cap 1" required>
                    </div>

                    <div class="upload-group">
                        <label for="upload-category"><i class="fa-solid fa-tags"></i> Categoría</label>
                        <select id="upload-category" required>
                            <option value="" disabled selected>Selecciona una categoría...</option>
                            <option value="documentos">Documentos</option>
                            <option value="videos">Videos</option>
                            <option value="audio">Audio</option>
                            <option value="imagenes">Imágenes</option>
                            <option value="juegos">Juegos</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>

                    <div class="upload-group">
                        <label for="upload-file" class="file-label">
                            <i class="fa-solid fa-folder-open"></i> Seleccionar Archivo
                        </label>
                        <input type="file" id="upload-file" required>
                        <div id="file-name-preview" class="file-preview">Ningún archivo seleccionado</div>
                    </div>

                    <button type="submit" class="btn-upload-submit">
                        <i class="fa-solid fa-paper-plane"></i> Subir a la Biblioteca
                    </button>
                </form>
            </div>
        `;

        // Listener para mostrar el nombre del archivo seleccionado en tiempo real
        document.getElementById("upload-file").addEventListener("change", (e) => {
            const fileName = e.target.files[0] ? e.target.files[0].name : "Ningún archivo seleccionado";
            document.getElementById("file-name-preview").textContent = fileName;
        });

        // Listener para controlar el envío del formulario (Por ahora solo frena la recarga)
        document.getElementById("form-agregar-archivo").addEventListener("submit", (e) => {
            e.preventDefault();
            alert("¡Estructura lista! En el siguiente paso conectaremos el envío a Google Drive.");
        });

        return;
    }
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

// CORRECCIÓN DEL MODO OSCURO (INTERCAMBIO REPARADO)
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

// Envío seguro de credenciales a tu servidor en Bash
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
                // 1. Guardamos los datos en la memoria del navegador
                localStorage.setItem("sesion-usuario", resultado.usuario);
                localStorage.setItem("sesion-rol", resultado.rol); 
                
                // 2. CAMBIO: Quitamos el alert de bienvenida y cerramos el modal directamente
                document.getElementById("login-modal").style.display = "none";
                
                // 3. CAMBIO: Actualizamos la interfaz para mostrar el nombre del usuario de inmediato
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
        dropdown.style.display = "none"; // Se asegura de ocultar el menú si no hay usuario
    }
}

// Algoritmo de Restricción de Módulos
function aplicarRestriccionesDeModulo() {
    const botonesCategorias = document.querySelectorAll(".btn-category");
    
    botonesCategorias.forEach(boton => {
        // Forzamos a que todos los botones se muestren siempre en formato flex
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

    // INTERRUPTOR INTELIGENTE: Si hay usuario abre/cierra el menú flotante, si no, abre el login
    btnAbrirLogin.addEventListener("click", (e) => {
        e.stopPropagation(); // Evita que se cierre inmediatamente
        const usuarioLogueado = localStorage.getItem("sesion-usuario");
        if (usuarioLogueado) {
            dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
        } else {
            loginModal.style.display = "flex";
        }
    });

    // ACCIÓN DE CERRAR SESIÓN
    btnCerrarSesion.addEventListener("click", (e) => {
        e.preventDefault();
        // Borramos los datos guardados en el navegador
        localStorage.removeItem("sesion-usuario");
        localStorage.removeItem("sesion-rol");
        
        // Reiniciamos la interfaz
        dropdown.style.display = "none";
        actualizarBotonUsuario();
        aplicarRestriccionesDeModulo();
        
        // Opcional: Recargar la pestaña "todos" por si estaba en una pestaña restringida
        document.querySelector('[data-category="todos"]').click();
        alert("Sesión cerrada correctamente.");
    });

    // Cerrar el menú flotante si el usuario hace clic en cualquier otra parte de la pantalla
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

    // Captura del Formulario de Login
    loginModal.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const inputs = loginModal.querySelectorAll("input");
        ejecutarAutenticacion({
            accion: "login",
            usuario: inputs[0].value.trim(),
            password: inputs[1].value
        });
    });

    // Captura del Formulario de Registro
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