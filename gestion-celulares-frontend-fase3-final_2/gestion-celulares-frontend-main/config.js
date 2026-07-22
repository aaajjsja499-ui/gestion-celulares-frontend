// GESTION_CELULARES - config.js
// Unica fuente de parametros de entorno. No contiene secretos:
// la seguridad real vive en la verificacion de identidad del
// servidor (Diseno Tecnico, Seccion 6.1), no en ocultar esta URL.
//
// Reemplazar APPS_SCRIPT_URL despues de desplegar el proyecto de
// Apps Script como Web App (Diseno Tecnico Seccion 6.1) y copiar la
// URL de despliegue.

const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzTNcxcc0QPqHdEem6-TXf18_brAFE9owF0cXdjjg1nAb7ocy4CsHzBds69wM3u627L8g/exec",
  NOMBRE_SISTEMA: "Sistema de Gestion de Celulares",
  MONEDA: "PYG",
};
