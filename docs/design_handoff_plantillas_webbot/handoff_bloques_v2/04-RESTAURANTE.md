# S4 · RESTAURANTE en Bloques

> Rubros: restaurante y panadería (`rubroTemplates.ts`).
> Prototipo: `S4 Restaurante - Bloques.dc.html`, con escritorio a 1280 px y móvil a 390 px en tres estados (Completo · Mínimo · Mínimo + logo). Todo el contenido del prototipo es ilustrativo.
> Sistema: `handoff_bloques/README.md` con los ajustes de `00-DECISIONES-TRANSVERSALES.md` (T1–T10), `01-RESPUESTAS-…` y `03-CHAT-Y-MOMENTO-2.md`. Si este documento contradice uno anterior, manda el más reciente. Aquí solo va lo que difiere o se confirma.
> Microcopy en español de Chile, sin voseo. El texto entre comillas es final.

---

## Resolución de las ambigüedades (Agustín, 2026-10-17)

Esta sección manda sobre "Ambigüedades pendientes" al final del documento.

- **P1 · Dirección: aprobada, para todas las plantillas.** `contacto.direccion?` (texto de una línea, máximo 60 caracteres) se pide en el **paso de datos del chat** (el formulario de nombre, correo y teléfono, antes del pago) como campo **opcional**. No se captura en el momento 2. Cualquier plantilla que muestre datos de contacto puede usarla.
- **P2 · Foto de banco en el hero: nunca.** RESTAURANTE no usa foto de banco en el hero. Sin una `imagenes[0]` propia, el hero es el tipográfico.
- **P3 · Panadería: opción (a).** Para el rubro `panaderia`, el formulario pasa a ser de **encargo**: "Tu nombre", "¿Qué quieres encargar?" (texto) y "¿Para cuándo?". Los textos cambian a "Encargar por WhatsApp" y "Haz tu encargo", y el mensaje a "Hola, soy {nombre}. Quiero encargar {pedido} para {cuándo}."

---

## Qué construir y por qué

RESTAURANTE es LANDING con cuatro diferencias:

1. **La pieza protagonista es la carta tipográfica con guías punteadas**, no las bandas de servicio. Es la pieza que se ve bien sin una sola foto (T10).
2. **El hero tiene una forma tipográfica propia** para cuando no hay foto, que es el caso de todo sitio recién entregado.
3. **La banda de datos muestra horarios**, igual que en SERVICIOS.
4. **El formulario es de reserva**: personas y cuándo, y arma un mensaje de WhatsApp.

Lo que se deja del diseño anterior: el fondo oscuro `#171310`, Instrument Serif, la cita en itálica, el degradado sobre la foto del hero y el "bloque de menú del día" (no tiene un campo que lo sostenga; ver Fuera de alcance).

### Respuestas a las preguntas del brief (S3)

**(a) ¿Cómo es el hero sin foto, y la carta sin foto?** La carta nunca usa fotos, así que no tiene una forma "sin foto". El hero sí: sin `imagenes[0]` propia pasa a una **cabecera tipográfica a ancho completo**, con el nombre, la descripción, los botones y una fila de tres datos reales (dónde, reservas y cuántos platos tiene la carta). Ver "Hero".

**(b) ¿La carta puede ser la pieza estrella?** Sí. Cumple la misma función que la banda con número gigante de LANDING: está hecha solo de texto que el chat ya captura (`servicios[]`) y crece cuando llegan los precios y las categorías.

**(c) ¿Cuál es el mínimo digno de una carta?** Entre 5 y 8 platos destacados. El componente muestra **como máximo 8**, y la captura en el momento 2 no deja ingresar más. Una carta de 20 a 60 platos no es el objetivo: el sitio muestra lo que distingue al local, no reemplaza la carta impresa.

### Una decisión que conviene revisar: sin foto de banco en el hero

T9 permite una foto de banco en `imagenes[0]`, como atmósfera. **En RESTAURANTE propongo no usarla nunca.** Una foto genérica de un restaurante muestra platos o un comedor, y el visitante los va a leer como los de este local: es justo la simulación que el encargo prohíbe. Por eso el estado mínimo usa el hero tipográfico.

Esto depende de la pregunta **C2** de `00-DECISIONES-TRANSVERSALES.md`, que sigue abierta: hay que saber si la foto de banco queda guardada en `imagenes[0]` o se agrega al mostrar el sitio. Ver **P2**.

---

## Secciones · escritorio (1280 px)

Orden: header · hero · banda de horarios · carta · el local · Nosotros · reservas · footer.
Nav: **Inicio · Carta · Nosotros · Reservas**. "El local" no va en el nav, porque es condicional.

| Sección | Fondo | Reutiliza | Qué cambia |
|---|---|---|---|
| Header | `#FFF` | `shared/Header`, 96 px | CTA: **"Reservar mesa"** |
| Hero | `#FFF` | hero de LANDING | Pieza nueva: **forma tipográfica** sin foto |
| Banda de horarios | `--ink` | `BandaDatos`, como en S2 | — |
| Carta | `#F2F1ED` | encabezado de sección | **Pieza nueva: `Carta`** |
| El local | `#FFF` | galería de "El lugar" de S2 | Mínimo 2 fotos propias |
| Nosotros | acento | `shared/Nosotros`, con cita (C3) | — |
| Reservas | `#FFF` | estructura de Contacto | **Formulario nuevo: `FormReserva`** |
| Footer | `--ink` | `shared/Footer` | Línea legal (T7) |

### Header

Es el compartido, con la regla de logo de T3. Botón: "Reservar mesa", que lleva al ancla `#reservas`.

### Hero con foto (`imagenes[0]` propia)

Es igual al de LANDING:

- Grid `1fr 1fr`, gap `80px`, padding `150px 0 0 96px`.
- Columna de texto con `150px` de padding inferior.
- Foto de `680px` de alto con `border-radius: 24px 0 0 24px`.
- **Sin degradado ni texto sobre la foto.** El texto va en su propia columna, así que el contraste no depende de la imagen.

| Pieza | Estilo |
|---|---|
| Píldora | "{rubro} · {ciudad}", con el estilo de LANDING. El rubro se escribe con su etiqueta: "Restaurante" o "Panadería" |
| H1 | `nombre`, con los tres tramos de escala del README |
| Párrafo | `descripcion`, `300 18px/1.85`, `--ink-muted`, tope `38ch` |
| Botón primario | **"Reservar por WhatsApp"**, lleva a `#reservas` |
| Botón secundario | **"Ver la carta"**, lleva a `#carta` |

### Hero sin foto (pieza nueva)

Se usa cuando no hay una `imagenes[0]` propia (ver P2).

- Una columna a ancho completo, padding `150px 96px 120px`.
- Píldora y H1 iguales a la versión con foto; el H1 con tope `14ch`.
- Bajo el H1, una fila `minmax(0,1fr) auto` con gap `96px` y `align-items: end`: el párrafo a la izquierda (tope `44ch`) y los dos botones a la derecha.
- **Fila de datos**, a `96px` del párrafo:
  - `border-top: 1px solid #101218` y grid `repeat(n, 1fr)`.
  - Cada celda: padding `28px 32px 0 0`.
  - Rótulo en `600 11px`, `.2em`, mayúsculas, `--ink-muted`, margen inferior `12px`.
  - Valor en `700 22px/1.3`, `-.02em`, `--ink`.

| Rótulo | Valor | Se muestra si |
|---|---|---|
| "Dónde" | `contacto.direccion` si existe; si no, `ciudad` | siempre |
| "Reservas" | `contacto.telefono` | existe el teléfono |
| "La carta" | "{n} platos" (o "1 plato") | siempre (hay al menos un servicio) |

Con dos celdas, la grilla pasa a `repeat(2,1fr)`. **No se agrega ningún dato que no exista.**

**Por qué esta forma y no una versión vacía de la de dos columnas:** sin foto, la columna derecha queda vacía o con un relleno. La fila de datos responde con hechos reales las tres preguntas de quien llega a un restaurante (dónde está, cómo reservo, qué sirven), y la línea negra le da a la cabecera el peso de una portada.

### Banda de horarios

Es `BandaDatos`, con las mismas medidas que en S2:

- Padding `72px 96px`, gap `64px`.
- Rótulo "Horarios".
- Cada entrada lleva `border-left: 1px rgba(255,255,255,.16)` y `padding-left: 56px`, con el día arriba (`600 11px`, `.2em`, mayúsculas, a 72 % de blanco) y el rango abajo (`800 40px/1`, `--wb-cyan`).
- Si el rango es "Cerrado" (sin distinguir mayúsculas), el rango va en `300 40px`, blanco y sin cyan, para que no se lea como un horario.
- **Como máximo 3 entradas.** Con 4 o más, la banda no se renderiza y los horarios quedan solo en la tarjeta de Reservas.
- Sin cálculo de "abierto ahora" (igual que en S2).

### Carta (pieza nueva) · `id="carta"`

Fondo `#F2F1ED` y padding `140px 96px`.

**Encabezado:**

- Eyebrow "La carta" con el estilo de LANDING.
- H2 en `800 68px/1.04`, `-.042em`, con `84px` de margen inferior.
- **El texto del H2 depende de los datos (T5.4):** "Nuestra carta" si al menos un plato tiene precio, y "Lo que preparamos" si ninguno tiene.

**Hay dos formas, según haya precios o no:**

#### Forma con guías (al menos un plato con precio)

- **Con categorías:** grid `1fr 1fr`, `column-gap: 96px`, `row-gap: 72px`, con una columna por categoría. Con 3 categorías, la tercera baja a la fila siguiente, a la izquierda.
- **Sin categorías:** con 6 a 8 platos, la lista se reparte en dos columnas sin título (la primera mitad a la izquierda, redondeando hacia arriba). Con 5 o menos, va en una sola columna con tope de `760px`.

**Título de categoría:** `600 11px`, `.26em`, mayúsculas, acento; `padding-bottom: 18px`, `border-bottom: 1px solid #101218`, margen inferior `8px`.

**Fila de plato:** `display: flex`, `align-items: baseline`, gap `16px`, padding `18px 0`.

| Celda | Estilo |
|---|---|
| Nombre | `700 24px/1.25`, `-.02em`, `--ink` |
| Guía | `flex: 1`, `min-width: 24px`, `border-bottom: 2px dotted #B9B5AA`, `transform: translateY(-6px)`, `aria-hidden="true"` |
| Precio | `800 24px/1`, `-.03em`, `--ink`, `font-variant-numeric: tabular-nums`, `flex: none` |

**Un plato sin precio no lleva guía ni precio**: queda solo el nombre. La guía existe para llevar el ojo hasta un precio, y una guía que termina en nada se lee como un dato faltante. Tampoco se escribe "Consultar" ni "Precio variable".

#### Forma grande (ningún plato tiene precio)

Es la forma del estado mínimo: la carta sale de `servicios[]`, que no tiene precios.

- Una sola columna con tope de `880px`.
- Cada plato en una fila con padding `30px 0` y `border-top: 1px #D9D6CC`, en `800 44px/1.12`, `-.04em`. La lista cierra con un borde inferior igual.
- Sin categorías ni guías.

Es el mismo recurso que la banda tipográfica de LANDING: con poco texto, la escala es lo que hace que la carta se vea intencional.

**Pie de la carta** (para las dos formas), a `64px` del último plato, en una fila con `justify-content: space-between`:

- A la izquierda, una nota en `300 14px/1.6`, `--ink-muted`, tope `56ch`:
  - Si hay precios: "Precios referenciales. Algunos platos varían según el día; confírmalos al reservar."
  - Si no hay: "Pregunta por el menú del día al reservar." **Solo si `servicios[]` o `menu` incluye un ítem cuyo nombre contiene "menú del día"**; si no, la nota no se renderiza.
- A la derecha, el enlace **"Reserva o pide por WhatsApp →"** (`600 13px`, acento, subrayado de `1.5px` con el tinte de 28 %), que abre WhatsApp con el mensaje "Hola, quiero hacer una consulta sobre la carta."

**Cuántos platos y en qué orden:** como máximo 8, en el orden en que se guardaron. Las categorías también se muestran en el orden en que se guardaron. Si `menu` trae más de 8 platos (por ejemplo, cargados desde `/admin`), se muestran los primeros 8 en el orden de lectura (de categoría en categoría) y el resto no se renderiza.

### El local · se renderiza solo con 2 o más fotos propias en `imagenes[1..]`

Es la galería de "El lugar" de S2, con otro título:

- Padding `140px 96px`.
- Encabezado en fila: "El local" en `800 52px/1.06`, `-.042em`, y a la derecha `ciudad` en `300 14px`, `--ink-muted`.

| Fotos propias en `imagenes[1..]` | Forma |
|---|---|
| 0 o 1 | **No se renderiza** (C9). Una foto sola se ve como una galería rota |
| 2 | Grid `1fr 1fr`, `520px` de alto |
| 3 o más | Grid `1.4fr 1fr`: la primera grande y las dos siguientes apiladas, `560px` de alto. Solo se usan las tres primeras |

Gap `20px` y sin radio. **Nunca con fotos de banco** (T9).

### Nosotros

Es igual al de LANDING (el ancla de color), con la cita de `highlight` adentro (C3) y la misma cadena de degradación. El H2 es "{nombre} en {ciudad}".

### Reservas · `id="reservas"`

Padding `140px 96px`, grid `1fr 1fr`, gap `96px`.

**Columna izquierda:**

- Eyebrow "Reservas".
- H2 **"Reserva tu mesa"** en `800 56px/1.06`.
- Párrafo: "Cuéntanos para cuántas personas y cuándo. Te respondemos por WhatsApp para confirmar." (`300 17px/1.85`, tope `40ch`, margen inferior `44px`).
- El formulario (ver "Formulario de reserva").

**Columna derecha**, centrada en vertical, con gap `20px`:

1. **Tarjeta de horarios**, si existen (estilo de S2). Muestra todas las entradas, incluidas las que no caben en la banda.
2. **Tarjeta de dirección**, si existe `contacto.direccion` (campo propuesto, P1).
3. **Tarjetas de WhatsApp y correo** en grid `1fr 1fr`. Instagram, si existe `redes.instagram`, va en el footer y no suma una tarjeta aquí.

Las tarjetas llevan borde `1.5px --line`, radio `16px` y padding `30–32px`, igual que en S2. **No hay mapa** (C1).

### Footer

Es el compartido. La glosa dice "{Rubro} en {ciudad}." y, si hay horarios, agrega las entradas en una sola frase: "Martes a sábado de 12:30 a 23:00, domingo de 12:30 a 17:00." Si hay 4 o más entradas, la glosa queda solo con la primera frase.

**La glosa del footer no repite "Cerrado".** Un día cerrado no se escribe como horario.

---

## Formulario de reserva (pieza nueva: `FormReserva`)

Es un componente cliente, el único de la plantilla. Reemplaza al formulario de contacto de LANDING en esta plantilla y no guarda nada: arma un mensaje y abre WhatsApp.

### Campos

Todos llevan un rótulo visible (`<label for>`) en `600 13px`, `--ink`, con margen inferior de `8px` (`6px` en móvil). El placeholder no reemplaza al rótulo.

| Campo | Control | Obligatorio | Notas |
|---|---|---|---|
| "Tu nombre" | `<input type="text" autocomplete="name">` | sí | máximo 40 caracteres |
| "Personas" | `<select>` | sí | Primera opción "Elige" (`value=""`); luego "1 persona", "2 personas" … "8 personas" y "Más de 8 personas" |
| "¿Para cuándo?" | `<input type="text">` | sí | Placeholder: "Por ejemplo: sábado a las 21:00". Máximo 40 caracteres |

**"¿Para cuándo?" es texto libre a propósito.** Un selector de fecha y hora sugiere que hay disponibilidad que el sitio no conoce, y ofrecer las 23:30 de un lunes cerrado sería prometer algo falso. El texto libre deja la confirmación a quien responde el WhatsApp.

En escritorio, "Personas" y "¿Para cuándo?" van en una fila `200px minmax(0,1fr)` con gap `16px`. En móvil, los tres campos van apilados.

**Medidas:**

- Escritorio: padding `18px 22px`; el `<select>` mide `58px` de alto.
- Móvil: los tres miden `52px` de alto.
- Todos: borde `1.5px #E2E0EC`, radio `12px`, `400 15px`.
- Foco: borde en acento y `box-shadow: 0 0 0 3px rgba(acento,.12)`, aplicado con `:focus-visible`.

### Botón y texto de apoyo

- **"Pedir reserva por WhatsApp"**, acento sólido, píldora, a ancho completo. Hover: acento oscurecido.
- Debajo, en `300 13px/1.6` `--ink-muted` (`12px` en móvil): "Se abre WhatsApp con tu mensaje listo. La reserva queda confirmada cuando te respondamos."

El texto de apoyo es obligatorio: es lo que evita que el visitante crea que ya reservó.

### Mensaje que arma

```
Hola, soy {nombre}. Quiero reservar una mesa para {personas}, {cuándo}.
```

`{personas}` va en minúsculas tal como se eligió: "2 personas", "más de 8 personas". `{cuándo}` va tal cual lo escribió el visitante, sin espacios al inicio ni al final. El texto completo se codifica con `encodeURIComponent` y se abre `https://wa.me/{telefono sin +}?text={mensaje}` en una pestaña nueva.

### Estados

| Estado | Qué se ve |
|---|---|
| **Reposo** | Campos vacíos y el botón activo. El botón **no** se deshabilita: así el visitante puede tocarlo y descubrir qué falta |
| **Foco** | Borde en acento y halo |
| **Error al enviar** | Cada campo vacío muestra su borde en `#B42318` (ya definido en S3) y su mensaje debajo, en `500 12.5px` `#B42318`, con `role="alert"`. El foco se mueve al primer campo con error. Cada campo lleva `aria-invalid="true"` y `aria-describedby` apuntando a su mensaje |
| **Corrección** | El error de un campo desaparece apenas tiene contenido válido. La validación se activa después del primer intento de envío y antes no |
| **Enviado** | Se abre WhatsApp y bajo el botón aparece una caja `#F2F1ED`, radio `16px`, padding `20px 22px`, con `role="status"`. Título: "Abrimos WhatsApp con tu mensaje". Texto: "Envíalo para pedir tu reserva. Si no se abrió, escríbenos al {teléfono}." El formulario conserva los datos, por si el visitante quiere corregir algo y volver a enviarlo |
| **Edición después de enviar** | Si el visitante cambia un campo, la caja de estado desaparece |
| **Ventana bloqueada** | Si `window.open` devuelve `null`, el mismo enlace se ofrece en la caja de estado como "Abrir WhatsApp" (enlace normal, `44px` de alto) |
| **Sin teléfono** (sitios viejos anteriores al paso de datos de S3) | El formulario **no se renderiza.** En su lugar va "Escríbenos para reservar." con la tarjeta de correo. Los botones del hero que dicen "Reservar por WhatsApp" pasan a "Escríbenos" y llevan a `mailto:` |

**Mensajes de error:**

| Campo | Mensaje |
|---|---|
| Nombre vacío | "Escribe tu nombre." |
| Personas sin elegir | "Elige para cuántas personas." |
| Cuándo vacío | "Cuéntanos para qué día y hora." |

### Accesibilidad

- El formulario es un `<form>` con `aria-labelledby` apuntando al H2 "Reserva tu mesa". Enter en cualquier campo lo envía.
- El orden de tabulación es el visual: nombre, personas, cuándo y el botón.
- La caja de estado es `role="status"` (se anuncia sin mover el foco); los errores son `role="alert"`.
- El texto de apoyo bajo el botón va enlazado con `aria-describedby` en el botón, para que el lector de pantalla lo lea antes de enviar.

---

## Móvil (390 px)

Aplican las reglas comunes de T6 y `01-RESPUESTAS-…`:

- Header de 86 px en reposo (42 px de marca y 44 px de nav), sin el botón "Reservar mesa", y de 44 px pegado.
- Fila de nav con scroll y sin hamburguesa.
- Botón flotante de WhatsApp, que se oculta mientras la sección Reservas está en pantalla.
- Gutter `24px`, padding de sección `44px`.

Lo propio de RESTAURANTE:

| Sección | Móvil |
|---|---|
| Hero con foto | La foto sube arriba, a `220px` de alto. H1 a `44px/.98`. Botones apilados de `46px` |
| Hero sin foto | Igual, sin foto. La fila de datos pasa a una lista: cada dato en una fila con el rótulo a la izquierda (`600 10px`, mayúsculas) y el valor a la derecha (`700 15px`), separadas por `1px #EFEEF4` y con el primer borde en `--ink` |
| Banda de horarios | Lista vertical: día a la izquierda (`300 12.5px`) y rango a la derecha (`800 19px`, cyan), separadas por `1px rgba(255,255,255,.14)`. Padding `28px 24px` |
| Carta con guías | Una columna; las categorías apiladas con gap `36px`. Título de categoría en `600 10px`. Plato: nombre en `700 17px/1.3`, guía de `1.5px dotted`, precio en `800 17px`, padding `13px 0`, gap `10px`. Si el nombre no cabe en una línea, se parte en dos y la guía queda alineada con la última línea |
| Carta grande | Platos en `800 26px/1.15`, padding `20px 0` |
| El local | Fotos apiladas, de `220px` de alto cada una, con gap `10px` |
| Reservas | Los tres campos apilados, de `52px`. La columna de tarjetas pasa debajo, todas a ancho completo |

---

## Cadena de degradación

| Sección | Completo | Mínimo (lo que deja el chat) |
|---|---|---|
| Header | Logo según T3 | Monograma y nombre |
| Hero | Foto propia, dos columnas | **Hero tipográfico** con la fila de datos (Dónde, Reservas, La carta) |
| Banda de horarios | De 1 a 3 entradas | **No se renderiza** |
| Carta | Guías, categorías y precios; los platos sin precio muestran solo el nombre | **Forma grande** con los nombres de `servicios[]`. H2 "Lo que preparamos" |
| El local | 2 o más fotos propias | **No se renderiza** |
| **Nosotros (ancla)** | Dos columnas, tres tarjetas y cita | Una columna con la descripción. **Nunca desaparece** |
| Reservas | Formulario, horarios, dirección y tarjetas | Formulario y tarjetas de WhatsApp y correo |
| Footer | Logo en placa, horarios en la glosa, RUT | Monograma y "© {año} {nombre}" |

**Casos intermedios** (la carta se decide por plato, no por sección):

| Situación | Resultado |
|---|---|
| `menu` con precios y sin categorías | Forma con guías, en 1 o 2 columnas según la cantidad de platos |
| `menu` con categorías y sin ningún precio | **Forma grande**, con los títulos de categoría arriba de cada grupo (estilo de la forma con guías). Sin guías |
| `menu` con algunos platos sin precio | Forma con guías; esos platos llevan solo el nombre |
| Una categoría con un solo plato | Se muestra igual. No se fusiona con otra |
| Sin `menu` y con `servicios[]` | Forma grande con los nombres de `servicios[]`. Si un servicio es `{nombre, descripcion}`, se usa solo el nombre |
| Sin `menu` y sin `servicios[]` | La sección no se renderiza y "Carta" sale del nav (igual que la regla de cero servicios en `01-RESPUESTAS-…`) |
| Un solo plato | Forma grande con una fila. H2 igual. Sin número, porque la carta no lleva números |
| Solo `imagenes[1]` (una foto propia del local) | El local no se renderiza; la foto no se usa en otro lugar |

---

## Campos

### Existentes (ya en `SiteConfigDTO`)

| Campo | Uso en RESTAURANTE | Quién lo captura hoy |
|---|---|---|
| `nombre`, `rubro`, `descripcion`, `ciudad` | Hero, Nosotros, footer | Chat |
| `servicios[]` | Carta en forma grande, cuando no hay `menu` | Chat |
| `contacto.telefono`, `contacto.email` | Formulario, tarjetas y footer | Paso de datos (S3) |
| `imagenes[]` | `[0]` hero; `[1..]` El local | Admin |
| `logo`, `logoDimensiones` | Header y footer | Admin |
| `horarios?` | Banda y tarjeta | M2 (S3, tarea 2) |
| `sobreNosotrosPartes?`, `highlight`, `highlightAutor?` | Nosotros | M2 (S3, tareas 3 y 4) |
| `redes?` | Footer | Admin (S3, C1) |
| `legal?` | Footer | Admin (T7) |

### Propuestos

| Campo | Tipo | Quién lo captura | Estado |
|---|---|---|---|
| `menu?` | `{categoria?: string, items: {nombre: string, precio?: string}[]}[]` | **M2**, tarea "Tu carta". Admin puede editarlo | Diseño definido; **captura sin implementar** |
| `contacto.direccion?` | `string`, máximo 60 caracteres | **Paso de datos del chat, opcional** (P1 resuelta) | **Aprobado** 2026-10-17 |

**Reglas de `menu`:**

- Entre 1 y 8 platos en total, y como máximo 3 categorías.
- `precio` es texto libre y se imprime tal cual: "$11.900" se muestra como "$11.900". No se le da formato.
- `categoria` es opcional en cada grupo. Si un grupo no tiene categoría y otros sí, ese grupo se muestra primero y sin título.
- Si `menu` existe con al menos un plato, **reemplaza** a `servicios[]` en la carta; `servicios[]` no se mezcla.

### Tarea "Tu carta" en el momento 2 (agrega a `03-CHAT-Y-MOMENTO-2.md`)

Reemplaza a "Describe tus servicios" en RESTAURANTE.

- **Abre con una fila por cada servicio del chat**, con el nombre editable y precio opcional, y permite agregar filas hasta 8. El enlace "Agregar otro plato" desaparece al llegar a 8.
- **Categorías:** un enlace "Agrupar por tipo (opcional)" agrega a cada fila un campo "Tipo" con tres sugerencias fijas en el guion: "Entradas", "Fondos" y "Postres". El visitante puede escribir otra.
- Título: "Tu carta". Ayuda: "Hasta 8 platos que te representen. El precio es opcional; si no lo pones, se muestra solo el nombre."
- Marcadores: "Nombre del plato" · "Precio (opcional)" · "Tipo".
- Largos máximos: nombre 40 caracteres, precio 20, tipo 20.

**Pesos del avance en RESTAURANTE** (el total sigue siendo 45, como en `03-…` (i)):

| Tarea | Peso |
|---|---|
| Tu carta | 15 |
| Horarios | 10 |
| Quién está detrás | 10 |
| Frase de un cliente | 10 |

`TAREAS_POR_PLANTILLA.RESTAURANTE` suma estas cuatro tareas, así que "Paso X de 4". La antesala del resumen muestra: "Logo · Foto principal · El local · 3 fotos", con el texto "Nos los mandas por WhatsApp cuando pagues. Mientras tanto, tu sitio muestra tu nombre en grande y no muestra fotos del local."

---

## Arquitectura

| Pieza | Tipo | Notas |
|---|---|---|
| `templates/restaurante/index.tsx` | servidor | Reescrito sobre `shared/`. Elimina el fondo oscuro, la serif y la galería vieja |
| `shared/Header`, `shared/Nosotros`, `shared/Footer`, `shared/BandaDatos`, `shared/Galeria` | servidor | Se reutilizan sin cambios. `Galeria` recibe `minimo={2}` |
| `restaurante/HeroRestaurante` | servidor | Elige entre la forma con foto y la tipográfica. Si la forma tipográfica sirve también a otras plantillas, se mueve a `shared/` en S5 |
| `restaurante/Carta` | servidor | Recibe `menu` o `servicios[]`, normaliza a `{columnas, conPrecios}` y elige la forma. La normalización es una función pura en la capa de aplicación (`normalizarCarta`), con tests de cada fila de la tabla de casos intermedios |
| `restaurante/FormReserva` | **cliente** | El único de la plantilla. Recibe `telefono` |
| Componente del nav y del botón flotante | cliente | El mismo de LANDING. Observa `#reservas` para ocultar el botón |

Sin librerías nuevas. Sin backend nuevo.

---

## Fuera de alcance

- Carta exhaustiva (más de 8 platos), con descripción por plato, alérgenos o fotos por plato.
- **Menú del día** como bloque propio. No hay un campo que lo sostenga y cambia a diario: un sitio que muestra el menú de ayer engaña. Si un cliente lo necesita, se resuelve con un plato llamado "Menú del día" en la carta.
- Reservas con disponibilidad, calendario, confirmación automática o integración con plataformas de reserva.
- Pedidos para llevar o delivery con carrito. El enlace de la carta abre una conversación, nada más.
- El estado "abierto ahora".
- Mapa.
- Las tareas de PORTFOLIO y TIENDA.

---

## Ambigüedades pendientes

> **Resueltas el 2026-10-17.** Ver "Resolución de las ambigüedades" al inicio. Se conserva el texto original del diseñador.

Las marcadas con **→** las resolví con una propuesta. Las demás necesitan respuesta antes de implementar.

- **P1 · Dirección.** Un restaurante sin dirección es raro, y el DTO no la tiene (C1). Propongo `contacto.direccion?`, de una línea, capturado en la tarea "Horarios" del momento 2 con el rótulo "¿Dónde está tu local?" (sube esa tarea de 2 a 3 campos, sin cambiar su peso). En el prototipo aparece marcada como "Campo propuesto". **¿Lo apruebas, y prefieres que lo capture M2 o Admin?** Si no se aprueba, la tarjeta y el dato del hero usan `ciudad` y la plantilla funciona igual.
- **P2 · Foto de banco en el hero.** Sigue abierta C2 (si la foto de banco queda guardada en `imagenes[0]`). Para RESTAURANTE propongo no usar nunca foto de banco, porque cualquier foto genérica de un restaurante simula platos o un local. **¿Confirmas?** Si el banco de RESTAURANTE solo tuviera texturas sin platos ni comedores, se podría reconsiderar, pero aun así recomiendo el hero tipográfico.
- **P3 · Panadería.** Comparte la plantilla. Los rótulos "Reservar mesa", "Reserva tu mesa" y el formulario de personas no tienen sentido en una panadería. Hay dos salidas:
  - (a) Para el rubro `panaderia`, el formulario pasa a un **pedido**: "Tu nombre", "¿Qué quieres encargar?" (texto) y "¿Para cuándo?". Los textos cambian a "Encargar por WhatsApp" y "Haz tu encargo", y el mensaje a "Hola, soy {nombre}. Quiero encargar {pedido} para {cuándo}."
  - (b) Mover `panaderia` a TIENDA cuando exista.
  - Recomiendo (a), porque es un cambio de textos y de un campo. **Necesito tu decisión**: afecta los textos del header, del hero y de Reservas.
- **→ P4 · "Menú del día".** La nota "Pregunta por el menú del día al reservar." solo aparece si algún ítem lo menciona, para no afirmar algo que el local no ofrece.
- **→ P5 · Más de 3 horarios.** La banda no se renderiza y los horarios quedan en la tarjeta de Reservas y en la glosa del footer (solo la primera frase), igual que en S2.
- **→ P6 · Orden de categorías.** Se respeta el orden en que se guardaron. No se ordenan por alfabeto ni por un orden "Entradas → Fondos → Postres" impuesto, porque el visitante puede usar otros nombres.
