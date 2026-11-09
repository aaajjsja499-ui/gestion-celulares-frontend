# Guía de puesta en marcha - Sistema v4 (desde el teléfono)

Versión: 1.0
Fecha: 9 de Noviembre de 2026 - 07:46 (UTC-4)
Estado: LISTA PARA USAR - el sistema nuevo no toca el sistema en uso (rama nuevo-sistema-v4)

## Antes de empezar
- Abrí Google Drive y Chrome en el teléfono con la cuenta pmv146si@gmail.com. El editor de Apps Script anda mejor con "Sitio para computadora" activado en Chrome.
- Archivos que necesitás (te los mando en el chat): `Codigo.gs` (todo el backend en un solo archivo) y `GESTION_CELULARES_Frontend_v4.zip`.

## Parte 1 - Base de datos y backend (10 minutos)
1. En Google Sheets creá una hoja nueva vacía y llamala "Sistema NT v4".
2. Menú Extensiones > Apps Script.
3. Borrá todo lo que haya en `Código.gs` y pegá el contenido completo de `Codigo.gs`. Guardá (ícono de disquete).
4. En la barra superior elegí la función `prepararSistema` y tocá Ejecutar. Aceptá los permisos (Revisar permisos > tu cuenta > Avanzado > Ir a proyecto > Permitir). Debe terminar sin error: crea todas las pestañas y la configuración.
5. Buscá en el código la función `crearAdministradorInicial` (casi al final, en la parte `Setup.gs`). Cambiá `CORREO_AQUI@gmail.com` por tu correo, y `'0000'` por el PIN que quieras (4 a 8 dígitos). Guardá, elegí `crearAdministradorInicial` y Ejecutar. Después volvé a poner el PIN en `0000` y guardá (para que no quede escrito).
6. Implementar > Nueva implementación > tipo "Aplicación web": Ejecutar como **Yo**, Quién tiene acceso **Cualquier persona**. Implementar y copiá la URL (termina en `/exec`).

## Parte 2 - Frontend
1. Abrí `GESTION_CELULARES_Frontend_v4.zip` en SPCK. En `config.js` reemplazá `PENDIENTE` por la URL del paso anterior.
2. Probá en el host local de SPCK: entrá con tu correo y PIN. Si ves el Inicio, está conectado.
3. NO se publica ni se cambia el `config.js` del sistema en uso hasta que vos lo apruebes expresamente.

## Parte 3 - Verificación en vivo (antes de usarlo con el negocio)
Hacé estos 8 pasos con datos de prueba y avisame el resultado:
1. Más > Configuración: revisar medios de pago y saldo inicial de caja.
2. Más > Usuarios: crear un segundo Administrador (necesario para aprobar tarifas del técnico) y un Técnico.
3. Taller > Catálogo de trabajos: crear un trabajo (ej. "Cambio de pantalla" 50.000).
4. Equipos > Nueva compra: comprar un teléfono de prueba y llevarlo hasta "Publicado para vender".
5. Hacer una reparación: iniciar, completar (técnico), aprobar con el otro Administrador.
6. Vender al contado y probar una venta a crédito con cliente de ficha completa.
7. Dinero: ver caja, registrar un gasto, un traslado entre medios.
8. Más > Verificar cuentas: debe decir "Todo cuadra".

## Si algo falla
- "Sistema ocupado": esperá unos segundos y reintentá.
- Una operación cortada queda en Más > Operaciones pendientes: tocá Reanudar.
- No borres pestañas del Sheet a mano.
