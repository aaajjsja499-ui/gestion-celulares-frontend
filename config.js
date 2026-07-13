// GESTION_CELULARES - config.js
// Unica fuente de parametros de entorno. No contiene secretos:
// la seguridad real vive en la verificacion de identidad del
// servidor (Diseno Tecnico, Seccion 6.1), no en ocultar esta URL.
//
// Reemplazar los dos valores de abajo despues de:
//   1. Desplegar el proyecto de Apps Script como Web App
//      (Diseno Tecnico Seccion 6.1) y copiar la URL de despliegue.
//   2. Crear las credenciales OAuth de Google Identity Services
//      en Google Cloud Console y copiar el Client ID.

const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzTNcxcc0QPqHdEem6-TXf18_brAFE9owF0cXdjjg1nAb7ocy4CsHzBds69wM3u627L8g/exec",
  GOOGLE_CLIENT_ID: "816925529734-df8igd0sg1ijr20tgiaohh7mpj9bcqeg.apps.googleusercontent.com",
  NOMBRE_SISTEMA: "Sistema de Gestion de Celulares",
  MONEDA: "PYG",
};
