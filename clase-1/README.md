# Clase 1 · Introducción al pensamiento

Abrir `index.html` en Edge, Chrome o Firefox. No necesita servidor, instalación ni conexión a internet. Mantener `style.css`, `presentation.js` y `assets/` junto al HTML.

## Presentar

- Flechas izquierda y derecha: cambiar de diapositiva.
- `I`: índice para saltar a cualquier tema.
- `N`: notas docentes de la diapositiva actual. El panel se ve en la misma pantalla, por lo que conviene consultarlo antes de proyectar.
- `F`: pantalla completa. También se puede usar `F11` del navegador.
- `Inicio` / `Fin`: primera y última diapositiva.
- `Esc`: cerrar un panel.
- En el celular, usar los botones o deslizar horizontalmente; el contenido se adapta para lectura vertical.

La dirección conserva la diapositiva actual, por ejemplo `index.html#slide-14`.

## Editar

El contenido está escrito directamente en las secciones `<section class="slide">` de `index.html`. Las notas están en `<aside class="speaker-notes" hidden>`. Los colores, tamaños y composiciones se editan en `style.css`. `presentation.js` maneja la navegación y añade el pie institucional. Los atributos `data-source` conservan la procedencia como metadatos y no se muestran en las diapositivas.

La presentación toma el recorrido de `2025 Clase_01 introducción.pdf`, de Mg. Carolina Cárdenas Poveda, y lo complementa con la planificación del curso y la bibliografía obligatoria. Conserva el logo y una selección de las imágenes del PDF. La paleta actual combina azul profundo, verde petróleo y dorado sobre fondos claros. Los colores se configuran en las variables del inicio de `style.css`. Se ajustaron formulaciones sobre validez deductiva, Wundt, modelos mentales y teoría de las perspectivas; las notas explican estos cambios.

Los enlaces de la última diapositiva apuntan a los PDF de la carpeta superior. Para compartir la presentación por separado, incluir también esos PDF o adaptar los enlaces. Los créditos de las imágenes identifican el PDF aportado como procedencia; el material original no detalla todas sus fuentes.

## Imprimir

Usar la impresión del navegador, con orientación horizontal y gráficos de fondo activados. El CSS de impresión muestra todas las diapositivas sin controles ni notas docentes.

## Descargar y publicar

El botón **Descargar PDF** guarda `clase-1-diapositivas.pdf`, con una diapositiva por página y sin notas docentes. Para que funcione online, subir ese PDF junto con `index.html`, `style.css`, `presentation.js` y `assets/`, manteniendo la misma estructura de carpetas.

Si cambia el contenido de la clase, volver a generar el PDF con la impresión del navegador (guardar como PDF, sin encabezados ni pies del navegador, con gráficos de fondo y el tamaño de página definido por el CSS) y reemplazar el archivo publicado.
