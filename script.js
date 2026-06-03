// REEMPLAZA CON TU NUEVA URL DE IMPLEMENTACIÓN DE APPS SCRIPT
const URL_API = "https://script.google.com/macros/s/AKfycbziXvFsUOWxO0luoU1YEx86qOV9KIrr7rW4PmIptemO6uvs2RgaihdSZBqMaCE9DCI25g/exec";

const coloresCategorias = {
    
    todos: "linear-gradient(135deg, #a832ff 0%, #3b52ff 100%)",
    documentos: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", 
    videos: "linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)",     
    audio: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",     
    imagenes: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",  
    juegos: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",    
    otros: "linear-gradient(135deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%)" 
};

let baseDeDatosArchivos = [];
let categoriaActual = "todos";
let textoBusquedaActual = "";

// Carga la información desde tu Google Apps Script
async function cargarDatosDesdeDrive() {
    const contenedor = document.getElementById("content");
    contenedor.innerHTML = "<p style='color: #777; padding: 20px; grid-column: 1/-1; text-align: center;'>Conectando con Google Drive...</p>";

    try {
        const respuesta = await fetch(URL_API);
        const datos = await respuesta.json();

        // Guardamos los archivos globales devueltos por el script
        baseDeDatosArchivos = datos.archivos;

        // Actualizamos las burbujas (badges) usando la nueva estructura de contadores
        document.getElementById("badge-todos").textContent = datos.contadores.todos;
        document.getElementById("badge-documentos").textContent = datos.contadores.documentos;
        document.getElementById("badge-videos").textContent = datos.contadores.videos;
        document.getElementById("badge-audio").textContent = datos.contadores.audio;
        document.getElementById("badge-imagenes").textContent = datos.contadores.imagenes;
        document.getElementById("badge-juegos").textContent = datos.contadores.juegos;
        document.getElementById("badge-otros").textContent = datos.contadores.otros;

        // Pintamos las tarjetas
        renderizarTarjetas();

    } catch (error) {
        console.error("Error al conectar con la API de Drive:", error);
        contenedor.innerHTML = "<p style='color: red; padding: 20px; grid-column: 1/-1; text-align: center;'>Error al cargar los archivos de Google Drive.</p>";
    }
}

// Renderiza dinámicamente el contenido filtrado en pantalla
function renderizarTarjetas() {
    const contenedor = document.getElementById("content");
    contenedor.innerHTML = ""; 

    // Filtrado en vivo según categoría y barra de búsqueda
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

        const urlPreview = `https://drive.google.com/file/d/${archivo.id}/preview`;
        let elementoVisual = `<iframe src="${urlPreview}" allow="autoplay" scrolling="no"></iframe>`;
        
        // Optimización visual si el archivo es una imagen
        if (archivo.categoria === "imagenes") {
            const urlImagen = `https://drive.google.com/uc?export=view&id=${archivo.id}`;
            elementoVisual = `<img src="${urlImagen}" alt="${archivo.nombre}" style="width:100%; height:180px; object-fit:cover; border-radius:16px 16px 0 0;">`;
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

// Inicializa clicks de categorías
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

// Inicializa barra de búsqueda en tiempo real
function inicializarBusqueda() {
    const inputBusqueda = document.querySelector("#search-container input");
    inputBusqueda.addEventListener("input", (evento) => {
        textoBusquedaActual = evento.target.value;
        renderizarTarjetas();
    });
}

// Inicializa Modo Oscuro persistente
function inicializarModoOscuro() {
    const botonToggle = document.getElementById("dark-mode-toggle");
    const iconoBoton = botonToggle.querySelector("i");
    const cuerpo = document.body;

    const modoOscuroGuardado = localStorage.getItem("modo-oscuro");
    if (modoOscuroGuardado === "activado") {
        cuerpo.classList.add("dark-mode");
        iconoBoton.classList.replace("fa-moon", "fa-sun");
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

// Arranca todo cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosDesdeDrive();
    inicializarFiltros();
    inicializarBusqueda();
    inicializarModoOscuro();
});

// Carga Video.js en la ventana global
let player = null; 

function renderizarTarjetas() {
    const contenedor = document.getElementById("content");
    contenedor.innerHTML = ""; 

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
        card.style.cursor = "pointer"; // Indica que es clickeable

        let elementoVisual = "";
        
        if (archivo.categoria === "imagenes") {
            const urlImagen = `https://drive.google.com/uc?export=view&id=${archivo.id}`;
            elementoVisual = `<img src="${urlImagen}" alt="${archivo.nombre}" style="width:100%; height:180px; object-fit:cover; border-radius:16px 16px 0 0;">`;
        } else if (archivo.categoria === "videos") {
            // Miniatura elegante para el video en vez de cargar el iframe pesado
            elementoVisual = `
                <div style="width:100%; height:180px; background:#1e1e1e; display:flex; align-items:center; justify-content:center; border-radius:16px 16px 0 0; position:relative;">
                    <i class="fa-solid fa-circle-play" style="font-size: 50px; color: #ff4b2b; z-index:2;"></i>
                    <div style="position:absolute; width:100%; height:100%; background: linear-gradient(transparent, rgba(0,0,0,0.7));"></div>
                </div>`;
        } else {
            // El resto de archivos (Documentos, audios, etc.) pueden seguir usando el preview por ahora
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

        // Evento para abrir el reproductor flotante si es un video
        if (archivo.categoria === "videos") {
            card.addEventListener("click", () => abrirReproductorVideo(archivo.id, archivo.nombre));
        }

        contenedor.appendChild(card);
    });
}

// Función para controlar la ventana flotante y Video.js
function abrirReproductorVideo(idArchivo, nombreVideo) {
    const modal = document.getElementById("video-modal");
    const container = modal.querySelector(".video-container");
    
    // En vez de etiqueta <video>, metemos el iframe de Drive con la interfaz limpia
    // Usamos /preview para que Drive ponga sus propios controles responsivos
    container.innerHTML = `
        <iframe src="https://drive.google.com/file/d/${idArchivo}/preview" 
                style="width:100%; height:100%; border:none;" 
                allow="autoplay; encrypted-media" 
                allowfullscreen>
        </iframe>
    `;

    // Mostramos el modal
    modal.style.display = "flex";
}

// Cerrar el Modal de manera limpia
function inicializarEventosModal() {
    const modal = document.getElementById("video-modal");
    const botonCerrar = modal.querySelector(".close-modal");

    const cerrar = () => {
        modal.style.display = "none";
        if (player) {
            player.pause(); // Pausa el video al cerrar
        }
    };

    botonCerrar.addEventListener("click", cerrar);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) cerrar();
    });
}

// No olvides añadir `inicializarEventosModal()` dentro de tu Listener 'DOMContentLoaded' al final del archivo script.js

// Arranca todo cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosDesdeDrive();
    inicializarFiltros();
    inicializarBusqueda();
    inicializarModoOscuro();
    inicializarEventosModal(); // <--- ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ AQUÍ
});