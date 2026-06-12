// ====== CONFIGURACIÓN DE APIS SEPARADAS ======
const URL_API_ARCHIVOS = "https://script.google.com/macros/s/AKfycbyU1_OX6GhnXGVD3U85pVF6WACZOobQzeO1JKlSuhoWn1PbHKxjZgz9immhkqHHwYKMzA/exec"; 
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
    if (!contenedor) return;
    contenedor.innerHTML = "<p style='color: #777; padding: 20px; grid-column: 1/-1; text-align: center;'>Conectando con Google Drive...</p>";

    try {
        const respuesta = await fetch(URL_API_ARCHIVOS); 
        const datos = await respuesta.json();

        baseDeDatosArchivos = datos.archivos;

        // Actualizar contadores en la interfaz (Omitiendo juegos)
        if(document.getElementById("badge-todos")) document.getElementById("badge-todos").textContent = datos.contadores.todos;
        if(document.getElementById("badge-documentos")) document.getElementById("badge-documentos").textContent = datos.contadores.documentos;
        if(document.getElementById("badge-videos")) document.getElementById("badge-videos").textContent = datos.contadores.videos;
        if(document.getElementById("badge-audio")) document.getElementById("badge-audio").textContent = datos.contadores.audio;
        if(document.getElementById("badge-imagenes")) document.getElementById("badge-imagenes").textContent = datos.contadores.imagenes;
        if(document.getElementById("badge-otros")) document.getElementById("badge-otros").textContent = datos.contadores.otros;

        renderizarTarjetas();

    } catch (error) {
        console.error("Error al conectar con la API de Drive:", error);
        contenedor.innerHTML = "<p style='color: red; padding: 20px; grid-column: 1/-1; text-align: center;'>Error al cargar los archivos de Google Drive.</p>";
    }
}

function renderizarTarjetas() {
    const contenedor = document.getElementById("content");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    
    const sesionUsuario = localStorage.getItem("sesion-usuario");
    const usuarioLogueado = sesionUsuario || "Invitado";

    // === VISTA: MIS ARCHIVOS ===
    if (categoriaActual === "mis-archivos") {
        if (!sesionUsuario) {
            contenedor.innerHTML = `
                <div class="manager-container compact-view" style="text-align: center; padding: 40px 20px; width: 100%; grid-column: 1/-1;">
                    <div class="upload-form-card" style="max-width: 500px; margin: 0 auto; background: #1e1e1e; padding: 30px; border-radius: 16px;">
                        <i class="fa-solid fa-folder-lock" style="font-size: 50px; color: #3b52ff; margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 10px; color: #fff;">Acceso Restringido</h3>
                        <p style="color: #aaa; margin-bottom: 20px; font-size: 14px;">Inicia sesión para ver tus archivos personales guardados en la nube.</p>
                        <button class="btn-upload-submit" onclick="document.getElementById('login-modal').style.display = 'flex'" style="background: linear-gradient(135deg, #3b52ff 0%, #2193b0 100%); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">
                            <i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
                        </button>
                    </div>
                </div>
            `;
            return;
        }

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
            <div class="manager-container" style="width: 100%; grid-column: 1/-1;">
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
        if (!sesionUsuario) {
            contenedor.innerHTML = `
                <div class="manager-container compact-view" style="text-align: center; padding: 40px 20px; width: 100%; grid-column: 1/-1;">
                    <div class="upload-form-card" style="max-width: 500px; margin: 0 auto; background: #1e1e1e; padding: 30px; border-radius: 16px;">
                        <i class="fa-solid fa-cloud-lock" style="font-size: 50px; color: #11998e; margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 10px; color: #fff;">¿Quieres subir contenido?</h3>
                        <p style="color: #aaa; margin-bottom: 20px; font-size: 14px;">Inicia sesión para agregar archivos a la biblioteca y gestionar tu propio contenido.</p>
                        <button class="btn-upload-submit" onclick="document.getElementById('login-modal').style.display = 'flex'" style="background: linear-gradient(135deg, #11998e 0%, #1ee596 100%); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">
                            <i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = `
            <div class="manager-container compact-view" style="width: 100%; grid-column: 1/-1;">
                <div class="upload-form-card">
                    <h3><i class="fa-solid fa-cloud-arrow-up"></i> Agregar Nuevo Archivo</h3>
                    <form id="form-subir-archivo">
                        <div class="form-group">
                            <label>Nombre del Archivo</label>
                            <input type="text" id="upload-name" placeholder="Escribe el título..." required>
                        </div>
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="upload-category" required>
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
                            <input type="file" id="simple-file" style="display:none;" required>
                            <span id="simple-file-text" class="file-status-text">Ningún archivo seleccionado</span>
                        </div>
                        <button type="submit" class="btn-upload-submit" id="btn-submit-upload">
                            <i class="fa-solid fa-arrow-up-from-bracket"></i> Subir Archivo Real
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById("simple-file").addEventListener("change", function() {
            if (this.files[0]) {
                document.getElementById('simple-file-text').textContent = this.files[0].name;
                if(!document.getElementById("upload-name").value) {
                    document.getElementById("upload-name").value = this.files[0].name.split('.').slice(0, -1).join('.');
                }
            }
        });

        document.getElementById("form-subir-archivo").addEventListener("submit", procesarSubidaArchivoReal);
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
        let accionClick = ""; // Nueva variable para controlar el click limpio
        
        if (archivo.categoria === "imagenes") {
            const urlPreviewImagen = `https://drive.google.com/file/d/${archivo.id}/preview`;
            elementoVisual = `
                <div style="width:100%; height:180px; position:relative; overflow:hidden; border-radius:16px 16px 0 0;">
                    <iframe src="${urlPreviewImagen}" scrolling="no" style="width:100%; height:100%; border:none; pointer-events: none;"></iframe>
                    <div style="position:absolute; top:0; left:0; width:100%; height:100%; background:transparent;"></div>
                </div>`;
            accionClick = `abrirVisorImagen('${archivo.id}', '${archivo.nombre.replace(/'/g, "\\'")}')`;
        } else if (archivo.categoria === "videos") {
            elementoVisual = `
                <div style="width:100%; height:180px; background:#1e1e1e; display:flex; align-items:center; justify-content:center; border-radius:16px 16px 0 0; position:relative;">
                    <i class="fa-solid fa-circle-play" style="font-size: 50px; color: #ff4b2b; z-index:2;"></i>
                    <div style="position:absolute; width:100%; height:100%; background: linear-gradient(transparent, rgba(0,0,0,0.7)); border-radius:16px 16px 0 0;"></div>
                </div>`;
            accionClick = `abrirReproductorVideo('${archivo.id}', '${archivo.nombre.replace(/'/g, "\\'")}')`;
        } else if (archivo.categoria === "audio") {
            elementoVisual = `
                <div style="width:100%; height:180px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); display:flex; align-items:center; justify-content:center; border-radius:16px 16px 0 0; position:relative;">
                    <i class="fa-solid fa-file-audio" style="font-size: 55px; color: white; z-index:2; filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.2));"></i>
                </div>`;
            accionClick = `abrirReproductorAudio('${archivo.id}', '${archivo.nombre.replace(/'/g, "\\'")}')`;
        } else {
            const urlPreview = `https://drive.google.com/file/d/${archivo.id}/preview`;
            elementoVisual = `<iframe src="${urlPreview}" scrolling="no"></iframe>`;
        }

        // Asignamos la acción directamente a la tarjeta
        if (accionClick) {
            card.setAttribute("onclick", accionClick);
        }

        card.innerHTML = `
            ${elementoVisual}
            <div class="video-info">
                <h4>${archivo.nombre}</h4>
                <p>${archivo.categoria.toUpperCase()} • ${archivo.tamano}</p>
            </div>
        `;

        contenedor.appendChild(card);
    });
}

function abrirReproductorAudio(idArchivo, nombreAudio) {
    const modal = document.getElementById("video-modal");
    if (!modal) {
        console.error("No se encontró el elemento 'video-modal' en el HTML.");
        return;
    }
    const container = modal.querySelector(".video-container");
    if (!container) {
        console.error("No se encontró el elemento '.video-container' dentro del modal.");
        return;
    }
    
    // Insertamos el iframe de previsualización de Drive para el audio
    container.innerHTML = `<iframe src="https://drive.google.com/file/d/${idArchivo}/preview" style="width:100%; height:100%; border:none;" allow="autoplay"></iframe>`;
    modal.style.display = "flex";
}

function procesarSubidaArchivoReal(evento) {
    evento.preventDefault();
    
    const boton = document.getElementById("btn-submit-upload");
    const inputArchivo = document.getElementById("simple-file");
    const nombreInput = document.getElementById("upload-name").value.trim();
    const categoriaInput = document.getElementById("upload-category").value;
    
    if (!inputArchivo.files || inputArchivo.files.length === 0) {
        alert("Por favor, selecciona un archivo primero.");
        return;
    }
    
    const archivo = inputArchivo.files[0];
    
    // Bloquear botón y mostrar spinner de carga
    boton.disabled = true;
    boton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Subiendo archivo...`;
    
    const lector = new FileReader();
    // Leemos el archivo como DataURL para extraer el Base64 limpio
    lector.readAsDataURL(archivo);
    
    lector.onload = async () => {
        try {
            const cadenaBase64 = lector.result.split(",")[1];
            const propietarioActivo = localStorage.getItem("sesion-usuario") || "Administrador";
            
            // Reconstruimos el nombre con su extensión real (.pdf, .jpg, etc.)
            const extension = archivo.name.includes('.') ? archivo.name.substring(archivo.name.lastIndexOf('.')) : '';
            const nombreCompleto = nombreInput + extension;

            // Pasamos las variables de texto en la URL para que Google Apps Script las reciba en e.parameter
            const urlConParametros = `${URL_API_ARCHIVOS}?nombreArchivo=${encodeURIComponent(nombreCompleto)}&categoria=${categoriaInput}&tipoMime=${encodeURIComponent(archivo.type)}&propietario=${encodeURIComponent(propietarioActivo)}`;
            
            // Enviamos únicamente el texto del archivo en el cuerpo (text/plain) para evitar conflictos de CORS
            const respuesta = await fetch(urlConParametros, {
                method: "POST",
                mode: "no-cors", // Evita que el navegador bloquee la petición por seguridad de dominios
                headers: {
                    "Content-Type": "text/plain"
                },
                body: cadenaBase64
            });
            
            // Al usar "no-cors", el navegador oculta la respuesta por privacidad. 
            // Añadimos una espera de 3.5 segundos para dar tiempo a que Google registre el archivo e indexe el ID en Drive.
            setTimeout(async () => {
                alert("¡Archivo enviado con éxito! Se ha registrado en tu biblioteca virtual.");
                await cargarDatosDesdeDrive(); // Recarga la lista de tarjetas
                
                // Redirecciona automáticamente a la pestaña "Todos"
                const btnTodos = document.querySelector('[data-category="todos"]');
                if (btnTodos) btnTodos.click();
            }, 3500);

        } catch (error) {
            console.error("Error en la subida:", error);
            alert("Hubo un problema de comunicación al intentar enviar el archivo.");
            boton.disabled = false;
            boton.innerHTML = `<i class="fa-solid fa-arrow-up-from-bracket"></i> Subir Archivo Real`;
        }
    };
}

function abrirVisorImagen(idArchivo, nombreImagen) {
    const modal = document.getElementById("video-modal");
    const container = modal.querySelector(".video-container");
    container.innerHTML = `<iframe src="https://drive.google.com/file/d/${idArchivo}/preview" style="width:100%; height:100%; border:none;" allow="autoplay"></iframe>`;
    modal.style.display = "flex";
}

function abrirReproductorVideo(idArchivo, nombreVideo) {
    const modal = document.getElementById("video-modal");
    const container = modal.querySelector(".video-container");
    container.innerHTML = `<iframe src="https://drive.google.com/file/d/${idArchivo}/preview" style="width:100%; height:100%; border:none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.style.display = "flex";
}

function inicializarEventosModal() {
    const modal = document.getElementById("video-modal");
    if (!modal) return;
    const botonCerrar = modal.querySelector(".close-modal");

    const cerrar = () => {
        modal.style.display = "none";
        modal.querySelector(".video-container").innerHTML = ""; 
    };

    if(botonCerrar) botonCerrar.addEventListener("click", cerrar);
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

            if (coloresCategorias[categoriaActual] && header) {
                header.style.background = coloresCategorias[categoriaActual];
                document.documentElement.style.setProperty('--color-activo', coloresCategorias[categoriaActual]);
            }

            renderizarTarjetas();
        });
    });
}

function inicializarBusqueda() {
    const inputBusqueda = document.querySelector("#search-container input");
    if (!inputBusqueda) return;
    inputBusqueda.addEventListener("input", (evento) => {
        textoBusquedaActual = evento.target.value;
        renderizarTarjetas();
    });
}

function inicializarModoOscuro() {
    const botonToggle = document.getElementById("dark-mode-toggle");
    if (!botonToggle) return;
    const iconoBoton = botonToggle.querySelector("i");
    const cuerpo = document.body;

    const modoOscuroGuardado = localStorage.getItem("modo-oscuro");
    
    if (modoOscuroGuardado === "activado") {
        cuerpo.classList.add("dark-mode");
        if(iconoBoton) iconoBoton.classList.replace("fa-moon", "fa-sun");
    } else {
        cuerpo.classList.remove("dark-mode");
        if(iconoBoton) iconoBoton.classList.replace("fa-sun", "fa-moon");
    }

    botonToggle.addEventListener("click", () => {
        cuerpo.classList.toggle("dark-mode");
        if (cuerpo.classList.contains("dark-mode")) {
            if(iconoBoton) iconoBoton.classList.replace("fa-moon", "fa-sun");
            localStorage.setItem("modo-oscuro", "activado");
        } else {
            if(iconoBoton) iconoBoton.classList.replace("fa-sun", "fa-moon");
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
                
                if(document.getElementById("login-modal")) document.getElementById("login-modal").style.display = "none";
                
                actualizarBotonUsuario();
                aplicarRestriccionesDeModulo();
                renderizarTarjetas();
            } else {
                alert("¡Registro exitoso! Ya puedes iniciar sesión.");
                if(document.getElementById("register-modal")) document.getElementById("register-modal").style.display = "none";
                if(document.getElementById("login-modal")) document.getElementById("login-modal").style.display = "flex";
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
    if (!botonAuth) return;
    
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
        if(dropdown) dropdown.style.display = "none";
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

    if(btnAbrirLogin) {
        btnAbrirLogin.addEventListener("click", (e) => {
            e.stopPropagation();
            const usuarioLogueado = localStorage.getItem("sesion-usuario");
            if (usuarioLogueado && dropdown) {
                dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
            } else if(loginModal) {
                loginModal.style.display = "flex";
            }
        });
    }

    if(btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("sesion-usuario");
            localStorage.removeItem("sesion-rol");
            
            if(dropdown) dropdown.style.display = "none";
            actualizarBotonUsuario();
            aplicarRestriccionesDeModulo();
            
            const btnTodos = document.querySelector('[data-category="todos"]');
            if(btnTodos) btnTodos.click();
            alert("Sesión cerrada correctamente.");
        });
    }

    window.addEventListener("click", () => {
        if(dropdown) dropdown.style.display = "none";
    });

    if(btnCerrarLogin && loginModal) btnCerrarLogin.addEventListener("click", () => loginModal.style.display = "none");
    if(btnCerrarRegister && registerModal) btnCerrarRegister.addEventListener("click", () => registerModal.style.display = "none");

    if(linkARegistro && loginModal && registerModal) {
        linkARegistro.addEventListener("click", (e) => {
            e.preventDefault(); loginModal.style.display = "none"; registerModal.style.display = "flex";
        });
    }
    if(linkALogin && registerModal && loginModal) {
        linkALogin.addEventListener("click", (e) => {
            e.preventDefault(); registerModal.style.display = "none"; loginModal.style.display = "flex";
        });
    }

    if(loginModal) {
        loginModal.querySelector("form").addEventListener("submit", (e) => {
            e.preventDefault();
            const inputs = loginModal.querySelectorAll("input");
            ejecutarAutenticacion({
                accion: "login",
                usuario: inputs[0].value.trim(),
                password: inputs[1].value
            });
        });
    }

    if(registerModal) {
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
    }

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