# Sistema de Gestion de Celulares - Frontend

Fase 0 (Hoja de Ruta v1.1). Esqueleto tecnico: estructura de carpetas
congelada, login con Google, y prueba de conectividad leyendo Equipos
y Modelos desde Apps Script.

## Como abrir esto en SPCK

1. Descomprimir el .zip.
2. Abrir la carpeta en SPCK Editor como proyecto.
3. Usar el servidor local de SPCK para probar antes de subir nada a
   producción.

## Antes de que esto funcione, falta configurar

Este .zip es el esqueleto de codigo. Todavia faltan pasos manuales
que no se pueden empaquetar en un .zip:

1. Crear el Google Sheets con las 15 hojas de Diseno Tecnico Seccion
   3.1 a 3.15.
2. Crear el proyecto de Apps Script, pegar el backend (entregado
   aparte, ver mas abajo), y desplegarlo como Web App.
3. Copiar la URL de ese despliegue en config.js
   (CONFIG.APPS_SCRIPT_URL).
4. Crear credenciales OAuth de Google Identity Services en Google
   Cloud Console, y copiar el Client ID en config.js
   (CONFIG.GOOGLE_CLIENT_ID).
5. Dar de alta tu propio email en la hoja Usuarios con rol
   Administrador y activo = Si - si no, el login te va a rechazar.
6. Subir esta carpeta a un repositorio privado de GitHub y activar
   GitHub Pages (o el hosting que prefieras).

## Estructura

```
index.html          Punto de entrada, arma el login y carga todo
config.js            Unico lugar con la URL de la API
css/                 Estilos, responsive real (PC y telefono igual)
js/core/              Login, llamadas a la API, cache, estado, router
js/calculos/           Los 4 motores (valoracion, viabilidad, etc.) -
                       vacios todavia, se completan fase a fase
js/pantallas/          Una pantalla, un archivo. La mayoria vacíos
                       todavia salvo dashboard.js (prueba de Fase 0)
```

Cada archivo vacío tiene un comentario indicando en qué fase de la
Hoja de Ruta se completa. No se agrega logica nueva a un archivo que
no le corresponde - un archivo, una responsabilidad (Diseno Tecnico,
Seccion 7.3).

## Backend (Apps Script)

El backend no va en este .zip porque no se edita en SPCK, se pega
directo en el editor de Apps Script (script.google.com). Se entrega
como un .zip aparte con los mismos criterios de modularidad.
