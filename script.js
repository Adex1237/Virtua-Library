// Pega aquí la URL que copiaste de la imagen image_f58f1f.png
const URL_API = "https://script.google.com/macros/s/AKfycbw0rOJmUCvbT7ZJqZuvqI82J05x6B2lBC3I9Bz0_zgIyVe7YgpoeODq3zrAWNEnqyb6ZA/exec";

async function actualizarContadores() {
  try {
    const respuesta = await fetch(URL_API);
    const datos = await respuesta.json();

    // Actualizamos los elementos <span> de tu HTML con los datos reales
    // Asegúrate de que los nombres dentro de los paréntesis sean iguales a tus IDs del HTML
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

// Esto ejecuta la función automáticamente apenas se cargue la página
document.addEventListener("DOMContentLoaded", actualizarContadores);