# Brief para el diseñador: chat de onboarding y "momento 2" en Bloques

> **Para qué es este documento.** Pegarlo en Claude Design como punto de partida. Trae el
> inventario exacto de lo que el chat y el flujo de captura hacen hoy, lo que ya está
> decidido (no se reabre), las preguntas de diseño que necesitan respuesta explícita y las
> restricciones verificadas en el repositorio. No asumas nada que no esté aquí: si falta un
> dato, pregúntalo.
>
> Escrito el 2026-10-04 desde el código, no de memoria. Cada afirmación cita su fuente
> (rutas relativas a la raíz del repositorio `WebBot`).

## El encargo, en una línea

Entregar, con la misma precisión que el capítulo S2 SERVICIOS, un handoff Bloques del
**chat de onboarding y del momento 2** (la captura de contenido), para que la
implementación no tenga que inventar diseño.

## Contexto mínimo

**WebBot** es una fábrica de sitios web para pymes chilenas, operada por Devalpo. El
embudo: anuncio → landing comercial → **chat demo** → nombre y correo → **se revela el
sitio** → el visitante paga por un link de Mercado Pago → Devalpo confirma el pago a mano
en `/admin` (`src/app/admin/sitios/[id]/page.tsx`, formularios de `confirmarPagoAction`).

Las plantillas de sitio de cliente ya se rehicieron en **Bloques** (D-38,
`docs/DECISIONES.md`): **LANDING y SERVICIOS están en producción** (`docs/ESTADO.md`
líneas 84-93 y 119). RESTAURANTE, PORTFOLIO y TIENDA siguen con el diseño anterior.
La plantilla que recibe cada visitante la decide su rubro
(`src/infrastructure/templates/rubroTemplates.ts`): peluquería, dentista, yoga y
veterinaria → SERVICIOS; consultora y rubro desconocido → LANDING; panadería y
restaurante → RESTAURANTE; taller → PORTFOLIO; ferretería y tienda → TIENDA.

**La razón de negocio de este encargo:** los campos nuevos de las plantillas (precio por
servicio, horarios, las tres partes de Nosotros, autor de la cita, razón social y RUT, logo)
existen en el modelo (`src/application/dtos/SiteConfigDTO.ts`), pero **nada los llena hoy
salvo el editor JSON de `/admin`**. Las plantillas ya renderizan estos campos y degradan
sin ellos; falta la superficie que los captura.

## Ya decidido: no se reabre

| Decisión | Fuente |
|---|---|
| El chat baja de 8-9 a **6 preguntas**: nombre · confirmar rubro · descripción · servicios · ciudad · estilo. Salen `contacto`, `redes` y `highlight` | `handoff_bloques/README.md:351`; `docs/DECISIONES.md` D-36 |
| El **teléfono sube al paso de datos** con campo propio (WhatsApp es el CTA principal de las plantillas) | `handoff_bloques/README.md:351` |
| **Momento 2 mixto.** Texto **antes** de pagar: descripción de cada servicio (va **primera**), las 3 micro-preguntas de Nosotros (desde / quién / distinto), testimonio y su autor; según T8 también `precioDesde` y `horarios` donde la plantilla los use. **Logo y fotos después de pagar** | D-36; `README.md:340-343`; `00-DECISIONES-TRANSVERSALES.md` T8 |
| Techo de avance gratis: **80 %** (texto suma 45, archivos 20) | `README.md:349` |
| La tarea bloqueada se muestra como **antesala, no como muro**: zonas de subida en gris con su nombre, sin candado. Nunca "desbloquea" ni "mejora tu sitio"; dice qué pasa mientras tanto | `README.md:348` |
| **Razón social y RUT los ingresa Devalpo en `/admin` después del pago**; el chat no los pide | T7, `00-DECISIONES-TRANSVERSALES.md:152` |
| Las opciones del chat son botones clicables que envían la etiqueta exacta; el campo de texto sigue habilitado | D-29 |
| Nunca inventar datos del cliente (precios, horarios, descripciones). Campo vacío = el elemento no se renderiza | `README.md:326`; T5 |
| Las fotos de banco solo van en `imagenes[0]`, como atmósfera | T9 |

## Inventario exacto de hoy

### Las preguntas (verbatim de `src/infrastructure/demo/DemoChatService.ts`)

Hoy son **8 respuestas del visitante, o 9** cuando el rubro no se deduce
(`construirScript`, líneas 87-96). La pregunta 1 la muestra `ChatWidget.tsx:15-16` como
saludo antes de cualquier llamada. El código **todavía no implementa las 6 preguntas**.

| # | Texto exacto | Formato | Campo |
|---|---|---|---|
| 1 | "¡Hola! Soy el asistente de WebBot. Te voy a hacer algunas preguntas para armar tu sitio. ¿Cómo se llama tu negocio?" | texto | `nombre` |
| 2 | "¡Qué buen nombre! ¿A qué se dedica tu negocio? Cuéntame brevemente." | texto | `descripcion` |
| 3 | "¿Cuáles son tus principales productos o servicios? Menciona los 3 o 4 más importantes." | texto, se parte por `,` `/` `;` `y`, máximo 6 | `servicios` |
| 4 | "¿En qué ciudad o zona opera tu negocio?" | texto | `ciudad` |
| 5 | "¿Cuál es el teléfono de contacto y el email de tu negocio?" | texto | `contacto` |
| 6 | "¿Tienes redes sociales? (Instagram, Facebook — comparte el nombre de usuario o el link)" | texto | `redes` |
| 7 | "¿Qué estilo visual prefieres para tu sitio?" + 3 viñetas: "Moderno y minimalista", "Cálido y cercano", "Colorido y llamativo" | botones | `estilo` |
| 8 | "¡Casi listo! ¿Hay algo especial de tu negocio que quieras destacar? (un logro, frase especial, oferta)" | texto | `highlight` |
| 9 (condicional) | "Para elegir bien el diseño y los colores de tu sitio, ¿cuál de estas categorías describe mejor tu negocio?" + candidatos o las 10 categorías + "Ninguno de estos" | botones | `rubro` |

Cierre del guion: "¡Perfecto! Ya tengo todo lo que necesito. Así se vería tu sitio web... 🚀".
Etiquetas de rubro: `RUBRO_LABELS`, líneas 35-46 (por ejemplo "Peluquería o salón de belleza").
Las etiquetas de estilo y de rubro son **contrato** con el parser (D-29): cambiar su texto
rompe la deducción de `estilo` y `rubro`.

### Paso de datos (`src/app/chat/LeadForm.tsx`)

Texto: "Para mostrarte tu sitio de ejemplo, necesitamos tu nombre y tu correo." Dos campos
(Nombre, "Correo electrónico", ambos obligatorios) y el botón "Ver mi sitio de ejemplo".
**No hay campo de teléfono.** Envía a `POST /api/chat/lead` (`src/app/api/chat/lead/route.ts`)
solo `{sessionId, nombre, email}`. Errores mapeados en `ChatWidget.tsx:39-52`.

### El reveal (`src/app/chat/DemoCTA.tsx`)

Tras el lead aparece, **en la misma página del chat**: "📱 Así se vería tu sitio" con un
`iframe` del sitio demo (sin interacción posible desde el chat) y "Ver sitio completo →";
debajo, la caja de pago: "Tu sitio propio, listo en 1 día", el precio, el aviso de no
retracto y el botón "Quiero mi sitio real →" (link fijo de Mercado Pago;
`src/app/chat/hrefPago.ts`).

- **Aviso de no retracto (D-39):** `DemoCTA.tsx:83-92`, **antes** del botón, no después:
  "Al pagar aceptas los Términos y condiciones. Como revisas y apruebas tu sitio antes de
  pagar, no aplica el derecho a retracto (art. 3 bis, Ley 19.496). Si no lo publicamos en
  10 días por causas nuestras, te devolvemos el pago." Debe seguir antes del botón.
- Texto bajo el botón: "Pago único por Mercado Pago. Después del pago te contactamos para
  activar tu sitio en 1 día. Sin contratos ni permanencia mínima."
- **Después de pagar no existe ninguna superficie propia para el cliente.** No hay página
  de gracias ni panel de cliente. Solo existe `/login` y `/onboarding`
  (`src/app/onboarding/page.tsx`), que exige sesión y **reutiliza el mismo `ChatWidget`**;
  no captura archivos. El contacto posterior lo hace Devalpo (WhatsApp, según D-42) y
  `/admin` lo usa solo Devalpo. No sé qué URL de retorno tiene el link de Mercado Pago:
  es una pregunta abierta para el dueño.

### Qué ve el chat hoy (sistema visual)

`/chat` **no usa Bloques ni los tokens comerciales**: `src/app/chat/page.module.css` pinta
fondo `#080056` (navy de marca), burbujas del bot `#0d0080`, del usuario `#5b46f8`,
opciones como píldoras con borde y texto cian `#15defa`, y declara `Inter`
(`page.module.css:6`), pero `src/app/layout.tsx` carga **Fredoka y Montserrat**, no Inter:
la fuente efectiva es el respaldo `Arial`. Los tokens de marca están en
`src/styles/tokens.css` (`--wb-color-*`, `--wb-radius-*`, `--wb-font-body`). Las
plantillas de cliente usan los tokens `--wb-tpl-*` y el sistema Bloques.

### Qué puede cargar `/admin` hoy

`src/app/admin/sitios/[id]/page.tsx`: subida de **logo** (línea 342), **foto principal**
(371) y **galería** `imagenes` (403), más un `textarea` con el `configJson` completo (426-429).
Se aceptan JPEG, PNG y WebP de hasta 5 MB; **SVG no** (D-42). No hay formularios de campos
para precios, horarios, partes de Nosotros ni legal: solo JSON a mano.

### Campo → quién lo llena → quién debería → dónde se ve

| Campo (`SiteConfigDTO`) | Hoy | Debería (T8 y decisiones) | Dónde se ve |
|---|---|---|---|
| `nombre`, `descripcion`, `ciudad`, `estilo`, `rubro` | Chat | Chat | Hero, header, Nosotros (caso base) |
| `servicios[]` (nombres) | Chat | Chat | Bandas (LANDING) / lista (SERVICIOS) |
| `servicios[].descripcion` | Nadie | M2 | Cuerpo de la banda / fila de la lista |
| `servicios[].precioDesde` | Nadie (JSON) | M2 | Columna de precio, solo SERVICIOS |
| `horarios[]` | Nadie (JSON) | M2 | Banda de horarios, solo SERVICIOS |
| `sobreNosotrosPartes` | Nadie (JSON) | M2 | 3 tarjetas del bloque Nosotros |
| `highlight` | Chat (pregunta 8) | M2 | Cita dentro de Nosotros (C3) |
| `highlightAutor` | Nadie (JSON) | M2 | Línea de autor de la cita |
| `contacto.telefono` / `contacto.email` | Chat (pregunta 5) | Paso de datos (teléfono) / paso de datos (correo) | CTA de WhatsApp, Contacto |
| `redes` | Chat (pregunta 6) | **Sin destino definido** (ver conflictos) | — |
| `destacados` (cifras) | Nadie | Sin definir (README las baja a una) | Banda de cifras, solo LANDING |
| `logo`, `logoDimensiones` | Admin (subida) | Después del pago (hoy Admin) | Header, footer en placa blanca |
| `imagenes[0]`, `servicios[].foto`, `imagenes[1..]` | Banco por rubro / Admin | Después del pago (hoy Admin) | Hero, banda forma B, "El lugar" |
| `legal` (razón social, RUT) | Nadie (JSON) | Admin, después del pago | Línea del footer (T7) |

## Conflictos entre fuentes: no los resuelvas, respóndelos

1. **`redes` queda huérfano.** El README dice que salen del chat (`README.md:351`); el
   prototipo v3 las manda al momento 2 (`Plantillas WebBot v3.dc.html`, bloque "Las 3 que
   salen"); T8 no tiene una fila para `redes`. Hoy el DTO las tiene y las plantillas no
   las muestran como sección propia. ¿Se capturan, se sacrifican o van a Admin?
2. **El 55 % del prototipo v3 no cuadra con D-36.** El estado 3 de v3 muestra el reveal con
   "Tu sitio está al 55 %" y dice que "le falta tu logo, tus fotos reales y el detalle de
   tus servicios", e invita a "Completar mi sitio" **antes** de pagar con logo y fotos
   incluidos. D-36 y el README dejan logo y fotos para después del pago. Además, 45 + 20
   con techo gratis de 80 % implica una base de 35 % que ningún documento define.
3. **El prototipo v3 diseña "el sitio es el formulario"** (edición en el lugar, sobre el
   sitio); T8 y D-36 solo fijan *qué* se pregunta, no *dónde*. Está sin decidir.
4. **Dirección visual de las maquetas.** Las maquetas de momento 2 de v3 usan la firma de
   la dirección 2a Editorial (`docs/brief-rediseno-chat-onboarding.md`, "Sigue sin
   decidirse"); la elegida fue Bloques (D-38). Las maquetas hay que redibujarlas.
5. **D-40 vs T7.** D-40 decía que el chat "tendría que pedir razón social y RUT"; T7 lo
   resuelve pasándolo a Admin. Está decidido, pero `/admin` hoy solo lo admite por JSON
   (sin formulario), y el comentario de `SiteConfigDTO.ts:68-75` afirma que no hay subida
   en `/admin`, lo que quedó obsoleto con D-42.

## Lo que debes responder explícitamente, en prosa

Estas son las decisiones que un agente suele dejar implícitas. Responde cada una con su
porqué; no las resuelvas por omisión.

- **(a) Estilo del chat.** ¿El chat se rediseña en Bloques o se queda en el sistema actual
  de la app (navy `#080056` + cian)? Considera que el visitante va del chat al sitio ya en
  Bloques, y que el costo de mantener dos sistemas lo paga una sola persona.
- **(b) Dónde vive el momento 2.** Dentro del chat, en una pantalla posterior al reveal, o
  junto a la vista previa del sitio revelado. Indica qué pasa con el botón de pago y el
  aviso D-39 (deben seguir **antes** del botón de pago, y el cliente debe haber visto el
  sitio antes de pagar).
- **(c) Cómo se ve aterrizar cada respuesta.** ¿Vista previa en vivo, antes/después, o nada
  hasta el final? Sin romper la promesa de velocidad ("tu sitio en un día", dos minutos
  hasta ver el sitio). Si propones vista previa en vivo, indica de dónde sale el render
  (el `iframe` actual no se refresca solo).
- **(d) Diferencias por plantilla.** LANDING pide descripciones y Nosotros; SERVICIOS suma
  precios y horarios; RESTAURANTE, PORTFOLIO y TIENDA están pendientes. ¿Un solo flujo con
  pasos condicionales o uno por plantilla? Ten presente que el visitante no elige la
  plantilla: la decide su rubro, y puede cambiar si corrige el rubro en la pregunta 2.
- **(e) Omitir y estado mínimo.** Qué pasa con cada paso omitido y con un sitio sin nada
  de momento 2. El estado mínimo debe verse bien (T5): es un estado de primera clase.
- **(f) Móvil primero**, a **390 px**: la mayor parte del tráfico es móvil. Medidas táctiles
  mínimas de 44 px (`README.md:307-309`).
- **(g) Después del pago.** ¿Existe una superficie para el cliente para subir logo y
  fotos, o se queda en WhatsApp → Devalpo sube desde `/admin` (D-42 deja la subida por el
  cliente "para después")? **Da una recomendación y su costo** para un equipo de una
  persona, incluida la ausencia de webhook (ver restricciones): el sistema no sabe quién
  pagó hasta que Devalpo confirma.
- **(h) Microcopy de cada paso** en español neutro de Chile, sin voseo. Prohibido
  "desbloquea" y "mejora tu sitio" (`README.md:348`). Di qué pasa mientras tanto, y que sea
  verdad.
- **(i) El techo de 80 %**: cómo se muestra y se redacta, y qué base usa (ver conflicto 2).
- **(j) Accesibilidad de las opciones clicables**: hoy son botones sin grupo ni estado
  seleccionado (`ChatWidget.tsx:76-90`); define foco, orden de tabulación, lectura de
  pantalla y qué pasa con el teclado.

## Restricciones verificadas en el repositorio

- **Next.js 16 App Router, CSS Modules, sin librerías de UI nuevas** (`AGENTS.md`;
  `handoff_bloques/README.md:24`). Componentes de servidor por defecto; cliente solo donde
  haga falta.
- **El chat demo no llama a Claude: cero costo en tokens.** `DemoChatService` es un guion
  fijo (`DemoChatService.ts:131-135`). Todo texto de pregunta que propongas debe poder ir
  en el guion; no puede depender de generar texto con un modelo. El modo con Claude
  (`ClaudeChatService`) está inerte sin clave (fuera de alcance).
- **Límite de 2 demos por IP al día** (`src/infrastructure/demo/demoRateLimit.ts:7`; la
  respuesta 429 se maneja en `ChatWidget.tsx:142-146`). Hay que diseñar ese estado.
- **Modelo de datos: `configJson` JSON con campos opcionales, sin migración.** Nada valida
  `configJson` en runtime (`SiteConfigDTO.ts:3-19`); cada campo se lee de forma defensiva.
  Un campo nuevo debe ser opcional y aditivo.
- **Pago: link fijo de Mercado Pago con confirmación manual, sin webhook.** El sistema no
  sabe que alguien pagó hasta que Devalpo lo confirma en `/admin`
  (`DemoCTA.tsx:8-11`; D-39). Un permiso "pagó / no pagó" no existe hoy en el producto.
- **Sin SVG** en subidas; JPEG, PNG y WebP de hasta 5 MB (D-42).
- **WhatsApp es el CTA principal** de los sitios (`README.md:351`).
- El correo del lead se precarga en `/login` desde la cookie, nunca desde la URL (D-30):
  no propongas pasar datos personales por query string.
- Una sola persona construye todo y compite en prioridad contra terminar las plantillas
  restantes.

## Entregable esperado

1. **`handoff_bloques_v2/03-CHAT-Y-MOMENTO-2.md`**, con la misma estructura que
   `02-SERVICIOS.md`: qué construir y por qué (con las respuestas (a) a (j) en prosa);
   pantallas o secciones en **escritorio y móvil con medidas**; estados; **cadena de
   degradación** (tabla estado → forma, como en `02-SERVICIOS.md:104-117`); campos del DTO
   con quién escribe cada uno (Chat / M2 / Admin); arquitectura (qué es servidor y qué es
   cliente); fuera de alcance.
2. Un **prototipo HTML** (`.dc.html`) con los estados del flujo: chat (preguntas con y sin
   botones, límite de IP), paso de datos con teléfono, **momento 2 con 0, algunas y todas
   las respuestas**, reveal con aviso D-39 y botón de pago, y post-pago.
3. Una sección final de **conflictos y preguntas abiertas**, como en
   `00-DECISIONES-TRANSVERSALES.md`: prefiere preguntar a suponer, y marca cuáles resolviste
   con una propuesta y cuáles necesitan respuesta del dueño.
4. Todo el microcopy, en español de Chile y sin voseo, listo para copiar al código.

## Fuera de alcance

- El chat con Claude real (inerte sin clave).
- Automatización de pagos o webhooks.
- Implementación de la subida de archivos por el cliente, salvo que la recomiendes en (g)
  y expliques su costo.
- Capítulos de RESTAURANTE, PORTFOLIO y TIENDA.
- Términos y condiciones y páginas legales (ya existen `/terminos` y `/privacidad` de
  WebBot; el bloque legal del sitio del cliente es la línea del footer de T7).
