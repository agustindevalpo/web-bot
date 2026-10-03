# Bloques para las cinco plantillas: decisiones transversales

> Responde las diez decisiones del brief `brief-bloques-plantillas.md`. Se escriben una sola vez y cada capítulo de plantilla las cita como **T1…T10**.
> Complementa `handoff_bloques/README.md` (LANDING). Cuando este documento contradice ese README, **manda este documento**. Los puntos marcados como **Ajuste al sistema** modifican también LANDING.
> Escrito en español de Chile, sin voseo. Todo el microcopy de este documento puede ir tal cual al sitio.

---

## T1 · Un solo sistema Bloques (opción A)

**Decisión: un único sistema para las seis plantillas.** Misma fuente, mismos radios, mismo ritmo, misma escala, mismo gutter, misma regla de hover, mismo header y mismo footer.

**Por qué.** El handoff viejo daba a cada plantilla serif, fondo oscuro y radios propios. Esa personalidad salía de la superficie, y la superficie es justo lo que cuesta mantener: seis hojas de estilo divergentes para una sola persona. En Bloques el carácter sale de la geometría (aire, escala, tracking), y la geometría se comparte gratis. Además, las dos variaciones más fuertes del handoff viejo no sobreviven al acento de cliente: un fondo oscuro obliga a una segunda derivación del acento (T2) y una serif obliga a cargar Instrument Serif en cada sitio.

**Qué varía entre plantillas (y nada más):**

1. **Qué secciones hay y en qué orden.** Es lo único que justifica tener cinco plantillas.
2. **La pieza que se ve bien sin material propio** (T10). Es la única sección con forma propia por plantilla.
3. **Qué muestra la banda de datos sobre `--ink`**: cifras (LANDING), horarios (SERVICIOS, RESTAURANTE) o credenciales (PROFESIONAL). Es el mismo componente con distintos datos.
4. **Las etiquetas del nav** (siempre 4).

**Qué no varía nunca:** Montserrat como única fuente; tracking (`-.048em` display, `-.042em` H2, `-.03em` títulos de ítem); escala del display en tres tramos; gutter de `96px`; padding de sección de `140px`; radios (píldora `999px` en botones y bloques rectos a sangre); fondos blanco y `#F2F1ED` alternados, con `--ink` solo en la banda de datos y el footer; hover solo de color, sin movimiento; header de `96px`; footer.

**Consecuencias en código:**

- **Ajuste al sistema:** Instrument Serif sale de todas las plantillas, LANDING incluida (`landing/index.tsx`), y también de `Monograma.module.css`. `shared/fuentes.ts` puede quedar como está; simplemente nadie lo importa.
- RESTAURANTE pierde el fondo `#171310`, PORTFOLIO pierde el navy de fondo y SERVICIOS pierde el tinte `#F4F8F7`.
- Lo compartido vive en `templates/shared/`: header, footer, banda de datos, bloque Nosotros, contacto, monograma, logo. Cada plantilla agrega solo su pieza propia y su orden.

---

## T2 · Acento: un solo clamp contra blanco basta para las seis

Mapeé cada uso del acento en las seis plantillas. Hay solo dos contextos donde lleva texto, y ambos se reducen a la misma medición:

| Contexto | Ejemplos | Requisito |
|---|---|---|
| Acento como **texto sobre blanco** | texto de la píldora del eyebrow, enlaces, número de ítem a 15px | contraste ≥ 4.5:1 contra `#FFF` |
| **Texto blanco sobre acento** | botones, bloque Nosotros completo | contraste ≥ 4.5:1 contra `#FFF` (el contraste es simétrico: es la misma medición) |
| Acento **sobre `--ink`** | — | **No se usa en ninguna plantilla.** La banda de datos usa `--wb-cyan`. Queda prohibido para no necesitar un segundo clamp. |
| Tintes decorativos (7 %, 18 %, 28 %) | fondo de la píldora, número gigante de la banda tipográfica, subrayado en reposo | Sin texto que leer. El número gigante es ornamento y lleva `aria-hidden`; el número real a 15px va en el título. |

**Decisión:** el `clampAcento` que hoy usa LANDING (bajar la luminosidad en OKLCH hasta 4.5:1 contra blanco) **se mueve a `shared/palette.ts` y lo usan las seis**. No hace falta ningún otro clamp.

Los derivados se calculan en CSS, no en JS:

```css
--acento-07: color-mix(in oklch, var(--acento) 7%, white);   /* fondo de píldora */
--acento-18: color-mix(in oklch, var(--acento) 18%, white);  /* número gigante */
--acento-28: color-mix(in oklch, var(--acento) 28%, white);  /* subrayado en reposo */
--acento-hover: oklch(from var(--acento) calc(l - .08) c h); /* botón en hover */
```

**Sin alfa sobre el acento, nunca.** Todo texto sobre el acento va en `#FFF` pleno. Los bordes o fondos internos sí pueden usar alfa (las tarjetas del bloque Nosotros usan `rgba(255,255,255,.14)`), porque no son texto.

Sobre `--ink`, el texto secundario puede ir con alfa, pero **nunca bajo `rgba(255,255,255,.66)`**.

---

## T3 · Logo: regla óptica y fondos oscuros

**Manda la base del dueño: 44px de alto en escritorio y 34px en móvil para un logo 3:1, con ancho máximo de 180px.** Reemplaza los 36px del README de LANDING (**ajuste al sistema**).

### Regla óptica: área constante con topes

Un logo se ve del mismo tamaño cuando ocupa **la misma área**, no cuando tiene la misma altura. Con `r = ancho / alto` de la imagen:

```
escritorio:  alto = clamp(28, √(5808 / r), 60);  si alto × r > 180 → alto = 180 / r
móvil:       alto = clamp(22, √(3468 / r), 46);  si alto × r > 140 → alto = 140 / r
```

`5808 = 44² × 3` (el área de un logo 3:1 a 44px). `3468 = 34² × 3`.

| Proporción | Escritorio | Móvil |
|---|---|---|
| 6:1 | 30 px (ancho 180, lo limita el ancho) | 23 px |
| 4:1 | 38 px (ancho 152) | 29 px |
| **3:1** | **44 px (ancho 132)** | **34 px** |
| 2:1 | 54 px (ancho 108) | 42 px |
| 1:1 | 60 px (lo limita el tope) | 46 px |
| 1:2 | 60 px (ancho 30) | 46 px |

El tope de alto de 60px existe porque el header mide 96px: deja 18px arriba y abajo. `r` se lee de las dimensiones del archivo al subirlo desde `/admin`, se guarda junto a la URL y se calcula en el servidor. Usa `object-fit: contain`.

### Logo sin nombre

**Si `r < 1.6`, el logo se trata como isotipo** (un símbolo sin texto) y **el nombre del negocio se muestra al lado** en `700 16px`, `-.02em`, con gap de `14px`. Si `r ≥ 1.6`, el logo reemplaza al monograma **y al nombre**: un logotipo ya contiene el nombre, y repetirlo se ve como un error.

### Fondos oscuros

El header es blanco en las seis plantillas, así que el logo nunca queda sobre oscuro en el header. El único fondo oscuro donde aparece es el **footer (`--ink`)**, y como los logos son raster (D-42, sin SVG), no se puede saber de forma confiable si son oscuros.

**Decisión: en el footer el logo va siempre sobre una placa blanca.** Fondo `#FFF`, padding `12px 16px`, sin radio (es un bloque recto, igual que el resto del sistema), y alto del logo igual al 80 % del alto del header. Es determinista, funciona con cualquier logo y se lee como intencional. **El logo nunca va sobre el bloque Nosotros** (el que tiene el fondo de acento).

---

## T4 · Monograma: Sans pesado en las seis

**Una sola variante vigente para todas las plantillas: Sans pesado.** Montserrat `800`, `letter-spacing: -.04em`, dos iniciales, en blanco sobre un cuadrado relleno de acento y sin radio. Es la regla "hereda la tipografía de su plantilla" aplicada a un sistema que tiene una sola tipografía.

**Ajuste al sistema:** `Monograma.module.css` se reduce a esa variante y se borran `serifCalado` y las otras dos, junto con su dependencia de Instrument Serif. LANDING deja de usar `serifCalado`.

Tamaños: `36×36px` en header de escritorio, `34×34px` en footer y `26×26px` en móvil, con iniciales a `40 %` del lado. En el footer va directo sobre `--ink`, sin placa: es una forma rellena de acento, así que se ve sobre cualquier fondo.

---

## T5 · Poco dato: la regla de la degradación

Cada capítulo de plantilla trae una tabla estado → forma para cada sección. Las reglas fijas son estas:

1. **Si falta un campo opcional, el elemento no se renderiza.** Nunca se rellena con datos de ejemplo, nunca queda un bloque vacío y nunca se inventan precios, horarios ni cifras.
2. **Se degrada por elemento, no por sección.** Una banda sin foto toma la forma tipográfica; un servicio sin precio pierde solo la columna del precio. La sección se sigue renderizando.
3. **El ancla de color es la misma en las seis plantillas: el bloque Nosotros a sangre en acento.** Es la única sección que **nunca desaparece**, porque su caso base usa `nombre`, `ciudad` y `descripcion`, y todo sitio los tiene. Sin ella, cualquier plantilla queda blanca y hueso de punta a punta.
4. **El texto de la plantilla puede adaptarse a los datos, pero nunca afirma algo que no esté en ellos.** Por ejemplo, el H2 dice "Servicios y precios" solo si al menos un servicio tiene precio, y si no, dice "Nuestros servicios".
5. **Los estados del prototipo son tres:** *completo*, *mínimo* (solo lo que el chat captura hoy: nombre, rubro, descripción, servicios como texto, ciudad, estilo, teléfono y correo, con la foto principal sacada del banco) y *mínimo + logo*.

---

## T6 · Móvil: sin excepciones

Un breakpoint (`max-width: 767px`), fila de nav deslizable, **sin hamburguesa**, header pegado de 44px con sombra y sin logo (el sticky es solo la fila). **Ninguna plantilla tiene excepción.**

El único candidato era la barra inferior fija de TIENDA, y se descarta:

- Tapa entre 70 y 80px de catálogo, justo en la plantilla que más necesita superficie.
- Con el header pegado arriba, la pantalla queda con dos franjas fijas, y un móvil de 640px de alto útil pierde más de un 20 % de altura.
- Su función ya la cubre otra pieza: cada producto lleva su propio enlace "Pedir por WhatsApp" (ver S5).

Reglas móviles comunes:

- La foto del hero sube por encima del titular.
- Las bandas se apilan siempre con la foto (o el número) arriba.
- El bloque Nosotros queda en una columna.
- El display pasa a `44px` en los tres tramos.
- Gutter de `24px` y padding de sección de `44px`.
- Altura táctil mínima de `44px`.

---

## T7 · Bloque legal: una línea en el pie, que identifica al negocio

**Va como una línea en la fila inferior del footer, no como sección propia.** La razón es de proporción: lo exigible para una pyme que vende por WhatsApp es identificar al proveedor, y eso cabe en una línea.

**Identifica a los dos, cada uno en su lado:**

- **Izquierda, el negocio del cliente:** `© {año} {razonSocial} · RUT {rut}`.
- **Derecha, el proveedor técnico:** `Hecho con WebBot · Devalpo` (ya existe).

Devalpo no es el vendedor de lo que se ofrece en el sitio. Por eso el negocio es el único identificado como titular.

**Campo nuevo:** `legal?: { razonSocial: string; rut: string }`. **Lo ingresa Devalpo desde `/admin` después del pago**, en el mismo momento que el logo y las fotos. El chat no lo pide: es fricción antes de que el visitante vea su sitio.

| Estado | Línea izquierda |
|---|---|
| `razonSocial` y `rut` presentes | `© 2026 Clínica Dental Arrieta SpA · RUT 76.543.210-K` |
| Falta cualquiera de los dos | `© 2026 {nombre}` |

Nunca se muestra `RUT: —` ni un RUT a medias. Como el formulario arma un mensaje de WhatsApp y no guarda datos, **no hace falta una política de privacidad** mientras no haya backend.

**Pregunta abierta para el dueño (no la resuelvo yo):** si un cliente activa Webpay o Mercado Pago, la Ley 19.496 exige términos y condiciones accesibles, y entonces sí se necesita una sección o una página aparte. Eso queda fuera de esta tanda.

---

## T8 · Costo de captura de cada campo nuevo

Quién lo escribe: **Chat** (las 6 preguntas, sin crecer), **M2** (momento 2, el cliente antes de pagar, solo texto) o **Admin** (Devalpo en `/admin` después del pago).

| Campo | Versión mínima viable | Quién | Veredicto |
|---|---|---|---|
| `servicios[].descripcion?` | una línea | M2 | **Se queda** (ya existe) |
| `servicios[].foto?` | URL | Admin | **Se queda.** Decide la forma de la banda en LANDING |
| `servicios[].precioDesde?` | texto libre: `"$25.000"` | M2 | **Se queda.** Texto y no número, para no forzar formato |
| `sobreNosotrosPartes?` | `{desde?, quien?, distinto?}`, una línea cada uno | M2 | **Se queda.** Son las tres tarjetas de Nosotros |
| `highlightAutor?` | `{nombre, cargo?}` | M2 | **Se queda.** Sin autor, la frase es una consigna |
| `horarios?` | `{dia: string, rango: string}[]`, texto libre en ambos | M2 | **Se queda, sin cálculo.** Ver S2: se elimina "Atención hoy" |
| `menu?` | `{categoria?, items: {nombre, precio?}[]}[]`, de 5 a 8 platos | M2 | **Se queda acotado.** Ver S3 |
| `productos?` | `{nombre, detalle?, precio?, foto?}[]`, de 4 a 8 | M2 (texto) + Admin (fotos) | **Se queda sin `categoria` ni `etiqueta`** |
| `trabajos?` | — | — | **Se sacrifica.** Los trabajos de PORTFOLIO salen de `imagenes[1..]`, como hoy. Los títulos por pieza no compensan el costo de captura |
| `proceso?` | — | — | **Se sacrifica.** Cuatro pasos que el cliente nunca escribe terminan inventados. La sección desaparece |
| `profesion` | — | — | **Se sacrifica.** Se deriva de `rubro` (ver T10 y S6) |
| `credenciales?` | `string[]`, de 1 a 3 líneas | M2 | **Se queda.** Es la banda de datos de PROFESIONAL |
| `trayectoria?` | — | — | **Se sacrifica en v1.** La línea de tiempo pide cuatro hitos con año, y en la práctica nadie los llena |
| `legal?` | `{razonSocial, rut}` | Admin | **Nuevo (T7)** |
| `logoRatio?` | número, calculado al subir el logo | Admin (automático) | **Nuevo (T3)** |

Salen **cinco campos** del alcance (`trabajos`, `proceso`, `profesion`, `trayectoria`, y `categoria` / `etiqueta` dentro de productos) y quedan dos nuevos que no cuestan captura al cliente (`legal` y `logoRatio`).

---

## T9 · Ranuras de foto: el arreglo plano se queda; la foto vive en el ítem

**Decisión: `imagenes: string[]` sigue plano** (D-42, sin migración):

- `imagenes[0]` es la foto principal del hero en todas las plantillas.
- `imagenes[1..]` es la galería de la sección de lugar o trabajos, según la plantilla.

**Las ranuras tipadas no van en un arreglo global: van en el ítem.** Es decir, `servicios[].foto` y `productos[].foto`. Así se elimina el problema de "tres fotos del mismo plato": cada foto se sube sobre el ítem que ilustra, y desde `/admin` Devalpo ve dónde va cada una.

| Plantilla | `imagenes[0]` | `imagenes[1..]` | Foto en ítem | Imprescindible para verse bien |
|---|---|---|---|---|
| LANDING | hero | — | `servicios[].foto` | nada |
| SERVICIOS | hero | "El lugar" (si hay 1 o más) | — | nada |
| RESTAURANTE | hero | "El local" (si hay 2 o más) | — | nada (ver S3) |
| PORTFOLIO | hero | trabajos (si hay 2 o más) | — | nada (sin fotos se ve como LANDING) |
| TIENDA | hero | — | `productos[].foto` | nada |
| PROFESIONAL | retrato | — | — | nada (sin retrato, el hero es solo tipográfico) |

**Fotos de banco: solo en `imagenes[0]` y solo como atmósfera.** Nunca en galerías, bandas, productos ni en el retrato de PROFESIONAL: ahí una foto genérica afirma algo falso sobre ese negocio o esa persona.

**Pregunta para el código (ver C2):** esta regla exige distinguir una foto de banco de una foto propia.

---

## T10 · La pieza que se ve bien sin material propio, por plantilla

| Plantilla | Pieza sin material | Qué la sostiene |
|---|---|---|
| LANDING | Banda de servicio con número gigante (forma A) | `servicios[].nombre` y `descripcion` |
| SERVICIOS | **Lista de servicios a ancho completo** con precio "desde" | `servicios[]` (con precio cuando existe) |
| RESTAURANTE | **La carta tipográfica** con guías punteadas | `menu` o, si no hay, `servicios[]` |
| PORTFOLIO | Banda de servicio con número gigante, **igual que LANDING** | `servicios[]`: sin fotos, PORTFOLIO es LANDING (ver S4) |
| TIENDA | **Fichas de producto tipográficas**: nombre grande, precio y "Pedir" | `productos` o `servicios[]` |
| PROFESIONAL | **Hero tipográfico + banda de credenciales** | `nombre`, `rubro` y `credenciales` |

Y en las seis, **el bloque Nosotros en acento** (T5.3).

---

# Conflictos y ambigüedades que encontré

Prefiero preguntar a suponer. Las marcadas con **→** las resolví con una propuesta; las demás necesitan respuesta.

- **C1 · El mapa no tiene datos.** El README de LANDING especifica un mapa en Contacto, pero el DTO no tiene dirección. **→ Ajuste al sistema:** se elimina el mapa. En su lugar, la columna derecha de Contacto lleva los horarios (si existen) y las tarjetas de contacto. Si en el futuro hace falta un mapa, se agregaría `contacto.direccion?`, pero hoy no lo propongo.
- **C2 · ¿Dónde viven las fotos de banco?** ¿Están guardadas en `configJson.imagenes` o se inyectan al renderizar? Si están guardadas, mi regla de "banco solo en el hero" necesita distinguirlas. **→ Propuesta sin cambiar el esquema:** un prefijo de ruta en R2 (`/banco/…`) que el render pueda leer. Necesito que lo confirmes antes de S3.
- **C3 · `highlight` no tiene lugar en el README de LANDING.** El README define `highlightAutor` pero no dice dónde va la frase. **→ Ajuste al sistema:** `highlight` se renderiza como cita de cierre **dentro del bloque Nosotros**:
  - Va bajo el párrafo, separada por un borde superior de `1px rgba(255,255,255,.3)` y con `40px` de padding superior.
  - La frase va en `700 24px/1.4`, `-.02em`, `#FFF`; el autor en `500 13px`, `#FFF`.
  - Si no hay frase, no se renderiza. Si hay frase pero no autor, se renderiza sin la línea del autor.
  - Excepción: en TIENDA la frase va a la franja superior (S5).
- **C4 · Tamaño del logo.** El README de LANDING dice 36px y el dueño 44px. **→ Gana el dueño** (T3).
- **C5 · Monograma.** El código usa `serifCalado` y el README dice Sans pesado. **→ Sans pesado en las seis** (T4).
- **C6 · Header.** El código mide 78px y Bloques 96px. **→ 96px en escritorio**; en móvil, 82px en reposo y 44px pegado.
- **C7 · Voseo en mi README anterior.** La prosa de `handoff_bloques/README.md` tiene voseo. **→** Ninguna de esas frases era microcopy del sitio, pero conviene corregir el README para que nadie las copie. Estos documentos ya están en tú.
- **C8 · PROFESIONAL como plantilla nueva.** **→ Propongo no crear el valor de enum** (ver S6, cuando llegue): con las decisiones de T8, PROFESIONAL queda como LANDING más dos cambios, y crear el enum exige una migración de Prisma sobre producción sin staging. **Necesito tu decisión** antes de S6.
- **C9 · ¿Desde qué cantidad se renderiza "El lugar"?** Lo dejé en 1 o más fotos en SERVICIOS y en 2 o más en RESTAURANTE y PORTFOLIO, porque en esas dos una foto sola se ve como un error de galería. Si prefieres una sola regla para las tres, dímelo.
