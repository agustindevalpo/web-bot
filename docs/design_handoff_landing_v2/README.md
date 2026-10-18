# Handoff: Landing de WebBot (webbot.devalpo.cl), rediseño

## Overview
Rediseño de la landing comercial de WebBot (https://webbot.devalpo.cl/). **Mantiene todos los textos, precios y enlaces del sitio actual**; cambian la jerarquía visual, la composición, las animaciones y el comportamiento responsive. El orden de las secciones es el mismo del sitio actual, más una franja de beneficios nueva:

Header · Hero · Franja de beneficios (nueva) · Ejemplos · Cómo funciona · Precio · Por qué Devalpo · Preguntas frecuentes · CTA final · Footer · Botón fijo en móvil (nuevo).

## About the Design Files
`WebBot Landing v2.dc.html` es una **referencia de diseño hecha en HTML**, no código de producción. La tarea es **recrearla en el codebase actual de la landing** (Next.js, según las URLs `/_next/image`), con sus patrones y librerías. No hay que copiar el HTML.

El archivo usa estilos inline y un runtime propio (`support.js`) solo para el prototipo. Para leer los valores exactos, abre el archivo y busca el estilo inline de cada elemento.

## Fidelity
**Alta fidelidad.** Colores, tipografía, espaciados, radios, sombras y animaciones son definitivos. Recrear de forma exacta usando el sistema de estilos del codebase (CSS Modules, Tailwind o el que ya exista).

---

## Design Tokens

### Colores
| Token | Hex | Uso |
|---|---|---|
| navy | `#080056` | Titulares, franja de beneficios, bloque de precio, CTA final |
| purple (acento) | `#5B46F8` | Botón primario, eyebrows, pasos activos, tarjeta "¿Quiénes somos?" |
| purple-hover | `#4632DE` | Hover del botón primario |
| purple-7% | `#F0EEFE` | Píldora del hero, fondo del ícono de FAQ cerrado |
| purple-4% | `#F6F4FE` | Hover del botón secundario |
| purple-28% | `#C9C2FB` | Subrayado de enlaces |
| purple-18% | `#DAD7F7` | Números grandes en las mini-maquetas |
| cyan | `#15DEFA` | Subrayado del H1, acentos sobre navy, botón del bloque de precio y del CTA final |
| cyan-soft | `#DFFBFF` | Fondo de los checks del hero, tarjeta "¿Te piden un sitio web?" |
| cyan-ink | `#007C8F` | Color del check sobre `#DFFBFF` |
| orange | `#FFAF4D` | Etiqueta "Precio de lanzamiento" (texto `#2A1800`) |
| ink | `#101218` | Texto principal |
| ink-muted | `#565E6B` | Párrafos y nav |
| line | `#E2E0EC` | Bordes |
| line-soft | `#EFEEF4` | Separadores, cuadrícula del hero |
| border-btn | `#D8D6E4` | Borde del botón secundario |
| surface-soft | `#F6F5F2` | Secciones alternas, tarjetas de ejemplos, footer |
| whatsapp / en línea | `#25D366` | Puntos de "en línea" |
| verde ok | `#0F7A5C` sobre `#E3F7EE` | Píldora "En línea" del paso 3 |

### Tipografía
Solo **Montserrat** (Google Fonts, pesos 400/500/600/700/800). Las tres reglas que se repiten en toda la página:
- Titulares en `800`, `letter-spacing: -.042em` a `-.045em`, con `text-wrap: balance`.
- Eyebrows en `700 12px`, `letter-spacing: .24em`, mayúsculas, color purple.
- Párrafos en `400 16–19px / 1.7–1.75`, color ink-muted.

| Elemento | Tamaño |
|---|---|
| H1 del hero | `clamp(42px, 6.4vw, 84px) / 1.0` |
| H2 de sección | `clamp(34px, 4.6vw, 60px) / 1.04` |
| H2 del CTA final | `clamp(38px, 6vw, 80px) / 1.02` |
| Precio | `clamp(56px, 7vw, 92px) / 1` |
| H3 de paso | `clamp(24px, 2.6vw, 32px) / 1.15` |

### Espaciado
| Uso | Valor |
|---|---|
| Ancho máximo del contenido | `1280px`, centrado |
| Gutter horizontal | `clamp(20px, 5vw, 64px)` |
| Padding vertical de sección | `clamp(88px, 11vw, 160px)` |
| Hero | `clamp(56px,8vw,112px)` arriba, `clamp(72px,9vw,128px)` abajo |

### Radios
| Elemento | Radio |
|---|---|
| Botones y píldoras | `999px` |
| Tarjetas | `18–28px` |
| Bloque de precio | `32px` |
| CTA final | `clamp(24px, 3vw, 40px)` |
| Ventana del navegador del hero | `20px` |

### Sombras
| Elemento | Sombra |
|---|---|
| Botón primario | `0 12px 28px rgba(91,70,248,.32)`; en hover, `0 16px 34px rgba(91,70,248,.4)` |
| Ventana del hero | `0 40px 80px -20px rgba(8,0,86,.28), 0 0 0 1px rgba(8,0,86,.06)` |
| Tarjeta de chat | `0 24px 50px -12px rgba(8,0,86,.3), 0 0 0 1px rgba(8,0,86,.06)` |
| Hover de tarjeta de ejemplo | `0 30px 60px -24px rgba(8,0,86,.3)` |

**Curva de animación estándar:** `cubic-bezier(.2,.7,.2,1)`.

---

## Screens / Views

Es una sola página. Todas las grillas usan `repeat(auto-fit, minmax(min(100%, Xpx), 1fr))`, así que se apilan solas en pantallas angostas.

### 1. Header (sticky)
- `position: sticky; top: 0`, con `backdrop-filter: saturate(1.6) blur(14px)`.
- **En reposo:** alto `84px`, fondo transparente.
- **Con `scrollY > 12`:** alto `68px`, fondo `rgba(255,255,255,.86)` y borde inferior `1px #EFEEF4`. Transición de `.3s`.
- **Contenido:**
  - Logo de 40 px de alto.
  - Nav: Ejemplos · Cómo funciona · Precio · Preguntas, en `500 14px`, ink-muted y navy en hover, con gap `36px`. **Se oculta bajo 900 px.**
  - Botón "Ver mi sitio gratis →" (purple, `13px 22px`).

### 2. Hero
- **Grilla:** `minmax(min(100%,460px),1fr)`, con gap `clamp(56px,6vw,96px)`.
- **Fondo:**
  - Cuadrícula de `56px` en `#EFEEF4`, recortada con una máscara radial: `radial-gradient(ellipse 70% 60% at 70% 30%, #000 20%, transparent 75%)`.
  - Dos manchas difusas: cyan al 22 %, arriba a la derecha, de `560px`; y purple al 14 %, de `520px`.
- **Columna de texto, de arriba abajo:**
  - Píldora: "DEVALPO" (navy, blanco) + "Hecho en Valparaíso".
  - H1: "Tu sitio web listo **en 1 día.** Con tu dominio. Pago único."
    - "en 1 día." lleva un subrayado cyan de `.2em` de alto, a `.04em` de la base, detrás del texto.
    - El subrayado entra con `scaleX(0→1)` en `.9s`, con un retraso de `.9s`. Su contenedor necesita `position: relative; z-index: 0; isolation: isolate`.
  - Párrafo con tope de `44ch`.
  - Botones con `white-space: nowrap`:
    - Primario: "Ver mi sitio gratis →", que lleva a `/chat`.
    - Secundario: "Ver ejemplos reales", que lleva a `#ejemplos`.
  - Tres checks: Pago único · Publicado en 1 día hábil · Dominio a tu nombre.
- **Columna visual:** una ventana de navegador.
  - Barra con los tres puntos y una URL con un punto verde.
  - Área de contenido en `aspect-ratio: 4/3.1`, con **tres mini-sitios superpuestos** que se reemplazan cada **4,2 s**: fundido en opacidad de `.8s` y escala de `1.03` a `1` en `1.2s`.
  - La URL cambia con el slide: `donarosa.cl` · `almacenlaslomas.cl` · `clinicasonrie.cl`.
  - Debajo, tres indicadores: el activo mide `22px` en purple; los inactivos, `8px` en `#E2E0EC`.
- **Tarjeta de chat flotante:**
  - Posición absoluta, abajo a la izquierda, con ancho `min(290px, 78%)`.
  - Flota con `translateY 0 → -10px` en `6s`, en bucle.
  - Encabezado: avatar "W" (navy con cyan), "WebBot" y un punto "en línea" con pulso.
  - Los mensajes aparecen de a uno (un paso cada `1.1s`, en bucle).
    - Bot: `#F2F1ED`, radio `14 14 14 4`.
    - Usuario: purple, radio `14 14 4 14`.
  - Antes de cada mensaje del bot, un indicador de "escribiendo" con tres puntos.
  - **Reserva de espacio para la tarjeta:** el contenedor visual deja `64px` abajo y `48px` a la izquierda (en móvil, `120px` abajo y `0` a la izquierda).

### 3. Franja de beneficios
- Fondo navy, padding vertical de `22px`.
- Marquee infinito (`translateX(0 → -50%)` en `38s`, lineal), con la lista duplicada para que el bucle no tenga corte.
- Texto en `700 clamp(15px,1.6vw,20px)` blanco, separado por rombos cyan de `8px`.
- Ítems: Pago único · Publicado en 1 día hábil · Dominio a tu nombre · Hosting y SSL el primer año · Una ronda de ajustes · Hecho en Chile.

### 4. Ejemplos (`#ejemplos`)
- Encabezado en fila con wrap: eyebrow y H2 "Sitios que ya están publicados" a la izquierda; a la derecha, el párrafo "Son sitios reales en línea, no maquetas. Ábrelos y revísalos."
- Tres tarjetas con `minmax(min(100%,320px),1fr)` y gap `24px`, que abren el sitio real en una pestaña nueva:
  - Restaurante → https://demo-restaurante.sitios.devalpo.cl
  - Tienda → https://demo-tienda.sitios.devalpo.cl
  - Consulta dental → https://demo-dentista.sitios.devalpo.cl
- **Tarjeta:**
  - Fondo `#F6F5F2`, radio `24px`, padding `14px`.
  - Vista previa blanca de `250px` de alto con radio `14px`.
  - Pie con título (`700 20px`), descripción y un círculo navy de `44px` con "↗".
  - Hover: `translateY(-6px)` con sombra, en `.35s`.
- Las vistas previas son mini-maquetas hechas con HTML. **Pueden reemplazarse por capturas reales de cada sitio**, manteniendo la misma caja.

### 5. Cómo funciona (`#como-funciona`)
- Fondo `#F6F5F2`, en dos columnas.
- **Columna izquierda:** `position: sticky; top: 120px`. Contiene el eyebrow, el H2 "Tres pasos, sin vueltas", el texto "No pagas nada hasta ver tu sitio armado con los datos de tu negocio." y el botón navy "Empezar el chat →" (purple en hover).
- **Columna derecha:** padding izquierdo de `76px`.
  - **Riel vertical:** gris `#E2E0EC` de `2px`, a `27px` del borde.
  - **Relleno del riel:** degradado de purple a cyan, con alto según el scroll:
    `progreso = clamp(0, 1, (innerHeight*0.6 − rect.top) / (rect.height − 56))`.
  - **Círculos de los pasos:** `56px`, con borde de `2px` purple. Pasan de fondo blanco a purple (y el número a blanco) cuando `progreso ≥ i/2`.
- **Cada paso** tiene H3, texto y una ilustración de interfaz:
  1. "Conversas con el bot": dos burbujas de chat.
  2. "Revisas tu sitio": tarjeta "Tu sitio está listo · Revísalo antes de pagar".
  3. "Pagas y queda publicado": píldora `tunegocio.cl` con punto verde en pulso y la etiqueta "En línea".

### 6. Precio (`#precio`)
- **Encabezado** centrado: eyebrow y H2 "Un pago. Un sitio. Sin mensualidades."
- **Bloque principal:** navy, radio `32px`, en dos columnas (`minmax(min(100%,420px),1fr)`).
  - Dos manchas difusas: purple al 55 % y cyan al 25 %.
  - **Columna izquierda:**
    - "Sitio web de una página".
    - Etiqueta naranja "Precio de lanzamiento · quedan 10 cupos".
    - **$119.990** en grande, junto a $149.990 tachado (blanco al 60 %).
    - "Pago único, para los primeros 10" en cyan.
    - Botón cyan "Ver mi sitio gratis →" (blanco en hover).
  - **Columna derecha:** fondo blanco al 5 % y borde izquierdo blanco al 10 %. Muestra "Incluye" con 5 ítems, cada uno con un check cyan y separados por una línea blanca al 10 %.
- **Debajo, dos tarjetas** `#F6F5F2`:
  - "Sitio de varias páginas": $249.990.
  - "Renovación anual de dominio y hosting, desde el segundo año": $39.990.

### 7. Por qué Devalpo
Grilla bento con `minmax(min(100%,340px),1fr)` y gap `16px`:
- **Tarjeta grande purple:** ocupa 2 filas, `min-height: 420px`, radio `28px`.
  - Rótulo "¿Quiénes somos?".
  - Texto en `600 clamp(20px,2vw,26px)`.
  - Al pie, un avatar "AR" y "Hablas con una persona, no con un ticket. / Agustín Romero · CEO & Co-Founder".
- **"Lo publicamos nosotros"** (`#F6F5F2`), con las píldoras Dominio · Hosting · Certificado SSL.
- **"¿Te piden un sitio web?"** (`#DFFBFF`), con el texto sobre Webpay y Mercado Pago.

### 8. Preguntas frecuentes (`#faq`)
- **Columna izquierda:** H2 y el texto "¿Otra duda? Escríbenos al +56 9 7642 4587" (enlace a `wa.me/56976424587`).
- **Columna derecha:** acordeón de 6 ítems.
  - **Ítem:** tarjeta blanca de radio `18px`, con un `<button>` que lleva `aria-expanded`.
  - **Ícono "+":** círculo de `32px`. Cerrado, purple sobre `#F0EEFE`; abierto, gira `45°` y pasa a blanco sobre purple.
  - **Respuesta:** se abre animando `grid-template-rows: 0fr → 1fr` en `.4s`.
  - **Solo uno abierto a la vez**; el primero abre por defecto.
- **⚠ Respuestas por validar:** solo la primera ("¿Qué incluye el precio?") viene del sitio actual. Las otras cinco son borradores; **"¿Y si ya tengo dominio?" es una suposición.** Usar las respuestas reales que ya tiene el sitio.

### 9. CTA final
- Contenedor `#F6F5F2` con padding `clamp(20px,3vw,32px)`.
- **Tarjeta navy:** radio `clamp(24px,3vw,40px)`, centrada.
- **Fondo:** cuadrícula blanca al 5 % con máscara radial y una mancha purple al 50 % en el centro.
- **H2:** "Tu sitio puede estar publicado **mañana.**", con "mañana." en cyan.
- **Texto:** "Empieza la conversación ahora. No pagas nada hasta ver tu sitio listo."
- **Botón:** cyan, con anillo `0 0 0 8px rgba(21,222,250,.14)`. En hover crece a `14px` y el botón pasa a blanco.

### 10. Footer
- Fondo `#F6F5F2` y tres columnas con wrap.
  - **Columna 1:** logo de **44 px de alto** y la glosa "Sitios web para pymes, publicados en tu dominio en 1 día hábil."
  - **Columna 2:** Contacto. Agustín Nicolás Romero Salazar · CEO & Co-Founder · +56 9 7642 4587.
  - **Columna 3:** Empresa. Devalpo Soluciones Tecnológicas SpA · RUT 77.119.936-4 · Reñaca Norte 265, of. 510, Viña del Mar.
- **Fila inferior:** "© 2026 Devalpo · Soluciones Tecnológicas" y los enlaces Términos y condiciones (`/terminos`) y Privacidad (`/privacidad`).
- **El correo no aparece en el prototipo:** en el sitio actual está protegido por Cloudflare y no se pudo leer. Agregarlo junto a los datos de contacto.

### 11. Botón fijo en móvil
- Solo con viewport **< 640 px** y `scrollY > 700`.
- Posición `fixed`, a `12px` de los bordes izquierdo, derecho e inferior.
- Píldora purple de `56px` de alto: "Ver mi sitio gratis →".
- Entra con `wbUp` en `.4s`.

---

## Interactions & Behavior

### Animación de entrada
- Cada sección se observa con un IntersectionObserver (`threshold: .1`).
- Al entrar en pantalla, sus elementos marcados se animan con `wbUp`: de `opacity 0, translateY(22px)` a su posición final, en `.8s`.
- Cada elemento entra con un desfase de `90ms` respecto del anterior.
- Cada sección se anima una sola vez.

### Keyframes
| Nombre | Animación |
|---|---|
| `wbUp` | opacidad y translateY de 22 px a 0 |
| `wbMarquee` | translateX de 0 a −50 % |
| `wbDot` | puntos de "escribiendo": opacidad de .25 a 1 y −3 px en Y |
| `wbFloat` | ±10 px en Y |
| `wbPulse` | halo verde en expansión: `box-shadow` de 0 a 10 px |
| `wbSwipe` | scaleX de 0 a 1 |

### Movimiento reducido
Con `prefers-reduced-motion: reduce` se desactivan todas las animaciones y transiciones. El prototipo además tiene un ajuste `animaciones` (por defecto activado).

### Hovers
| Elemento | Hover |
|---|---|
| Botón primario | Oscurece y sube 1–2 px |
| Botón secundario | Borde purple y fondo `#F6F4FE` |
| Nav | ink-muted → navy |
| Tarjetas de ejemplo | Sube 6 px, con sombra |

### Scroll
- Scroll suave nativo (`scroll-behavior: smooth`) hacia los anclajes.
- Usar `requestAnimationFrame` para el listener de scroll (encoge el header y calcula el relleno de los pasos).

### Responsive
- Las grillas usan `auto-fit` y los tamaños usan `clamp()`.
- Breakpoints de JS:
  - `< 900px`: se oculta el nav.
  - `< 640px`: aparece el botón fijo y cambia el espacio reservado para la tarjeta de chat.
- Revisar en 390, 768, 1024 y 1280 px.

## State Management
Solo estado local de la interfaz; no hay datos remotos.

| Estado | Valores | Notas |
|---|---|---|
| `scrollY` | número | Para el header y el botón fijo |
| `viewportWidth` | número | Para los breakpoints de JS |
| `slide` | 0, 1, 2 | Intervalo de 4,2 s |
| `chatStep` | 0 a 8 | Intervalo de 1,1 s, en bucle |
| `faqOpen` | índice o −1 | Solo uno abierto a la vez |
| `stepsProgress` | 0 a 1 | Relleno del riel de pasos |

Limpiar los intervalos y los listeners al desmontar.

## Assets
- **Logo:** `/devalpo-logo.png`, el que ya tiene el codebase.
- **Ilustraciones:** no hay imágenes externas. Las vistas previas y las ilustraciones son HTML y CSS; los rectángulos rayados representan fotos de producto.
- **Datos de ejemplo:** los nombres de los mini-sitios del hero (Cocinería Doña Rosa, Almacén Las Lomas, Clínica Dental Sonríe) y el diálogo del chat son **ilustrativos**.

## Files
- `WebBot Landing v2.dc.html`: el prototipo completo. Se abre directamente en el navegador.
- `support.js`: runtime que necesita el prototipo para abrirse. No forma parte del diseño.
