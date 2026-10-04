# S2 · SERVICIOS en Bloques

> Rubros: peluquería, dentista, yoga, veterinaria. Prototipo: `S2 Servicios — Bloques.dc.html` (tres estados).
> Hereda todo de `handoff_bloques/README.md` (LANDING) con los ajustes de `00-DECISIONES-TRANSVERSALES.md`. Aquí solo va lo que difiere o se confirma.

## Qué construir y por qué

SERVICIOS es LANDING con tres diferencias: **la lista de servicios con precio reemplaza a las bandas de servicio**, **la banda de datos muestra horarios en vez de cifras**, y aparece una sección **"El lugar"** que solo existe si hay fotos propias.

La razón para no reutilizar las bandas de LANDING es que una peluquería o un dentista se eligen comparando: el visitante quiere ver los servicios **uno debajo del otro, con su precio**, en una sola mirada. Cuatro bandas de 400px cada una obligan a recorrer 1.600px para comparar cuatro precios. Una lista a ancho completo hace la misma comparación en un tercio del espacio, y sin fotos se sigue viendo bien: es la pieza de esta plantilla que funciona sin material propio (T10).

### Respuestas a las preguntas del brief

**(a) "Atención hoy" no va. Los horarios quedan como texto fijo.** Calcular el estado con la hora local exige un componente cliente, y el cupo de SERVICIOS ya lo ocupa el formulario (que arma el mensaje de WhatsApp con el servicio elegido, y eso convierte más). Además, "abierto ahora" es la única pieza de la plantilla que puede **mentir**: no conoce feriados ni vacaciones, y el día que el negocio cierra sin avisar, el sitio afirma algo falso. El horario como texto no tiene ese riesgo.

**(b) "Confianza clínica" sin salirse del sistema.** Se logra con **orden**, no con un tinte frío ni con radios suaves:

- Los precios aparecen a la vista y alineados a la derecha, en una sola columna.
- Los horarios van arriba, en la banda oscura, antes de los servicios.
- Hay una sola acción repetida en toda la página: agendar.

El acento del cliente pone el resto (un dentista suele elegir verde agua o azul, y una peluquería algo más cálido). La plantilla no le impone un color.

**(c) Las bandas de LANDING no sirven aquí; la lista sí.** Ver arriba. La lista es la misma para los cuatro rubros, porque los cuatro venden servicios con precio. Una lista de precios de peluquería con 15 ítems queda fuera del alcance (ver "Fuera de alcance").

## Secciones · escritorio

Orden: header · hero · banda de horarios · servicios · el lugar · Nosotros · contacto · footer.
Nav: **Inicio · Servicios · Nosotros · Contacto**. "El lugar" no va en el nav: es condicional y una etiqueta que aparece y desaparece descoloca.

| Sección | Fondo | Igual a LANDING | Diferencias |
|---|---|---|---|
| Header | `#FFF` | sí, 96px | CTA: **"Agenda tu hora"** |
| Hero | `#FFF` | sí | Botón primario: **"Agenda por WhatsApp"** |
| Banda de horarios | `--ink` | geometría de la banda de cifras | contenido, ver abajo |
| Servicios | `#F2F1ED` | encabezado igual | **lista**, ver abajo |
| El lugar | `#FFF` | — | nueva, condicional |
| Nosotros | acento | sí (con la cita, C3) | — |
| Contacto | `#FFF` | estructura igual | `<select>` de servicio; sin mapa (C1); horarios a la derecha |
| Footer | `--ink` | sí | línea legal (T7) |

### Banda de horarios

Padding `72px 96px`, flex con `align-items: center` y gap `72px`.

- **Rótulo:** "Horarios", `600 11px`, `letter-spacing: .26em`, mayúsculas, `rgba(255,255,255,.72)`.
- **Cada horario:** rango en `800 44px/1`, `-.04em`, `--wb-cyan`; día en `300 14px/1.6`, `rgba(255,255,255,.72)`; gap `22px`.
- **Separadores:** `border-left: 1px rgba(255,255,255,.16)` y `padding-left: 72px`.
- **Contenido:** el texto del campo tal cual, sin normalizarlo ni calcular nada. Se muestran como máximo 3 entradas; si hay más, la banda no se renderiza y los horarios quedan solo en la tarjeta de Contacto, donde caben como lista.

### Lista de servicios

El encabezado es igual que en LANDING: eyebrow y H2 `800 68px/1.04`, con `84px` de margen inferior.

El texto del H2 depende de los datos (T5.4): **"Servicios y precios"** si al menos un servicio tiene `precioDesde`, y **"Nuestros servicios"** si ninguno tiene.

Cada fila es un `grid` con `gap: 48px`, `align-items: baseline`, padding `40px 0` y `border-top: 1px #D9D6CC`. La lista cierra con un borde inferior igual.

| Celda | Estilo |
|---|---|
| Número | `800 15px`, acento |
| Nombre | `700 30px/1.2`, `-.03em`, `--ink`. **Sube a `40px` si ningún servicio tiene descripción** |
| Descripción | `300 16px/1.8`, `--ink-muted`, tope de `44ch` |
| Precio | alineado a la derecha: "desde" en `500 10.5px`, `.16em`, mayúsculas, `--ink-muted`; debajo el monto en `800 30px/1`, `-.03em`, `--ink` |
| Sin precio | en el lugar del precio va el enlace **"Agendar →"** (`600 13px`, acento, subrayado de `1.5px` con el tinte de 28 %), que abre WhatsApp con el servicio ya escrito |

Columnas: `72px 1fr 1.15fr 200px` si algún servicio tiene descripción, y `72px 1fr 200px` si ninguno la tiene. La columna del precio existe siempre, porque "Agendar →" la ocupa.

`precioDesde` es texto libre y se imprime tal cual. Si el cliente escribe "$25.000", se muestra "$25.000"; no se le agrega formato.

### El lugar

Padding `140px 96px`. Encabezado en fila: título "El lugar" en `800 52px/1.06`, `-.042em`, y a la derecha la comuna en `300 14px`, `--ink-muted`.

| Fotos en `imagenes[1..]` | Forma |
|---|---|
| 0 | **No se renderiza** |
| 1 | Una sola foto a ancho completo, `480px` de alto |
| 2 | Dos columnas `1fr 1fr`, `480px` de alto |
| 3 o más | `1.4fr 1fr`: la primera grande y las dos siguientes apiladas a la derecha, `560px` de alto. Solo se usan las tres primeras |

Gap de `20px` y sin radio. **Nunca con fotos de banco** (T9).

### Contacto

La columna izquierda tiene el formulario de tres campos:

1. Nombre.
2. `<select>` con los nombres de `servicios[]` y una primera opción "¿Qué servicio necesitas?".
3. "¿Qué día te acomoda?" (texto libre).

El botón **"Enviar por WhatsApp"** arma el mensaje con este formato: `Hola, soy {nombre}. Quiero agendar {servicio}. Me acomoda {día}.` Si un campo está vacío, se omite su frase.

La columna derecha lleva la tarjeta de horarios (borde `1.5px --line`, radio `16px`, padding `32px`, filas separadas por `1px #EFEEF4`) y, debajo, las tarjetas de teléfono y correo. Ya no lleva mapa (C1).

## Móvil

Aplican las reglas comunes de T6. Lo propio de esta plantilla:

- **Banda de horarios:** pasa a una lista vertical, con el día a la izquierda (`300 12.5px`) y el rango a la derecha (`800 22px`, cyan). Padding `28px 24px`.
- **Lista de servicios:** en cada fila, el número y el nombre van en la misma línea (`21px`, o `24px` si no hay descripciones). La descripción y el precio van debajo, con una sangría de `26px` que alinea con el nombre. El precio queda en línea: "desde $35.000".
- **El lugar:** las fotos se apilan, con `220px` de alto cada una.

## Cadena de degradación

| Sección | Completo | Mínimo (lo que captura el chat) |
|---|---|---|
| Header | logo según T3 | monograma y nombre |
| Hero | `imagenes[0]` propia | `imagenes[0]` de banco, como atmósfera |
| Banda de horarios | 1 a 3 rangos | **no se renderiza** |
| Servicios | descripción y precio por fila; la fila sin precio muestra "Agendar →" | solo nombres a `40px` y "Agendar →" en cada fila. H2 "Nuestros servicios" |
| El lugar | según la cantidad de fotos | **no se renderiza** |
| **Nosotros (ancla)** | dos columnas, tres tarjetas y la cita | una columna con la descripción. **Nunca desaparece** |
| Contacto | horarios y tarjetas | solo las tarjetas |
| Footer | logo en placa blanca y RUT | monograma y `© 2026 {nombre}` |

**Un solo servicio:** se mantiene la lista con una fila. A diferencia de LANDING, aquí la sección se justifica igual, porque responde "¿cuánto cuesta?".

## Campos del DTO

| Campo | Estado | Mínimo viable | Quién lo escribe |
|---|---|---|---|
| `servicios[]` (`string` o `{nombre, descripcion?}`) | existe | — | Chat |
| `servicios[].precioDesde?` | **nuevo** | texto libre | M2 |
| `horarios?: {dia, rango}[]` | **nuevo** | texto libre en ambos campos, de 1 a 3 entradas | M2 |
| `sobreNosotrosPartes?`, `highlight`, `highlightAutor?` | según T8 | — | M2 |
| `legal?` | **nuevo (T7)** | `{razonSocial, rut}` | Admin |

**Para el chat (sin pasar de 6 preguntas):** nada nuevo. Los precios y los horarios se capturan en M2, porque en el chat la pregunta sería larga y el visitante todavía no sabe para qué sirven.

## Arquitectura

- **Servidor:** todo, menos el formulario.
- **Cliente (el único de la plantilla):** el formulario de contacto, que arma el mensaje de WhatsApp. Se reutiliza el de LANDING agregándole la prop `servicios` para el `<select>`.
- No se suma ningún otro componente cliente: "Atención hoy" queda eliminado.

## Fuera de alcance

- Listas de precios largas (más de 8 ítems) con categorías. Si un cliente lo necesita, el caso es RESTAURANTE.
- Reserva con calendario o disponibilidad en vivo.
- El estado "abierto ahora".
- Fichas por profesional (por ejemplo, varios dentistas).
