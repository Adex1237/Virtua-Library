const URL_API = "https://script.google.com/macros/s/AKfycbw0rOJmUCvbT7ZJqZuvqI82J05x6B2lBC3I9Bz0_zgIyVe7YgpoeODq3zrAWNEnqyb6ZA/exec";

const coloresCategorias = {
    todos: "linear-gradient(135deg, #a832ff 0%, #3b52ff 100%)",
    documentos: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", 
    videos: "linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)",     
    audio: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",     
    imagenes: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",  
    juegos: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",    
    otros: "linear-gradient(135deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%)" 
};

// Variables globales para recordar qué tiene seleccionado el usuario actualmente
let categoriaActual = "todos";
let textoBusquedaActual = "";

async function actualizarContadores() {
  try {
    const respuesta = await fetch(URL_API);
    const datos = await respuesta.json();

    document.getElementById("badge-todos").textContent = datos.todos;
    document.getElementById("badge-documentos").textContent = datos.documentos;
    document.getElementById("badge-videos").textContent = datos.videos;
    document.getElementById("badge-audio").textContent = datos.audio;
    document.getElementById("badge-imagenes").textContent = datos.imagenes;
    document.getElementById("badge-juegos").textContent = datos.juegos;
    document.getElementById("badge-otros").textContent = datos.otros;

  } catch (error) {
    console.error("Error al conectar con la API de Drive:", error);
  }
}

// --- FUNCIÓN MAESTRA ENCARGADA DE MOSTRAR / OCULTAR TARJETAS ---
// Evalúa al mismo tiempo la categoría activa y lo que se escribió en el buscador
function aplicarFiltrosCombinados() {
    const tarjetas = document.querySelectorAll(".video-card");

    tarjetas.forEach(tarjeta => {
        const categoriaTarjeta = tarjeta.getAttribute("data-category");
        // Obtenemos el texto del h4 de la tarjeta, pasándolo a minúsculas para que no importen las mayúsculas
        const tituloTarjeta = tarjeta.querySelector(".video-info h4").textContent.toLowerCase();

        // Condición 1: ¿Satisface la categoría?
        const cumpleCategoria = (categoriaActual === "todos" || categoriaTarjeta === categoriaActual);
        
        // Condición 2: ¿El título incluye lo que escribió el usuario?
        const cumpleBusqueda = tituloTarjeta.includes(textoBusquedaActual.toLowerCase());

        // Si cumple ambas condiciones, se muestra; si no, se oculta
        if (cumpleCategoria && cumpleBusqueda) {
            tarjeta.style.display = "block";
        } else {
            tarjeta.style.display = "none";
        }
    });
}

// Controla los clics en los botones de categorías
function inicializarFiltros() {
    const botones = document.querySelectorAll(".btn-category");
    const header = document.getElementById("hero-header");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            categoriaActual = boton.getAttribute("data-category");

            // Cambiar estado activo visual del botón
            botones.forEach(b => b.classList.remove("active"));
            boton.classList.add("active");

            // Cambiar el color de fondo del buscador/header
            if (coloresCategorias[categoriaActual]) {
                header.style.background = coloresCategorias[categoriaActual];
                document.documentElement.style.setProperty('--color-activo', coloresCategorias[categoriaActual]);
            }

            // Ejecutar el filtro
            aplicarFiltrosCombinados();
        });
    });
}

// --- NUEVA FUNCIÓN: Escucha lo que el usuario escribe en la barra ---
function inicializarBusqueda() {
    // Buscamos el input que está dentro de #search-container
    const inputBusqueda = document.querySelector("#search-container input");

    // El evento 'input' se dispara inmediatamente cada vez que el usuario presiona una tecla, borra o pega texto
    inputBusqueda.addEventListener("input", (evento) => {
        textoBusquedaActual = evento.target.value; // Guardamos lo que se escribió
        
        // Ejecutar el filtro combinando la categoría y la nueva letra escrita
        aplicarFiltrosCombinados();
    });
}

// Ejecución al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
    actualizarContadores();
    inicializarFiltros();
    inicializarBusqueda(); // <--- Activamos la barra de búsqueda
});

// --- NUEVA FUNCIÓN: Control del Modo Oscuro ---
function inicializarModoOscuro() {
    const botonToggle = document.getElementById("dark-mode-toggle");
    const iconoBoton = botonToggle.querySelector("i");
    const cuerpo = document.body;

    // 1. Verificar si el usuario ya tenía el modo oscuro activado anteriormente
    const modoOscuroGuardado = localStorage.getItem("modo-oscuro");
    
    if (modoOscuroGuardado === "activado") {
        cuerpo.classList.add("dark-mode");
        iconoBoton.classList.replace("fa-moon", "fa-sun"); // Cambia a icono de sol
    }

    // 2. Escuchar el evento click para alternar el modo
    botonToggle.addEventListener("click", () => {
        cuerpo.classList.toggle("dark-mode");
        
        // Si el body ahora tiene la clase dark-mode
        if (cuerpo.classList.contains("dark-mode")) {
            iconoBoton.classList.replace("fa-moon", "fa-sun");
            localStorage.setItem("modo-oscuro", "activado"); // Guardar preferencia
        } else {
            iconoBoton.classList.replace("fa-sun", "fa-moon");
            localStorage.setItem("modo-oscuro", "desactivado"); // Guardar preferencia
        }
    });
}

// Modificamos el listener final para arrancar la nueva función
document.addEventListener("DOMContentLoaded", () => {
    actualizarContadores();
    inicializarFiltros();
    inicializarBusqueda();
    inicializarModoOscuro(); // <--- Activamos el modo oscuro aquí
});