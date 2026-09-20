# Handoff: plantilla LANDING como SPA "Bloques"

## Qué construir

Reemplazar la plantilla `LANDING` de WebBot (`src/components/templates/landing/`) por la dirección **Bloques**: landing scrolleable de una página, con header sticky, footer, animaciones de entrada sutiles y responsivo en un solo breakpoint.

Es la dirección elegida sobre dos alternativas (editorial en papel cálido, oscuro premium). Se eligió porque es la que mejor aguanta un cliente con poco material y la que se ve más cara con menos esfuerzo de llenado.

**Este README es la fuente autoritativa.** Todas las medidas están acá; no hace falta abrir ningún otro archivo para implementar.

## El problema que Bloques resuelve

El diseño anterior se veía "genérico y apretado". La causa no era el gusto: era geometría. Padding de sección de 52px, gutter de 44px y display de 58px producen una página donde todo está a tamaño medio y nada manda. Bloques sube esos tres números de golpe — **padding de sección 140–150px, gutter 96px, display hasta 104px** — y el contraste de escala es lo que hace la diferencia. Si al implementar hay que recortar algo, no recortes el aire: es lo único que no se puede compensar después.

## Archivos de este paquete

| Archivo | Qué es |
|---|---|
| `README.md` | Este documento. Especificación completa. |
| `Bloques — nav y Nosotros.dc.html` | Referencia visual del nav móvil y de la sección Nosotros con su cadena de degradación. Abrilo en el navegador. |

En el proyecto de diseño hay además un `Plantillas WebBot.dc.html` con el histórico de exploraciones (6 tipos de plantilla, 3 direcciones de landing, flujos de captura). **Pesa más de 256 KB y se lee truncado** — no lo uses como referencia de implementación; todo lo vigente está acá.

Las referencias visuales son maquetas con estilos inline y un script de vanilla JS. **No son código para copiar.** La tarea es recrear el diseño en el codebase existente: Next.js 16 App Router, React Server Components, CSS Modules, Clean Architecture. Sin Tailwind, sin styled-components, sin librerías de UI nuevas.

## Fidelidad

Alta. Colores, tipografías, tamaños, pesos, espaciados y estados son finales. Lo único deliberadamente sin resolver: el texto entre llaves sale del `SiteConfigDTO`, y los rectángulos rayados a 135° son placeholders de foto del cliente (en producción `next/image` con las URLs de `configJson.imagenes`).

---

# Sistema

## Tipografía

**Montserrat** para todo, vía `next/font/google`. Pesos en uso: 300, 500, 600, 700, 800.

Bloques no usa serif. (Las direcciones editoriales sí usaban Instrument Serif; esta no — si ves serif en una maqueta vieja, es de otra dirección.)

El carácter viene del **tracking negativo agresivo en los pesos altos**: `-.048em` en el display, `-.042em` en H2, `-.03em` en títulos de servicio. Sin eso, Montserrat 800 se ve genérico. Es el detalle que más rinde de toda la especificación.

## Color

Estructurales, fijos. No salen de `palette.ts`:

```
--ink          #101218   titular, texto principal, footer
--ink-muted    #565E6B   párrafos, texto secundario, etiquetas
--line         #E2E0EC   bordes de campos
--line-soft    #EFEEF4   separadores
--border-btn   #D8D6E4   borde de botón secundario
--surface      #FFFFFF
--surface-soft #F2F1ED   bandas alternas, fondo de página
--placeholder  repeating-linear-gradient(135deg,#E4E2DC 0 14px,#EDEBE5 14px 28px)
--whatsapp     #25D366
```

Marca Devalpo, ya en `src/styles/tokens.css` como `--wb-*` (reutilizar, no redeclarar):

```
--wb-navy #080056   --wb-cyan #15DEFA   --wb-purple #5B46F8   --wb-orange #FFAF4D
```

`--wb-cyan` se usa en la banda de cifras sobre `--ink`. `--wb-navy` no se usa en esta plantilla.

## El acento por cliente

Un solo color pinta: píldora del eyebrow, botón primario, subrayado del nav activo, número de servicio, subrayado de enlaces, bloque Nosotros completo, pin del mapa y el acento del footer.

```jsx
style={{ '--acento': config.colores.primario }}
```

El acento de todas las maquetas es `#5B46F8`. Derivados que hay que calcular:

| Uso | Cómo |
|---|---|
| Hover del botón primario | acento con `L` −0.08 en OKLCH (`#5B46F8` → `#4632DE`) |
| Fondo de píldora del eyebrow | acento al 7% sobre blanco (`#F0EEFE`) |
| Subrayado de enlace en reposo | acento al 28% sobre blanco (`#C9C2FB`) |
| Número grande de la banda tipográfica | acento al 18% sobre blanco (`#DAD7F7`) |
| Halo de foco de campo | `rgba(acento, .12)` |

**Contraste:** el acento se usa como fondo con texto blanco pleno (bloque Nosotros, botones). Si el acento del cliente viene claro, hay que bajarle `L` hasta que el blanco llegue a 4.5:1. Sobre el acento **nunca se usa texto con alfa** — siempre blanco pleno. Esa es la regla que más veces se rompió en las revisiones.

## Espaciado

Múltiplos de 4. Escritorio:

- Padding vertical de sección: **140px** (150px en el bloque Nosotros y en el hero)
- Gutter lateral: **96px**
- Altura del header: **96px**
- Gap de grilla principal: **96px**
- Gap entre tarjetas: **20–22px**
- Gap del nav: **42px**
- Ancho máximo de párrafo: **40ch**, sin excepción

## Radios

- Botones y píldoras: `999px`
- Campos de formulario: `12px`
- Mapa y tarjetas de contacto: `16–20px`
- Bandas de servicio, bloque Nosotros, banda de cifras, tarjetas internas del bloque de acento: **sin radio**, a sangre
- Monograma: **sin radio**, cuadrado

El contraste entre píldoras totalmente redondeadas y bloques totalmente rectos es intencional. No unificar.

## Animación

```css
@keyframes dvUp { from { opacity:0; transform: translateY(16px) } to { opacity:1; transform:none } }
```

Cada sección revela sus hijos en cascada al entrar en viewport: `dvUp .7s cubic-bezier(.2,.7,.2,1)`, `delay = índice × 80ms`, `both`. `IntersectionObserver` a `threshold: 0.12`, una sola vez por sección (`unobserve` tras disparar).

Con `prefers-reduced-motion: reduce`: sin `dvUp`, todo visible de inmediato. Los hover se mantienen — son solo color.

## Hover y foco

| Elemento | Cambio | Transición |
|---|---|---|
| Botón primario | `background` acento → acento oscurecido | `background .2s ease` |
| Botón secundario | `border-color` `#D8D6E4` → acento; `background` → acento al 4% (`#F6F4FE`). El texto NO cambia de color | `border-color .2s, background .2s` |
| Enlace de servicio | `border-bottom` `#C9C2FB` → acento pleno | `border-color .2s ease` |
| Ítem del nav | `color` `#565E6B` → `#101218` | `color .2s ease` |
| Campo, al foco | `border-color` → acento + `box-shadow: 0 0 0 3px rgba(acento,.12)`, sin `outline` | `border-color .2s, box-shadow .2s` |

**Regla dura: ningún hover mueve un elemento de su sitio.** Nunca `transform`, nunca sombra de elevación. El movimiento en un CTA de pyme se lee como plantilla de 2015.

Las bandas de servicio **no tienen hover de bloque** — no son clicables enteras, solo su enlace.

---

# Secciones — escritorio

Orden: header · hero · banda de cifras · encabezado de servicios · N bandas de servicio · bloque Nosotros · contacto · footer.

## Header — 96px, sticky, fondo blanco

Izquierda: monograma de `36×36px` (ver abajo) + nombre en `700 16px`, `letter-spacing:-.02em`, gap `14px`.
Centro: nav, `500 12.5px`, `--ink-muted`, gap `42px`; el activo en `600` y `--ink`.
Derecha: botón `Hablemos` — acento sólido, blanco, `600 12px`, padding `15px 28px`, radio `999px`.

## Hero — grid `1fr 1fr`, padding-top 150px

Columna izquierda (padding izquierdo 96px, padding-bottom 150px):

- **Píldora de eyebrow**: fondo acento al 7%, radio `999px`, padding `10px 18px`, punto de `7px` en acento + `{rubro} · {ciudad}` en `600 11.5px` acento. Margen inferior `44px`.
- **H1**: Montserrat `800`, tamaño según la tabla de escala (abajo), color `--ink`. Margen inferior `40px`.
- **Párrafo**: `300 18px/1.85`, `--ink-muted`, `max-width:38ch`. Margen inferior `52px`.
- **Dos botones**, gap `16px`, padding `20px 34px`, radio `999px`: primario acento sólido blanco; secundario con borde `1.5px #D8D6E4` y texto `--ink` (contiene el teléfono).

Columna derecha: foto placeholder de `720px` de alto, `border-radius: 24px 0 0 24px` (redondeada solo del lado interior, a sangre por la derecha).

### Escala del display — tres tramos por largo del nombre

El H1 es el **nombre del negocio**. No hay campo de "promesa": se evaluó y se rechazó — "resumí tu promesa en dos palabras" es una pregunta de taller de marca, mal contestada da un hero peor que el nombre limpio, y lo que hace funcionar este hero es el peso del display contra el aire, no el texto.

| Largo de `nombre` | `font-size` | `line-height` | `letter-spacing` |
|---|---|---|---|
| ≤ 14 caracteres | `104px` | `.95` | `-.048em` |
| 15 – 26 | `78px` | `1.0` | `-.042em` |
| ≥ 27 | `56px` | `1.06` | `-.035em` |

Tramo discreto calculado en el servidor con `nombre.length`. **No `clamp()`**: así el tamaño no depende del ancho de la ventana y el resultado es predecible.

Si más adelante se quiere ofrecer un titular personalizado, va como mejora **opcional** en el momento 2 (zona de texto, pre-pago), con 3 ejemplos del propio rubro como chips clicables y máximo 4 palabras. Nunca como pregunta del chat.

## Banda de cifras — fondo `--ink`, padding `76px 96px`

Fila de hasta 3 cifras. Valor en `800 56px/1`, `letter-spacing:-.04em`, color `--wb-cyan`; glosa en `300 14px/1.6` a 62% de blanco, `max-width:16ch`, gap `22px`. Separadores `border-left: 1px rgba(255,255,255,.16)` + `padding-left: 72px`.

**Degradación:** es una fila centrada que se reparte el ancho, no una reja de 3 columnas. Con 2 cifras, dos columnas; con 1, una cifra grande centrada con la glosa al costado (se lee mejor que tres flojas). **Con 0 cifras la banda no se renderiza** y el hero pasa directo a servicios — el contraste lo da la primera banda hueso.

Esto habilita la decisión ya tomada de pedir **una sola cifra** en el onboarding en vez de tres.

## Encabezado de servicios — padding `140px 96px 84px`

Eyebrow `600 11px`, `letter-spacing:.26em`, mayúsculas, acento. H2 `800 68px/1.04`, `letter-spacing:-.042em`, `max-width:22ch`.

## Bandas de servicio — dos formas, a sangre

Una banda por servicio, `min-height: 400px`, fondo alternando **blanco / `#F2F1ED` / blanco / `#F2F1ED`**.

Cada banda es un `grid` de dos celdas. La forma se decide **por banda, leyendo `servicio.foto`** — no por sección. Las dos formas se mezclan sin problema porque comparten la geometría.

### Forma A — sin foto. **Es la forma primaria.**

Grid `.85fr 1.15fr`. La celda visual contiene el **número a `800 190–260px/1`**, `letter-spacing:-.06em`, color acento al 18%, centrado, sobre el fondo contrario al de la banda (banda blanca → celda hueso, banda hueso → celda blanca). La celda de texto: título `700 38px/1.15` `-.03em`, descripción `300 16px/1.85` tope `40ch`, enlace `600 12.5px` acento con `border-bottom 1.5px` acento al 28%. Padding de texto `100px 96px`.

La alternancia visual se muda del lado de la foto **al color de fondo**. El ritmo de la dirección sobrevive sin una sola imagen.

### Forma B — con foto

Geometría idéntica. La foto entra **en la celda del número**, y el número baja a `800 15px` acento arriba del título, con `margin-bottom: 40px`.

Como la geometría no cambia, subir una foto **no reflowea la página**: la celda ya existe y solo cambia de contenido.

### Por qué A es la primaria

Las fotos reales llegan **después de pagar** (ver "Momento 2"). O sea: cero fotos de servicio es lo que ve todo cliente en el momento exacto en que decide si paga. La banda tipográfica no es el caso degradado — es el caso normal, y tiene que ser la versión más linda. La forma B es el premio que llega después.

**Regla dura: ninguna foto de banco entra nunca a una banda de servicio.** A media pantalla, una imagen genérica de oficina hace más daño que el número. La foto de banco solo se admite en el **hero**, donde la imagen es atmósfera y no evidencia; en una banda de servicio la foto es una afirmación sobre ese servicio específico, y una genérica miente.

**Con un solo servicio** la sección no se justifica: el servicio se absorbe en el hero como tercera línea y la sección no se renderiza. Dos o más, sección normal.

## Bloque Nosotros — fondo acento, a sangre, sin ninguna foto

Padding `150px 96px`. Grid `1.2fr 1fr`, gap `96px`, `align-items:center`.

Izquierda: eyebrow `600 11px/.26em` blanco · H2 `800 62px/1.06` `-.042em` blanco `max-width:18ch` · párrafo `300 17.5px/1.9` blanco `max-width:44ch`.
Derecha: hasta 3 tarjetas apiladas, gap `22px`, fondo `rgba(255,255,255,.14)`, padding `32px 34px`, sin radio. Título `700 17px`, detalle `300 14px/1.7`. Todo blanco pleno.

**Esta sección reemplaza la grilla de fotos actual.** El cambio es un borrado, no una migración: la grilla de fotos le pide al cliente justo lo que no tiene, en la sección que menos lo necesita. Las fotos que ya existan en `imagenes` pasan a las bandas de servicio como `servicio.foto`, que es donde rinden.

Cumple tres funciones: es el único lugar donde el acento cubre pantalla completa, corta el ritmo blanco/hueso de las bandas, y convierte el material más barato de conseguir (texto) en el momento más caro de la página.

### Cadena de degradación

| Estado | Qué usa | Cómo se ve |
|---|---|---|
| **Base — el caso de hoy** | `nombre`, `ciudad`, `descripcion`, todos del chat | Una columna, centrada, sin tarjetas. H2 + párrafo. |
| Con 1–2 micro-preguntas | + 1–2 tarjetas | Una columna, tarjetas en fila repartiéndose el ancho. |
| Completo | + 3 tarjetas | Dos columnas, `1.2fr 1fr`. |

**Esta sección nunca deja de renderizarse**, a diferencia de las cifras o las bandas. Es el ancla de color de la página: si desaparece, Bloques queda blanco y hueso de punta a punta y pierde la dirección. Y como el caso base usa tres campos que siempre existen, ningún sitio puede quedar sin ella.

La condición es una sola: `tarjetas.length === 3` → dos columnas. Es el mismo bloque creciendo, no tres variantes.

Las tres tarjetas **son** las tres micro-preguntas del momento 2 (`desde`, `quien`, `distinto`), mapeo directo sin redacción intermedia. El título de la tarjeta es la respuesta; el detalle es opcional.

## Contacto — padding `140px 96px`, grid `1fr 1fr`, gap `96px`

Izquierda: eyebrow · H2 `800 56px/1.06` `-.042em` · párrafo `max-width:38ch` · formulario de 3 campos (`input`, `input`, `textarea rows=4`) con padding `20px 24px`, borde `1.5px --line`, radio `12px`, `400 15px`, gap `18px` · botón de envío acento píldora.

Derecha: mapa placeholder (`min-height:420px`, fondo `--surface-soft`, radio `20px`, rejilla de 46px en `#E5E3DD`, pin de `18px` en acento con halo `0 0 0 9px rgba(acento,.18)`) + dos tarjetas de dato en grid `1fr 1fr`, borde `1.5px --line`, radio `16px`, padding `30px`.

## Footer — fondo `--ink`, padding `100px 96px 44px`

Grid `1.4fr 1fr 1fr`, gap `72px`, `padding-bottom:80px`, `border-bottom: 1px rgba(255,255,255,.14)`.
Columna 1: monograma `34px` + nombre `700 19px` blanco; debajo `{rubro} en {ciudad}. {horario}.` en `300 14px/1.8` a 50%.
Columnas 2 y 3: encabezado `600 10.5px/.18em` mayúsculas a 66% de blanco; ítems `300 14px` a 80%, gap `14px`.
Línea final: `© {año} {nombre}` y `Hecho con WebBot · Devalpo`, ambos `300 11.5px` a **66% de blanco** (no menos — el micro-texto de footer fue el defecto de contraste más repetido).

---

# Monograma

Cuando el cliente no tiene logo. **Variante para Bloques: Sans pesado** — Montserrat `800`, `letter-spacing:-.04em`, sobre cuadrado de relleno en acento, texto blanco, sin radio.

(Una tabla anterior mapeaba "Serif calado" a LANDING. Era incorrecta: estaba dibujada contra la dirección editorial. Con Bloques, la regla "el monograma hereda la tipografía de su plantilla" apunta a Sans pesado.)

Reglas:

1. **Dos iniciales, no una.** "CV" lee como marca; "C" lee como avatar de aplicación. Si el nombre es de una sola palabra, las dos primeras letras.
2. Hereda la tipografía de su plantilla.
3. **Nunca un cuadrado redondeado con relleno plano** — es el gesto que grita "no puso su logo".
4. **Cuando llega el logo, ocupa el mismo espacio**: alto tope `36px` en escritorio (`26px` en móvil y `34px` en footer), `object-fit: contain`. Nada se mueve alrededor.

Tamaños: `36×36px` en header, `34×34px` en footer, `26×26px` en móvil.

---

# Móvil

Un solo breakpoint: **768px**.

## Escala

| Elemento | Escritorio | Móvil |
|---|---|---|
| Display del hero | 104 / 78 / 56px | **44px** / `.98` / `-.045em` |
| H2 de sección | 68px | **34px** / `1.06` / `-.04em` |
| H2 de Nosotros | 62px | **32px** |
| Título de servicio | 38px | **25px** / `1.18` / `-.03em` |
| Cuerpo | 16–18px | **13.5px / 1.8** |
| Gutter | 96px | **24px** |
| Padding de sección | 140px | **44px** arriba y abajo |
| Padding del bloque Nosotros | 150px 96px | **40px 24px 44px** |

## Reordenamiento

**La foto del hero sube arriba del titular** (en escritorio va al costado). Es el único reordenamiento de toda la plantilla: se resuelve con `order` en un solo contenedor. Todo lo demás conserva el orden del DOM.

## Bandas de servicio

Se apilan **siempre foto-arriba / texto-abajo**, ignorando la alternancia del escritorio. Invertir en móvil se lee como error. La forma A apila el número arriba en una celda de `170px` de alto.

## Bloque Nosotros

Siempre una columna, tarjetas apiladas con gap `10px`. Se mantiene a sangre: es donde el gesto funciona mejor.

## Nav — fila horizontal con scroll. Sin hamburguesa.

Confirmado: **no lleva hamburguesa**. Con cuatro secciones, una hamburguesa cambia cuatro etiquetas visibles por un toque y un panel. Si ves un ícono de tres barras en una maqueta, es un placeholder arrastrado de exploraciones anteriores.

La fila le sirve a Bloques mejor que a las otras direcciones: el borde cortando una etiqueta a la derecha insinúa que hay más sin explicarlo.

Tres detalles propios de esta dirección:

1. **El activo lleva subrayado, no píldora.** `border-bottom: 2px` acento, peso `600`, tinta plena. La píldora rellena compite con los botones redondeados del hero, que son el elemento clicable de verdad. Y el subrayado es el mismo gesto que el nav de escritorio: una sola idea en los dos tamaños.
2. **Sin degradado de desvanecido en el borde.** La etiqueta se corta seca. El difuminado se lee como componente de librería; el corte limpio es más honesto y más barato. Eso sí, `scroll-padding-inline: 18px` para que el ítem centrado nunca quede pegado al canto.
3. **Al pegarse, el logo desaparece.** El header sticky en móvil es solo la fila: `44px` de alto en vez de `82px`. Aparece una sombra de `0 6px 16px rgba(16,19,26,.07)` para separarla del contenido — el único lugar del diseño con sombra, y por eso funciona.

Mecánica: `overflow-x:auto` + `scroll-snap-type: x proximity`, snap al inicio de cada ítem. Al tocar una sección, scroll horizontal **solo dentro de la fila** — nunca sobre el documento (no usar `scrollIntoView` sobre el `body`). Barra oculta con `scrollbar-width:none`, gap `22px`, etiquetas `12.5px`, alto de toque `44px` contando el padding inferior.

## Alturas táctiles

Botones: `15px` de padding vertical = **46px**. Campos: `18px` = **52px**. Ambos sobre el mínimo de 44px.

---

# Campos del `SiteConfigDTO`

Todos opcionales salvo los que ya existen. `parseSiteConfig` los normaliza sin fabricarlos. Ningún campo nuevo puede romper un sitio publicado.

| Campo | Tipo | Para qué |
|---|---|---|
| `logo?` | `string` (URL) | Reemplaza el monograma |
| `servicios[].foto?` | `string` (URL) | **Decide forma A o B de cada banda.** Por servicio, no un arreglo global |
| `servicios[].descripcion?` | `string` | Cuerpo de la banda |
| `destacados?` | `{valor, etiqueta}[]` | Banda de cifras. 0 a 3 |
| `sobreNosotrosPartes?` | `{desde?, quien?, distinto?}` | Las 3 tarjetas del bloque Nosotros. Se compone en la plantilla, **no se guarda ya redactado** — así el texto siempre son las palabras del cliente |
| `highlightAutor?` | `{nombre, cargo}` | Autor del testimonio |

**Regla transversal:** cuando un campo opcional falta, el elemento **no se renderiza**. Nunca rellenar con datos de ejemplo, nunca un bloque vacío, nunca precios ni horarios inventados. Única excepción: el bloque Nosotros, que siempre renderiza porque su caso base usa campos que siempre existen.

---

# Arquitectura

El scroll y el nav sticky no necesitan estado de servidor. **Un único componente cliente** (`'use client'`) envuelve el nav para manejar el ítem activo y el scroll de la fila; header, footer y todas las secciones siguen siendo Server Components pasados como children. No convertir la plantilla entera a cliente.

Las animaciones de entrada también van en ese componente cliente (o en uno mínimo aparte que solo monte el `IntersectionObserver`).

---

# Momento 2 — captura de contenido (contexto, no alcance de este ticket)

Decidido: **mixto**.

- **Texto — se abre al dejar los datos, antes de pagar.** Descripciones de servicios, testimonio, y las 3 micro-preguntas de "sobre nosotros". Orden: "describí tus servicios" va **primera**, porque con Bloques las bandas son la mitad de la página y es donde el cliente ve el cambio más grande por menos escritura.
- **Logo y fotos reales — después de pagar.**

Consecuencias de diseño que sí afectan este ticket:

1. Todo sitio recién entregado tiene **cero fotos de servicio** → la forma A de la banda es la primaria (ya especificado arriba).
2. La tarea bloqueada se muestra como **antesala, no como muro**: sus zonas de subida en gris con su nombre, no un candado tapando. El texto nunca dice "desbloqueá" ni "mejorá tu sitio" — dice qué pasa mientras tanto (los números grandes ocupan el lugar de las fotos), que además es verdad.
3. Los porcentajes dejan el **techo gratis en 80%**: texto suma 45, archivos 20. Deliberado — ese 20 restante tiene nombre y precio.

El chat de la demo baja de 8–9 a **6 preguntas**: nombre · confirmar rubro · descripción · servicios · ciudad · estilo. Salen `contacto`, `redes` y `highlight`. El **teléfono sube a la reja de datos** con campo propio: las plantillas tienen WhatsApp como CTA principal, y sin número el botón más importante del sitio no existe.

---

# Fuera de alcance

- **Logos de clientes del cliente**: no se construyen. Es un recurso de consultora B2B; un taller o una peluquería no tiene logos que mostrar, y pedirlos garantiza una sección vacía.
- **Campo de "promesa en dos palabras"**: rechazado como pregunta de onboarding (ver la tabla de escala del display).
- **Tres cifras en el hero**: bajan a una. La banda degrada bien con 1, 2 o 3.
- **Bloque legal** (razón social, RUT, T&C, privacidad): sigue siendo brecha real si un cliente activa Webpay o Mercado Pago, pero es un cambio aparte.
- **Testimonios múltiples y FAQ**.
- **Metadata por sitio** (`generateMetadata` en las rutas de sitio): bug vivo, independiente de este rediseño, pero conviene resolverlo en la misma tanda — un sitio de pago que en Google dice "Devalpo" no se puede cobrar como sitio propio.

# Assets

- **Montserrat** de Google Fonts vía `next/font/google`. Nada más.
- **Ícono de WhatsApp**: SVG inline de 24×24. Es el único ícono del sistema.
- **Fotos**: ninguna en el paquete. Todos los rectángulos rayados son placeholders; en producción salen de `configJson.imagenes` con `next/image` y `width`/`height` explícitos.
- **Logo de Devalpo**: ya está en `public/devalpo-logo.png`. **No va en los sitios de cliente** — solo la línea "Hecho con WebBot · Devalpo" del footer.
