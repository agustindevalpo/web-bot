# Handoff: 6 plantillas SPA para WebBot (fábrica de sitios de Devalpo)

## Resumen

Rediseño de las plantillas públicas de sitio de WebBot (`src/components/templates/*`). Hoy existen 5 (`LANDING`, `SERVICIOS`, `RESTAURANTE`, `PORTFOLIO`, `TIENDA`) resueltas como páginas de scroll largo con paleta por rubro. Este handoff las reemplaza por 6 plantillas SPA de una sola página con navegación por secciones, header y footer propios, animaciones de entrada sutiles y diseño responsivo — y agrega un tipo nuevo, `PROFESIONAL`.

El objetivo comercial: el sitio se llena con los datos del cliente pero **no debe verse básico**. El sistema de tipografía, el aire y el ritmo son constantes y no dependen de lo que escriba el cliente; lo único que varía por sitio es un color de acento.

## Sobre los archivos de diseño

`Plantillas WebBot.dc.html` es una **referencia de diseño en HTML**: un prototipo que muestra el aspecto y el comportamiento buscados. **No es código para copiar y pegar.** Está escrito con estilos inline y un pequeño script de vanilla JS porque es una maqueta de revisión, no un componente de producción.

La tarea es **recrear estos diseños dentro del codebase existente de WebBot**: Next.js 16 (App Router), React Server Components, CSS Modules, Clean Architecture (`domain → application → infrastructure → presentation`), con `src/components/templates/<nombre>/{index.tsx, sections.ts, *.module.css}` como patrón ya establecido. No introducir Tailwind, styled-components ni ninguna librería de UI nueva.

El paquete original incluía una copia de `BITACORA.md` como contexto. **Se eliminó al
entrar al repositorio**: era idéntica byte a byte a `../BITACORA.md`, y dos copias de lo
mismo divergen apenas alguien toca una (ver `../DECISIONES.md`, D-19). El contexto del
proyecto se lee en `../ESTADO.md` (qué es hoy), `../DECISIONES.md` (por qué) y
`../BITACORA.md` (qué pasó).

### Cómo abrir el prototipo

Ábrelo en un navegador. Las 6 propuestas están apiladas verticalmente. Los tabs del header de cada maqueta (Inicio / Servicios / Carta / Trabajos / etc.) **funcionan**: al hacer clic cambian de sección con fundido, que es exactamente el comportamiento SPA a implementar.

## Fidelidad

**Alta fidelidad (hifi).** Colores, tipografías, tamaños, pesos, espaciados y estados son finales y deben reproducirse con precisión. Lo único deliberadamente sin resolver:

- Todo el texto entre llaves (`{nombre del negocio}`, `{precio}`, `{foto principal}`) es un slot que se llena desde `SiteConfigDTO`.
- Los rectángulos con rayado diagonal a 135° son **placeholders de foto del cliente**. En producción van `next/image` con las URLs de `configJson.imagenes`.
- El color de acento de cada maqueta es un ejemplo. En producción sale de `configJson.colores.primario`.

---

## Sistema de diseño (aplica a las 6 plantillas)

### Tipografía

Dos familias, ambas de Google Fonts. Cargar con `next/font/google` (el proyecto ya lo usa para la landing).

| Rol | Familia | Uso |
|---|---|---|
| UI / cuerpo | **Montserrat** (300, 400, 500, 600, 700, 800) | Todo el texto de interfaz, párrafos, botones, etiquetas |
| Display editorial | **Instrument Serif** (400, 400 italic) | Titulares de `LANDING`, `RESTAURANTE` y `PROFESIONAL` |

`Montserrat` es la tipografía de cuerpo de la marca Devalpo. `Instrument Serif` sustituye a `Kroppen Round` (que no está en Google Fonts) para los titulares de las plantillas editoriales. Las plantillas comerciales (`SERVICIOS`, `PORTFOLIO`, `TIENDA`) usan Montserrat 700/800 con tracking negativo en vez de serif.

Escalas exactas por plantilla, más abajo.

### Colores estructurales (fijos, NO salen de `palette.ts`)

```
--ink            #10131A   texto principal y footers en plantillas claras
--ink-muted      #5A6270   texto secundario
--ink-faint      #8A909C   etiquetas, metadatos
--line           #E3E5EA   bordes y separadores
--surface        #FFFFFF
--surface-soft   #F6F5F2   fondos suaves, chrome
--placeholder    repeating-linear-gradient(135deg,#E7E5DF 0 12px,#F1EFE9 12px 24px)
--whatsapp       #25D366
```

Marca Devalpo (solo en `PORTFOLIO`, que usa navy de fondo, y como paleta secundaria de sus pasos numerados):

```
--wb-navy    #080056
--wb-cyan    #15DEFA
--wb-purple  #5B46F8
--wb-orange  #FFAF4D
```

Estos 4 ya existen en `src/styles/tokens.css` como `--wb-*`. Reutilizarlos, no redeclararlos.

### El acento por cliente

**Regla central:** un solo color por sitio pinta eyebrows, botones primarios, subrayado del nav activo, números, íconos de check, pin del mapa y enlaces. Todo lo demás es neutro fijo.

```css
/* en el <html> o el root del template, inline desde el server */
style={{ '--acento': config.colores.primario }}
```

Acentos usados en las maquetas (solo como ejemplo de rango):

| Plantilla | Acento de la maqueta |
|---|---|
| LANDING | `#5B46F8` |
| SERVICIOS | `#0F7C74` |
| RESTAURANTE | `#D9762F` |
| PORTFOLIO | `#FFAF4D` |
| TIENDA | `#C2255C` |
| PROFESIONAL | `#1E6B4F` |

**Advertencia de contraste:** `RESTAURANTE` y `PORTFOLIO` usan el acento sobre fondo oscuro. Hay que forzar una luminancia mínima al acento del cliente (subir `L` en OKLCH hasta ~0.65 si viene por debajo) o el color desaparece. `SERVICIOS`, `TIENDA` y `PROFESIONAL` lo usan sobre blanco: ahí hace falta el techo opuesto (bajar `L` si viene demasiado claro) para cumplir 4.5:1 en texto.

### Espaciado

Múltiplos de 4. Valores canónicos en uso: `4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26 · 30 · 34 · 40 · 44 · 52 · 56`.

- Padding lateral de sección (escritorio): `44px`
- Padding lateral (móvil): `22px`
- Altura del header: `78px` (74px en `TIENDA`, que suma la franja de promo de 34px)
- Altura del footer: `76px`
- Gap entre tarjetas: `12–16px`
- Gap del nav: `30–32px`

### Radios

| Plantilla | Radio |
|---|---|
| LANDING | `6px` |
| SERVICIOS | `8–14px` tarjetas, `999px` botones |
| RESTAURANTE | `3–4px` (angular, editorial) |
| PORTFOLIO | `4–6px` |
| TIENDA | `10px` tarjetas, `999px` botones y chips |
| PROFESIONAL | `2–4px` (casi cuadrado, sobrio) |

El radio es parte de la personalidad de cada plantilla. No unificarlo.

### Sombras

```
tarjeta flotante clara   0 18px 44px rgba(16,19,26,.16)
tarjeta flotante oscura  0 22px 50px rgba(16,19,26,.22)
botón WhatsApp           0 10px 26px rgba(37,211,102,.42)
pin del mapa             0 0 0 7px <acento a 16–20% alpha>
```

---

## Comportamiento SPA (idéntico en las 6)

Toda la página es una sola ruta. El header intercambia secciones sin recargar y sin scroll largo.

### Contrato

- Cada plantilla declara 4 secciones. La primera (`inicio`) es la activa al cargar.
- Al hacer clic en un ítem del nav: la sección saliente se oculta, la entrante aparece con `dvFade` y sus hijos revelables se re-animan en cascada.
- El ítem activo del nav toma el color de acento, pasa a `font-weight: 600` y su subrayado de 2px crece desde la izquierda (`transform: scaleX(0) → scaleX(1)`, `.3s cubic-bezier(.2,.7,.2,1)`, `transform-origin: left`).
- El nav se arma **según lo que exista en el DTO**. Si un sitio no tiene galería o no tiene trayectoria, esa pestaña no se renderiza. Nunca mostrar una sección vacía.

### Animaciones

```css
@keyframes dvUp   { from { opacity:0; transform: translateY(16px) } to { opacity:1; transform:none } }
@keyframes dvFade { from { opacity:0; transform: translateY(8px)  } to { opacity:1; transform:none } }
```

- **Cambio de sección:** `dvFade .4s cubic-bezier(.2,.7,.2,1) both` sobre el contenedor de sección.
- **Revelado en cascada:** cada hijo marcado como revelable corre `dvUp .62s cubic-bezier(.2,.7,.2,1)` con `delay = índice × 70ms`, `both`.
- **Al cargar la página:** el revelado dispara con un `IntersectionObserver` a `threshold: 0.06`, una sola vez por elemento (`unobserve` tras disparar).
- **Hover de botones:** no hay transform. Solo oscurecer/aclarar el fondo un 8% en `.2s ease`.
- **Respetar `prefers-reduced-motion: reduce`**: sin `dvUp` ni `dvFade`, todo visible de inmediato. No está en el prototipo; **hay que implementarlo**.

### Implicancia arquitectónica

El switch de secciones exige **un único componente cliente** (`'use client'`) que envuelva el `<main>` y maneje qué sección está activa. Header, footer y el contenido de cada sección siguen siendo Server Components y se le pasan como `children` / slots. No convertir la plantilla entera a cliente.

### Responsivo

Un solo breakpoint real: **`768px`**.

- **≥768px:** layouts de 2–4 columnas como en las maquetas de escritorio. Nav horizontal completo.
- **<768px:** todo a 1 columna. El nav horizontal se reemplaza por un botón hamburguesa (3 barras de `20×1.5px`, la tercera de `13px`, gap `4px`) que abre el mismo set de secciones como lista a pantalla completa. Padding lateral baja a `22px`. Los titulares bajan ~30% (ver tablas por plantilla).
- Sin anchos fijos en px fuera de los marcos de dispositivo del prototipo. Usar `max-width` y `minmax(0,1fr)`.

### Botón flotante de WhatsApp

Presente en 5 de 6. Círculo de `52px` (escritorio) / `48px` (móvil), `#25D366`, ícono blanco de 26/24px, anclado `right:32px bottom:28px` (escritorio) y `right:18px bottom:26px` (móvil). El SVG del ícono está en el prototipo, reutilizarlo tal cual.

**Excepción — `TIENDA`:** en móvil NO lleva botón flotante. Lleva una **barra inferior fija** de ancho completo (`padding:12px 22px 22px`, borde superior `1px #EFEBED`, fondo blanco) con un botón píldora verde "Comprar por WhatsApp". Tapa menos catálogo y convierte mejor.

---

## Las 6 plantillas

> Notación: `font: <weight> <size>/<line-height> <familia>`. Cuando falta el line-height, es `normal`.

### 1. LANDING — consultora, servicios profesionales, genérica

Ruta: `src/components/templates/landing/`. Reemplaza el layout actual migrado. El dispatcher y el fallback a `LANDING` para valores desconocidos **no cambian**.

**Secciones del nav:** Inicio · Servicios · Nosotros · Contacto

**Header** (78px, fondo blanco, borde inferior `1px #ECEDF1`)
- Izquierda: cuadrado de `30×30px`, radio `8px`, fondo acento, con la inicial del negocio en `700 13px Montserrat` blanco. A `11px`, el nombre en `600 14.5px Montserrat`, `letter-spacing:-.01em`, color `--ink`.
- Centro: nav, `500 12.5px Montserrat`, color `--ink-muted`, gap `30px`.
- Derecha: botón `Hablemos` — `600 12px Montserrat` blanco sobre `--ink`, padding `11px 20px`, radio `6px`.

**Sección Inicio** — grid `1.05fr .95fr`, alto completo.
- Columna izquierda, padding `66px 30px 40px 44px`, centrada verticalmente:
  - Eyebrow `{rubro} · {ciudad}`: `600 10.5px Montserrat`, `letter-spacing:.2em`, mayúsculas, color acento, `margin-bottom:20px`.
  - H1 `{nombre del negocio}`: `400 58px/1.06 Instrument Serif`, `letter-spacing:-.015em`, `max-width:12ch`, `margin-bottom:22px`. **Móvil: `38px/1.06`.**
  - Párrafo: `300 16px/1.65 Montserrat`, `--ink-muted`, `max-width:42ch`, `margin-bottom:34px`.
  - Dos botones en fila, gap `12px`: primario acento sólido blanco (`600 12.5px`, padding `14px 24px`, radio `6px`) y secundario con borde `1px #D9DBE1`, texto `--ink`.
  - Fila de 3 cifras, borde superior `1px #ECEDF1`, padding-top `22px`. Valor: `400 30px/1 Instrument Serif` en acento. Etiqueta: `400 11px Montserrat` en `--ink-faint`, `margin-top:7px`. Separadores `border-left:1px #ECEDF1` + `padding-left:22px`.
- Columna derecha, fondo `--surface-soft`:
  - Placeholder de foto, `position:absolute; inset:44px 44px 120px 0`, radio `4px`, con la etiqueta abajo a la izquierda en `500 11px Montserrat` color `#9A968C`.
  - Tarjeta oscura superpuesta que **sale del borde izquierdo** (`left:-56px; bottom:52px`), ancho `330px`, fondo `--ink`, padding `26px 28px`, radio `6px`. Adentro: eyebrow "Destacado" en `#15DEFA` y la frase en `400 19px/1.4 Instrument Serif` blanca.

**Sección Servicios** — padding `56px 44px`. Eyebrow + H2 `400 40px/1.1 Instrument Serif`, `max-width:18ch`, `margin-bottom:40px`. Grid de 3×2 con `gap:1px` sobre fondo `#ECEDF1` y borde `1px #ECEDF1` (la técnica de rejilla de hairlines). Cada celda: fondo blanco, padding `30px 26px 34px`, número `400 13px Montserrat` en `#C7C3BA` con `margin-bottom:44px`, título `600 16px Montserrat`, descripción `300 13px/1.65 Montserrat`. **La sexta celda es el CTA**: fondo acento, frase en `400 19px/1.35 Instrument Serif` blanca y enlace "Escríbenos →" con `border-bottom:1px rgba(255,255,255,.5)`.

**Sección Nosotros** — grid `1fr 1.15fr`, gap `52px`. Izquierda: eyebrow, H2 `400 38px/1.12 Instrument Serif`, párrafo `300 14.5px/1.75`, y 3 viñetas con punto de `5px` en acento. Derecha: grid `1fr 1fr` × `1fr 1fr`, gap `14px`, con la primera celda ocupando `grid-row: span 2`.

**Sección Contacto** — grid `1fr 1fr`, gap `52px`. Izquierda: formulario de 3 campos (`input`, `input`, `textarea rows=3`) con `padding:14px 16px`, borde `1px --line`, radio `6px`, `400 13.5px Montserrat`; botón de envío acento sólido. Derecha: mapa placeholder (fondo `--surface-soft`, rejilla de 38px en `#E6E4DE`, pin circular de `16px` en acento con halo) sobre dos tarjetas de dato (teléfono, correo) en grid `1fr 1fr`.

**Footer** (76px, fondo `--ink`): nombre en `600 13px` blanco · datos de contacto en `300 11.5px` a 55% de blanco, gap `26px` · "Hecho con WebBot · Devalpo" en `300 10.5px` a 35%.

**Campos del DTO:** usa lo existente + `sobreNosotros`. **Nuevo:** `destacados?: {valor,etiqueta}[]` para la fila de 3 cifras. Si falta, la fila no se renderiza y el hero simplemente termina en los botones.

---

### 2. SERVICIOS — dentista, veterinaria, peluquería, yoga

Ruta: `src/components/templates/servicios/`. Es el template por defecto de esos 4 rubros en `rubroTemplates.ts`.

**Secciones del nav:** Inicio · Servicios · El lugar · Contacto

Personalidad: confianza clínica. Fondo de `<main>` en `#F4F8F7` (tinte frío del acento), tarjetas blancas, esquinas redondeadas, botones píldora.

**Header** (78px, blanco, borde `1px #E8EFEE`): círculo de `32px` en acento con la inicial; nombre en `700 14.5px Montserrat` y, debajo, `{rubro} · {ciudad}` en `400 10px Montserrat`, `letter-spacing:.14em`, mayúsculas, `--ink-faint`. CTA `Agendar hora`: acento sólido, padding `12px 22px`, `border-radius:999px`.

**Sección Inicio** — grid `1fr 1fr`.
- Izquierda: píldora de estado — fondo blanco, borde `1px #D7E6E4`, radio `999px`, padding `8px 15px`, punto de `7px` en acento y texto `600 11px Montserrat` en acento: `Atención hoy · {horario}`.
- H1 `700 46px/1.12 Montserrat`, `letter-spacing:-.028em`, `max-width:14ch`. **Móvil: `32px/1.14`.**
- Párrafo `300 16px/1.7`, color `#4A5560`.
- Botones píldora: primario acento sólido, secundario blanco con borde `1px #C6DCD9` y texto en acento.
- Dos beneficios con check: círculo de `22px` en `#DCEDEB` con `✓` en `700 11px` acento + texto `400 12.5px`.
- Derecha: foto placeholder a sangre con radio `14px`, y **tarjeta de horarios superpuesta** saliendo por la izquierda (`left:-40px; bottom:76px`, ancho `250px`, blanca, radio `12px`, sombra `0 18px 44px rgba(16,60,56,.16)`). Filas `Lun a Vie / Sábado / Domingo` en `400 12px Montserrat`, valor en `600`, separadores `1px #F0F3F2`, el día cerrado en `#9AA4AC`.

**Sección Servicios** — grid `2×2`, gap `14px`. Tarjeta: blanca, borde `1px #E4EDEC`, radio `12px`, padding `24px 26px`, fila flex con gap `18px`. Ícono numerado: `40×40px`, radio `11px`, fondo `#DCEDEB`, número `700 14px` en acento. Título `600 15px`, detalle `300 12.5px/1.6`, precio `600 12px` en acento con `margin-top:11px`. Debajo, banda acento sólido (radio `12px`, padding `22px 28px`) con frase blanca `400 15px` y botón blanco píldora.

**Sección El lugar** — eyebrow + H2 `700 34px/1.15 Montserrat` `letter-spacing:-.025em` + párrafo `max-width:62ch` + 3 fotos en grid `repeat(3,1fr)` de `340px` de alto, radio `12px`.

**Sección Contacto** — izquierda: tarjeta blanca (borde `1px #E4EDEC`, radio `14px`, padding `26px`) con nombre, teléfono, un `<select>` de servicio y botón píldora acento. Derecha: mapa placeholder + tarjeta de teléfono/Instagram.

**Footer** (76px): fondo **oscuro derivado del acento** (`#0B3B37` para el teal de ejemplo — en producción, el acento con `L` bajada a ~0.22 en OKLCH). Contenido igual que LANDING.

**Campos nuevos:** `horarios?: {dia,rango}[]` y `precioDesde?` por servicio. Ambos opcionales; sin ellos caen la tarjeta de horarios y la línea de precio, sin mover el resto.

**Dos notas funcionales:**
1. El formulario debe armar el mensaje de WhatsApp con nombre + servicio prellenados (`https://wa.me/<tel>?text=<encodeURIComponent(...)>`), no un `mailto:`. Cero backend, mucha mejor conversión.
2. La píldora "Atención hoy" se calcula en cliente con la hora local contra `horarios`. **Si no hay `horarios`, no se renderiza.** Nunca mostrar "abierto" adivinando.

---

### 3. RESTAURANTE — restaurante, panadería, cafetería, delivery

Ruta: `src/components/templates/restaurante/`. Conserva la carta a dos columnas con guías punteadas que ya existe; cambia el fondo a oscuro y el display a serif.

**Secciones del nav:** Inicio · Carta · El local · Reservas

Fondo global `#171310`. Texto blanco. Radios de `3–4px`. Botones en mayúsculas con `letter-spacing:.06em`.

**Header** (78px, borde `1px rgba(255,255,255,.09)`): nombre en `400 21px Instrument Serif` blanco. Nav en `500 12px Montserrat`, `letter-spacing:.05em`, color `rgba(255,255,255,.62)`, subrayado activo de `1.5px`. CTA `RESERVAR`: acento sólido con texto `#171310`, radio `3px`.

**Sección Inicio** — hero fotográfico a sangre.
- Capa 1: foto del cliente a `inset:0`.
- Capa 2: `linear-gradient(90deg, rgba(23,19,16,.96) 0%, rgba(23,19,16,.82) 46%, rgba(23,19,16,.35) 100%)`. **Este degradado es obligatorio:** garantiza 4.5:1 sobre cualquier foto que suba el cliente.
- Contenido a la izquierda, `max-width:640px`, padding `0 44px`:
  - Eyebrow con guion: línea de `34×1px` en acento + texto `600 10.5px Montserrat` `letter-spacing:.24em` mayúsculas acento.
  - H1 `400 66px/1.02 Instrument Serif`, `letter-spacing:-.01em`. **Móvil: `44px/1.03`.**
  - Párrafo `300 16px/1.7` a 72% de blanco, `max-width:44ch`.
  - Dos botones rectos (radio `3px`): primario acento con texto `#171310`, secundario con borde `1px rgba(255,255,255,.28)`.
  - Cita: `border-left:2px` acento, `padding-left:20px`, texto `400 22px/1.45 Instrument Serif` **itálica** blanca.

**Sección Carta** — grid `1fr 1fr`, `column-gap:56px`.
- Columna izquierda: por cada categoría, encabezado `600 10px Montserrat` `letter-spacing:.2em` mayúsculas a 42% de blanco con `border-bottom:1px rgba(255,255,255,.12)` y `padding-bottom:14px`. Cada ítem es una fila flex con `align-items:baseline`: nombre `500 14.5px`, **guía punteada** (`flex:1; border-bottom:1px dotted rgba(255,255,255,.26); transform:translateY(-3px)`), precio `600 14px` en acento. Separación entre ítems `16px`.
- Columna derecha: bloque de menú del día en acento sólido (radio `4px`, padding `26px 28px`) con título `400 28px/1.2 Instrument Serif` en `#171310`; abajo una foto placeholder que ocupa el resto; abajo del todo, botón blanco `PEDIR DELIVERY POR WHATSAPP`.

**Sección El local** — eyebrow + H2 `400 40px/1.1 Instrument Serif` + párrafo + 3 fotos en grid `1.6fr 1fr 1fr`, alto `330px`.

**Sección Reservas** — formulario de reserva: nombre (ancho completo), y debajo `Personas` + `Día y hora` en grid `1fr 1fr`. Inputs sobre `rgba(255,255,255,.04)` con borde `1px rgba(255,255,255,.18)`, radio `3px`, texto blanco. **El submit arma el mensaje de WhatsApp** con nombre + personas + día. Es el único template donde el formulario supera claramente al `mailto:`. Derecha: mapa placeholder en oscuro (rejilla `rgba(255,255,255,.06)`) + tarjetas de teléfono e Instagram con borde `1px rgba(255,255,255,.14)`.

**Footer** (76px, fondo `#0F0C0A`, borde superior `1px rgba(255,255,255,.08)`): nombre en `400 17px Instrument Serif`.

**Campos nuevos:** `menu?: {categoria, items: {nombre, precio}[]}[]`. Si no viene, caer al `servicios[]` plano actual, sin precios y sin categorías.

---

### 4. PORTFOLIO — taller, constructora, oficios, fotografía

Ruta: `src/components/templates/portfolio/`. Mantiene el hero editorial oscuro sin imagen que ya tenía; cambia la grilla de columnas CSS por un grid con pieza destacada.

**Secciones del nav:** Inicio · Trabajos · Cómo trabajo · Contacto

**Única plantilla con el navy de Devalpo como fondo** (`#080056`), porque el oficio se luce sobre oscuro y porque es la que más se parece a un portafolio de agencia. Los 4 colores de marca se usan como paleta secundaria en los pasos numerados.

**Header** (78px): nombre en `800 15px Montserrat`, `letter-spacing:-.02em`, **mayúsculas**. CTA `Pedir presupuesto` en `--wb-orange` con texto navy, radio `4px`.

**Sección Inicio** — sin imagen, puro tipográfico.
- Dos círculos decorativos concéntricos a la derecha, solo borde de `1px`: uno de `420px` en `rgba(255,175,77,.22)` (`right:-60px; top:60px`) y otro de `260px` en `rgba(21,222,250,.18)` (`right:20px; top:140px`).
- H1 `800 72px/.98 Montserrat`, `letter-spacing:-.04em`, `max-width:16ch`. **Móvil: `44px/.99`.**
- Fila de 3 cifras con valor en `800 34px/1 Montserrat` `letter-spacing:-.03em` color `--wb-cyan`, borde superior `1px rgba(255,255,255,.14)`.

**Sección Trabajos** — cabecera con H2 a la izquierda y **chips de filtro** a la derecha: activo `600 11px` navy sobre naranjo, radio `999px`; inactivos con borde `1px rgba(255,255,255,.2)`. Los filtros son 100% cliente, sin fetch.
- Grid `repeat(4,1fr)` × 2 filas, gap `14px`, alto `470px`. La primera pieza ocupa `grid-column: span 2; grid-row: span 2` y lleva título `700 16px` + subtítulo `300 12px` a 55%. Las siguientes 3 son piezas simples con el título abajo. La sexta celda es un CTA en naranjo sólido: frase `700 15px/1.3` navy + enlace "Cotizar →" con `border-bottom:1.5px rgba(8,0,86,.4)`.

**Sección Cómo trabajo** — 4 pasos en grid con `gap:1px` sobre `rgba(255,255,255,.14)` y borde del mismo color, radio `6px`, `overflow:hidden`. Cada paso: círculo de `34px` con el número en `800 14px`, coloreado con la secuencia de marca — **1 naranjo `#FFAF4D` (texto navy) · 2 púrpura `#5B46F8` (texto blanco) · 3 cyan `#15DEFA` (texto navy) · 4 blanco (texto navy)**. Título `700 14.5px`, detalle `300 12.5px/1.6` a 60%.

**Sección Contacto** — formulario de 2 campos (nombre + textarea) sobre `rgba(255,255,255,.05)`, borde `1px rgba(255,255,255,.2)`, radio `4px`. Derecha: mapa placeholder + tarjetas.

**Footer** (76px, fondo `#05003A`).

**Campos nuevos:** `trabajos?: {titulo,categoria,foto}[]` y `proceso?: {titulo,detalle}[]`.

**Nota sobre fotos:** es la plantilla que más depende de material real del cliente. Si `imagenes` trae menos de 4, la grilla debe **colapsar a 2 piezas**, no rellenar con stock. Un portafolio con fotos de banco destruye la credibilidad del oficio.

---

### 5. TIENDA — boutique, ferretería, venta por WhatsApp

Ruta: `src/components/templates/tienda/`. Conserva la barra de contacto fija y el WhatsApp por tarjeta que ya existían; suma precio, etiqueta y filtros.

**Secciones del nav:** Inicio · Productos · Nosotros · Contacto

**Franja de promoción** — barra de `34px` sobre el header, fondo acento, texto `500 11px Montserrat` `letter-spacing:.06em` blanco centrado. **Reutiliza el campo `highlight`**, que hoy aparece como una estrella suelta perdida en el layout; como franja superior es donde más rinde en una tienda.

**Header** (74px, blanco, borde `1px #EFEBED`): nombre `700 16px Montserrat` `letter-spacing:-.02em`. CTA `Comprar por WhatsApp` píldora en acento.

**Sección Inicio** — grid `1fr 1fr`.
- Izquierda: eyebrow, H1 `700 50px/1.06 Montserrat` `letter-spacing:-.035em` `max-width:13ch` (**móvil `34px/1.08`**), párrafo, dos botones píldora, y dos beneficios con check en círculo de `24px` fondo `#FBE7EE`.
- Derecha: mosaico de 3 piezas en grid `1fr 1fr` × `1fr 1fr`, gap `12px`, radio `10px` — foto principal ocupando `grid-row: span 2`, foto secundaria, y **una tarjeta oscura de promoción** (`--ink`, título `700 22px/1.15` blanco, condición `300 11.5px` a 60%).

**Sección Productos** — cabecera con H2 y chips de categoría (activo negro sólido, inactivos con borde `1px #E0DCDE`).
- Grid `repeat(4,1fr)`, gap `16px`. Tarjeta: borde `1px #EFEBED`, radio `10px`, `overflow:hidden`. Imagen de `172px`. Etiqueta opcional flotante arriba a la izquierda (`600 9.5px` mayúsculas, blanco sobre acento, radio `999px`, padding `5px 9px`). Cuerpo con padding `16px`: nombre `600 13.5px`, detalle `300 11.5px` en `--ink-faint`, y fila final con precio `700 15px` a la izquierda y botón **`Pedir` en verde WhatsApp** (`600 11px` blanco, padding `8px 13px`, radio `999px`) a la derecha.
- Debajo, banda suave (`#FBF2F6`, borde `1px #F3DFE8`, radio `10px`) con la frase "¿Buscas algo que no está en el catálogo?" y botón acento.

**Sección Nosotros** — texto a la izquierda con 2 tarjetas de dato, mosaico de 3 fotos a la derecha.

**Sección Contacto** — formulario de 3 campos + mapa + tarjetas de WhatsApp e Instagram.

**Footer** (76px, fondo `--ink`).

**Móvil:** la franja de promo se mantiene (altura `30px`). El catálogo pasa a grid `1fr 1fr` con imágenes de `112px`. **Barra inferior fija** en vez de botón flotante (ver sección de comportamiento).

**Campos nuevos:** `productos?: {nombre,detalle,precio,categoria,etiqueta?,foto}[]`. **Sin precio la tarjeta muestra solo "Consultar" — nunca inventar un valor.**

---

### 6. PROFESIONAL — tipo NUEVO: abogado, contador, psicólogo, nutricionista

Ruta nueva: `src/components/templates/profesional/`.

**Por qué hace falta:** hoy un abogado o un psicólogo cae en `SERVICIOS`, que está pensado para un local con box, horarios de atención y precios por servicio. Aquí el producto es **una persona**: mandan el retrato, las credenciales y la trayectoria, no el catálogo. Forzar estos rubros a `SERVICIOS` produce sitios que se sienten de peluquería.

**Secciones del nav:** Inicio · Áreas · Trayectoria · Agendar

Paleta cálida y sobria: fondo `#FBF9F4`, tinta `#1B1A16`, texto secundario `#57514A`, líneas `#E9E4D9`, metadatos `#8C8478`. Radios de `2–4px`. Placeholder de foto en tonos cálidos: `repeating-linear-gradient(135deg,#EBE5D7 0 12px,#F3EFE5 12px 24px)`.

**Header** (78px, borde `1px #E9E4D9`): nombre en `400 19px Instrument Serif` y debajo la profesión en `500 9.5px Montserrat` `letter-spacing:.2em` mayúsculas en acento. CTA `Reservar hora` en acento sólido, radio `4px`.

**Sección Inicio** — grid `1.1fr .9fr`.
- Eyebrow con guion de `28×1px` + `{profesión} · {ciudad}` en `600 10.5px` `letter-spacing:.22em`.
- H1 `400 52px/1.08 Instrument Serif` `letter-spacing:-.01em` `max-width:15ch` (**móvil `36px/1.1`**).
- Párrafo `300 15.5px/1.75`, `max-width:44ch`.
- Dos botones (radio `4px`): primario acento, secundario con borde `1px #DDD6C8`.
- **Fila de credenciales** (no cifras): `Colegiatura` · `Modalidad` · `Primera sesión`, con etiqueta `400 12px` en `#8C8478` y valor `600 13px` en tinta. Borde superior `1px #E9E4D9`.
- Derecha: retrato placeholder con radio `2px`, y tarjeta oscura superpuesta (`left:-44px; bottom:96px`, ancho `232px`, fondo `#1B1A16`, radio `2px`) con el número de años en `400 30px/1 Instrument Serif` blanco y la glosa en `300 12px/1.55` a 65%.

**Sección Áreas** — 3 tarjetas en grid, blancas, borde `1px #E9E4D9`, radio `3px`, padding `28px 26px`. **Numeradas en romanos** (`I`, `II`, `III`) en `400 22px Instrument Serif` acento, con `margin-bottom:34px`. Título `600 15px`, detalle `300 12.5px/1.7`. Debajo, banda oscura (`#1B1A16`, radio `3px`, padding `28px 32px`) con "La primera conversación es sin costo" en `400 24px/1.35 Instrument Serif` y botón blanco.

**Sección Trayectoria** — grid `.95fr 1.05fr`. Izquierda: eyebrow, H2 `400 38px/1.12 Instrument Serif`, párrafo `300 14.5px/1.8`, y una foto de la consulta de `170px`. Derecha: **línea de tiempo** de 4 hitos. Cada uno es una fila flex con gap `20px`: año en columna fija de `72px` (`600 12px` acento), y a la derecha el hito `600 14.5px` + detalle `300 12.5px/1.65`. Separadores `1px #E9E4D9`, padding vertical `22px`.

**Sección Agendar** — formulario de 3 campos (radio `3px`, borde `1px #DDD6C8`, fondo blanco) + mapa placeholder en blanco con rejilla `#F1ECE1` + tarjeta de teléfono/correo.

**Footer** (76px, fondo `#1B1A16`): nombre en `400 17px Instrument Serif`.

**Trabajo de backend que exige:**
1. Valor `PROFESIONAL` en el VO `Template` (`src/domain/value-objects/Template.ts`), en el registry de componentes y en `RUBRO_TEMPLATES` (`src/infrastructure/templates/rubroTemplates.ts`). **Incluye migración Prisma del enum `Template`.**
2. Rubros nuevos `abogado`, `contador`, `psicologo`, `nutricionista` en el prompt de extracción de `ClaudeChatService`, en el guion de `DemoChatService` y en `rubroDefaults.ts` (hoy son 10 + `otro`).
3. Campos nuevos en `SiteConfigDTO`: `profesion`, `credenciales?`, `trayectoria?: {anio,hito,detalle}[]`.
4. Si no hay `trayectoria`, esa pestaña **no aparece en el nav** — el SPA arma el menú según lo que exista.

---

## Resumen de cambios al `SiteConfigDTO`

Todos opcionales. `parseSiteConfig` debe normalizarlos sin fabricarlos, igual que hizo con `sobreNosotros` y `contacto.formulario`. Ningún campo nuevo debe romper un sitio ya publicado.

| Campo | Tipo | Plantillas |
|---|---|---|
| `destacados?` | `{valor: string, etiqueta: string}[]` | LANDING, PORTFOLIO |
| `horarios?` | `{dia: string, rango: string}[]` | SERVICIOS, RESTAURANTE |
| `menu?` | `{categoria: string, items: {nombre: string, precio: string}[]}[]` | RESTAURANTE |
| `productos?` | `{nombre, detalle, precio, categoria, etiqueta?, foto}[]` | TIENDA |
| `trabajos?` | `{titulo, categoria, foto}[]` | PORTFOLIO |
| `proceso?` | `{titulo, detalle}[]` | PORTFOLIO |
| `profesion` | `string` | PROFESIONAL |
| `credenciales?` | `string[]` | PROFESIONAL |
| `trayectoria?` | `{anio, hito, detalle}[]` | PROFESIONAL |
| `precioDesde?` | `string` (dentro de cada servicio) | SERVICIOS |

**Regla transversal:** cuando un campo opcional falta, la sección o el elemento **no se renderiza**. Nunca rellenar con datos de ejemplo, nunca mostrar un bloque vacío, nunca inventar precios ni horarios.

---

## Assets

- **Tipografías:** Montserrat e Instrument Serif, ambas de Google Fonts, vía `next/font/google`.
- **Ícono de WhatsApp:** SVG inline de 24×24 incluido en el prototipo. Es el único ícono del sistema; reutilizarlo tal cual.
- **Fotos:** ninguna. Todos los rectángulos rayados son placeholders. En producción salen de `configJson.imagenes` con `next/image` y `width`/`height` explícitos (el proyecto ya cuida el CLS así en la landing).
- **Logo de Devalpo:** ya está en `public/devalpo-logo.png`. **No va en los sitios de cliente** — solo la línea "Hecho con WebBot · Devalpo" del footer.

---

## Fuera de alcance (decidido con el cliente)

- **Bloque legal** (razón social, RUT, Términos y condiciones, Privacidad). Sigue siendo una brecha real si un cliente activa Webpay o Mercado Pago — ver la bitácora, hallazgo #297 — pero es un cambio aparte.
- **Testimonios y FAQ** en las plantillas de sitio.
- **Un séptimo tipo, `LOCAL DE BARRIO`** (panadería, ferretería: horarios + catálogo corto + mapa), propuesto pero no diseñado.
- **Metadata por sitio** (`generateMetadata` en las rutas de sitio). Es un bug vivo y documentado en la bitácora, independiente de este rediseño, pero conviene resolverlo en la misma tanda: un sitio de pago que en Google dice "Devalpo" no se puede cobrar como sitio propio.

## Archivos de este paquete

| Archivo | Qué es |
|---|---|
| `Plantillas WebBot.dc.html` | El prototipo. Ábrelo en el navegador; los tabs del header funcionan. |
| `PLAN-SLICES.md` | Cómo se corta este handoff en ciclos SDD: orden, dependencias y riesgos. Es el puente entre el diseño y la implementación. |
| `../BITACORA.md` | Bitácora del proyecto. No se duplica acá, ver arriba. Contexto, no requisitos. |
| `README.md` | Este documento. |
