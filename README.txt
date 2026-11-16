MY HABITS — aplicación web progresiva gratuita

CONTENIDO
- index.html: estructura de la app
- styles.css: diseño oscuro y adaptable
- app.js: hábitos, calendario, estadísticas y objetivos
- manifest.webmanifest: configuración instalable
- sw.js: caché para uso sin conexión
- icons/: iconos de la aplicación

IMPORTANTE
Los datos se guardan localmente en el navegador mediante localStorage.
No borres los datos del sitio ni el almacenamiento de Safari si quieres conservarlos.
La PWA no crea widgets nativos de iOS. Para eso haría falta una app nativa complementaria con WidgetKit.

PARA PROBAR EN WINDOWS
La app necesita servirse desde localhost o HTTPS para que el modo PWA y el service worker funcionen.
Una forma sencilla es usar VS Code con la extensión Live Server y abrir index.html con Live Server.

PARA PUBLICAR GRATIS
Puedes subir estos archivos a un repositorio GitHub y activar GitHub Pages desde Settings > Pages.
Después abre la URL HTTPS desde Safari en el iPhone y elige Compartir > Añadir a pantalla de inicio.

SINCRONIZACIÓN CON SUPABASE Y SCRIPTABLE
- supabase-config.js: Project URL y Publishable key (solo sb_publishable_).
- scriptable/MY_HABITS_Widget.js: script para el widget mediano de iPhone.
- CONFIGURACION-SINCRONIZACION.txt: guía de instalación.
- SUPABASE-RLS.sql: SQL de referencia para tabla y políticas (no ejecutar de nuevo si ya existen).
La aplicación conserva localStorage y sincroniza a Supabase cuando hay sesión iniciada.
