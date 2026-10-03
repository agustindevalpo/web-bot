# Brief para el diseñador: "Bloques" para las cinco plantillas restantes

> **Para qué es este documento.** Pegarlo en Claude Design como punto de partida. Trae el
> contexto que no tienes (no tienes memoria de WebBot), lo que hoy existe en el código y lo
> que no, las decisiones transversales que necesitamos que **respondas por escrito**, y las
> restricciones que no se negocian. Las decisiones de diseño dentro de esas restricciones
> son tuyas.
>
> Escrito el 2026-10-03 desde el código, no de memoria. Cada afirmación cita archivo; si
> algo no se pudo verificar, está marcado como pregunta abierta.

## El encargo, en una línea

Entrégame, para **SERVICIOS, RESTAURANTE, PORTFOLIO, TIENDA y PROFESIONAL**, el mismo
paquete "Bloques" que entregaste para LANDING (`handoff_bloques/README.md`): sistema,
secciones en escritorio y móvil, cadenas de degradación, campos de datos, arquitectura y
fuera de alcance, con la precisión suficiente para que la implementación **no tenga que
inventar diseño**.

## Qué es WebBot (lo mínimo que necesitas)

- Fábrica de sitios web para PyMEs chilenas, operada por Devalpo, un equipo de **una
  persona** (`docs/ESTADO.md` §1). Promesa: "tu sitio web en un día". Pago único.
- Un chat demo de pocas preguntas genera el sitio del visitante; el sitio se muestra
  antes de pagar. Cada sitio es un JSON (`configJson`, tipo `SiteConfigDTO`) renderizado
  por **una de cinco plantillas**, elegida por rubro (`src/infrastructure/templates/rubroTemplates.ts:7-18`).
- Material del cliente, y cuándo llega (D-36, D-42 en `docs/DECISIONES.md`): el **texto**
  se captura antes de pagar; el **logo y las fotos** llegan **después de pagar**, y hoy los
  sube Devalpo desde `/admin` (formatos JPEG, PNG y WebP hasta 5 MB; **SVG no**). Consecuencia
  de diseño: en el momento en que el visitante decide si paga, su sitio casi nunca tiene
  fotos propias ni logo.

## Por qué Bloques, y qué autoridad tiene cada documento

Bloques se eligió (D-38) porque es la dirección que **mejor aguanta a un cliente con poco
material** y se ve más cara con menos esfuerzo de llenado. Tu propio README lo explica: el
carácter sale de la geometría (aire, escala, tracking), no de las fotos.

| Documento | Autoridad |
|---|---|
| `docs/design_handoff_plantillas_webbot/handoff_bloques/README.md` (369 líneas) | **Autoridad del sistema visual.** Tokens, geometría, tipografía, animación, reglas duras, formato del entregable. Léelo completo antes de empezar. |
| `docs/design_handoff_plantillas_webbot/README.md`, líneas ~213-392 | **Solo fuente de contenido** por plantilla (qué secciones, qué campos). Su sistema visual **queda superado** donde choca con Bloques (ver "Conflictos"). |
| `docs/design_handoff_plantillas_webbot/PLAN-SLICES.md` | Orden de construcción: S2 a S6; PROFESIONAL al final. |
| `docs/DECISIONES.md` (D-24, D-27, D-32, D-33, D-36, D-38, D-40, D-42) | Decisiones vigentes. Ninguna se reabre en este encargo salvo lo que pides abajo. |

### Dato importante sobre el estado real de LANDING

El README de Bloques para LANDING es la especificación, **pero hoy no está implementado en
sus medidas**. Lo que sí está en código: el shell de scroll largo con nav de anclas y fila
móvil deslizable (`shared/SeccionesSPA.tsx`, D-33), el monograma, el slot de logo y la
descripción por servicio. Lo que no: la geometría de Bloques (padding de sección 140px,
gutter 96px, display hasta 104px, bandas de servicio, banda de cifras, bloque Nosotros a
sangre). `landing/Landing.module.css` sigue con la escala anterior (p. ej. padding `56px 44px`
en las líneas 238, 322 y 415) y `landing/index.tsx` aún usa Instrument Serif. Dos
implicaciones para ti:

1. **No existe una "implementación de referencia" que copiar.** Tu README es la única
   referencia; si algo en él es ambiguo para otra plantilla, dilo.
2. **Tu entrega puede tocar la base compartida.** Si al diseñar las cinco ves que algo de
   LANDING-Bloques debe cambiar para que el sistema cierre, señálalo como "ajuste al sistema".

## Qué existe hoy en datos (todo lo que el diseño puede dar por cierto)

`src/application/dtos/SiteConfigDTO.ts`: `nombre`, `rubro`, `descripcion`,
`sobreNosotros?`, `servicios` (cada uno `string` o `{nombre, descripcion?}`), `ciudad`,
`contacto {telefono, email, formulario?}`, `redes {instagram?, facebook?}`, `estilo`,
`highlight` (una frase), `imagenes?: string[]`, `colores?: {acento}`, `destacados?:
{valor, etiqueta}[]`, `logo?: string`. **Nada más.**

Campos que **tus propios documentos ya asumen y no existen aún**:

| Origen | Campos |
|---|---|
| `handoff_bloques/README.md:317-324` | `servicios[].foto?`, `sobreNosotrosPartes?`, `highlightAutor?` |
| `README.md` viejo, 381-392 | `horarios?`, `precioDesde?`, `menu?`, `productos?`, `trabajos?`, `proceso?`, `profesion`, `credenciales?`, `trayectoria?` |

Cómo se llenan hoy: el chat pregunta 8-9 cosas y baja a **6** (D-36: nombre, rubro,
descripción, servicios, ciudad, estilo). Un campo nuevo **no tiene productor** hasta que se
decida cómo se captura; hoy la única vía para llenarlo es editar el JSON en `/admin`. Por
eso necesitamos que, **para cada campo nuevo, digas cuál es su versión mínima viable** y si
vale la pena su costo de captura (ver decisión 8).

Rubros hoy (`rubroTemplates.ts:7-18`; cualquier otro, incluido `otro`, cae a LANDING):

| Plantilla | Rubros reales en código |
|---|---|
| SERVICIOS | peluqueria, dentista, yoga, veterinaria |
| RESTAURANTE | panaderia, restaurante |
| PORTFOLIO | taller |
| TIENDA | ferreteria, tienda |
| LANDING (referencia) | consultora + fallback |
| PROFESIONAL | **ninguno todavía** |

(Los ejemplos del README viejo —cafetería, delivery, boutique, constructora, fotografía—
son orientativos, no rubros del código.)

## Conflictos entre el handoff viejo y Bloques: tú resuelves

El README viejo especifica estas cosas, que chocan con Bloques. Decide cada una (ver
decisión 1):

| Tema | Handoff viejo | Bloques |
|---|---|---|
| Tipografía | Instrument Serif en titulares de RESTAURANTE y PROFESIONAL (también en `Monograma.module.css`) | "Bloques no usa serif" (`README.md:38`) |
| Fondo | RESTAURANTE `#171310` oscuro; PORTFOLIO navy `#080056`; SERVICIOS `#F4F8F7` | Blanco / `#F2F1ED` alternos, `--ink` solo en cifras y footer |
| Radios | 2-14px según plantilla | Píldoras 999px y bloques rectos, "no unificar" |
| Header | 74-78px; hoy el código usa 78px (`SeccionesSPA.tsx:38`) | 96px |
| Navegación | Pestañas SPA | Scroll largo con anclas (D-33, ya vigente) |
| Acento | `colores.primario` | Un solo acento derivado (D-27, D-32) |

## Las cinco plantillas

Para cada una: lo que el handoff viejo propuso (referencia de **contenido**, no de
estilo), lo que existe, y las preguntas a resolver. Todas las secciones deben seguir el
patrón Bloques: nav de 4 anclas, secciones de escritorio y móvil, regla "campo opcional
ausente = elemento no se renderiza".

### S2 · SERVICIOS

- **Contenido propuesto** (`README.md:213-243`): nav Inicio · Servicios · El lugar ·
  Contacto; píldora "Atención hoy · {horario}"; tarjeta de horarios superpuesta; servicios
  en grilla de 2×2 con precio; 3 fotos del lugar; formulario con `<select>` de servicio que
  arma el mensaje de WhatsApp; footer oscuro derivado del acento.
- **Existe hoy:** hero con imagen, `servicios[]` con descripción opcional, formulario con
  `mailto:` (`servicios/index.tsx:87-95`), `highlight`, sin header propio ni logo.
- **Nuevo:** `horarios?: {dia, rango}[]`, `servicios[].precioDesde?`.
- **Preguntas:** (a) ¿"Atención hoy" se calcula en cliente con la hora local? El handoff
  viejo lo pide; eso exige un componente cliente adicional (restricción 3). Dime si lo
  mantienes o lo reduces a texto estático. (b) ¿Cómo se traduce "confianza clínica" a
  Bloques sin salirse del sistema? (c) ¿Las bandas de servicio de Bloques sirven aquí o
  una peluquería necesita otra forma (p. ej. lista de precios)?

### S3 · RESTAURANTE

- **Contenido propuesto** (`README.md:247-277`): hero fotográfico con degradado obligatorio
  para contraste; carta a dos columnas con guías punteadas por categoría; bloque de menú
  del día; fotos del local; formulario de reservas que arma el WhatsApp; cita itálica.
- **Existe hoy:** carta construida desde `servicios[]` plano (sin precios ni categorías),
  galería con `imagenes[1..]` (`restaurante/sections.ts:79-81`), `highlight` como estrella
  suelta, sin header propio ni logo.
- **Nuevo:** `menu?: {categoria, items: {nombre, precio}[]}[]`. Propuesta vieja: si falta,
  caer a `servicios[]` plano.
- **Preguntas:** (a) Bloques promete aguantar sin fotos, pero un restaurante vive de la
  foto: ¿cuál es la forma "sin foto" del hero y de la carta? (b) ¿La carta tipográfica
  puede ser la pieza estrella (equivalente a la banda de número de LANDING)? (c) Una carta
  real tiene 20-60 ítems y hoy nadie la captura: ¿cuál es el mínimo digno (p. ej. 5-8
  platos destacados)?

### S4 · PORTFOLIO

- **Contenido propuesto** (`README.md:281-307`): hero tipográfico con círculos decorativos;
  fila de 3 cifras; trabajos con chips de filtro 100% cliente y pieza destacada 2×2; 4
  pasos "Cómo trabajo" coloreados con los 4 colores de marca; formulario de 2 campos.
- **Existe hoy:** "trabajos" derivados de `imagenes[]` (`portfolio/sections.ts:69-78`),
  `destacados?`, footer minimalista propio. No hay títulos ni categorías por pieza.
- **Nuevo:** `trabajos?: {titulo, categoria, foto}[]`, `proceso?: {titulo, detalle}[]`.
- **Regla del handoff viejo (`README.md:307`):** con menos de 4 fotos la grilla colapsa a
  2 piezas y **nunca se rellena con fotos de banco**.
- **Preguntas:** (a) Es la plantilla que más depende de material posterior al pago:
  ¿cuál es su versión "cero fotos" (el estado normal al momento de decidir pagar)?
  (b) Los filtros por categoría son un componente cliente: ¿se justifican o se elimina?
  (c) "Cómo trabajo" con textos fijos sería inventar contenido del cliente: ¿qué hace la
  sección si `proceso` no existe? ¿Desaparece?

### S5 · TIENDA

- **Contenido propuesto** (`README.md:311-337`): franja de promoción superior (reusa
  `highlight`); mosaico de 3 piezas en el hero; catálogo en grilla de 4 con chips de
  categoría, precio, etiqueta y botón "Pedir" por WhatsApp en cada tarjeta; "Consultar"
  cuando no hay precio; barra inferior fija en móvil.
- **Existe hoy:** banner con imagen, catálogo desde `servicios[]`, WhatsApp, sin precios
  ni fotos por producto, sin logo.
- **Nuevo:** `productos?: {nombre, detalle, precio, categoria, etiqueta?, foto}[]`.
- **Preguntas:** (a) Un catálogo de 4 columnas con foto por producto es el caso de **más
  material**: ¿cómo se ve una tienda con 6 productos y ninguna foto? (b) La barra inferior
  fija en móvil choca con la regla "sin hamburguesa, header pegado de 44px": ¿cómo
  conviven? (c) La franja de promoción reutiliza `highlight`: ¿qué pasa si está vacío o es
  largo?

### S6 · PROFESIONAL (tipo nuevo)

- **Contenido propuesto** (`README.md:341-373`): abogado, contador, psicólogo,
  nutricionista; el producto es **una persona**: retrato, credenciales, trayectoria. Nav
  Inicio · Áreas · Trayectoria · Agendar; fila de credenciales en lugar de cifras; tarjeta
  de años de experiencia; áreas numeradas en romanos; línea de tiempo de 4 hitos; si no hay
  `trayectoria`, la pestaña no aparece en el nav.
- **No existe en código:** el enum `Template` solo tiene 5 valores
  (`src/domain/value-objects/Template.ts`). Exige valor nuevo, migración de Prisma sobre
  producción sin staging, rubros nuevos en el chat y en `rubroDefaults.ts`
  (`PLAN-SLICES.md:61-72`). Por eso va último; el diseño puede hacerse igual.
- **Nuevo:** `profesion`, `credenciales?: string[]`, `trayectoria?: {anio, hito, detalle}[]`.
- **Preguntas:** (a) ¿Cuánto de esta plantilla es realmente distinto de SERVICIOS-Bloques
  y LANDING-Bloques? Si la respuesta es "poco", propón fusionarla o reducirla a una
  variante y dilo explícitamente. (b) Todo depende del retrato: ¿qué se ve sin foto (el
  monograma ocupando el lugar)? (c) Preguntas del chat para estos rubros: sugiere qué
  habría que preguntar, pero sin crecer de 6 preguntas.

## Decisiones transversales: responde cada una por escrito, en prosa

Un agente de diseño tiende a dejar estas cosas implícitas en la maqueta. Aquí no vale:
cada una necesita un párrafo con la respuesta y su razón.

1. **¿Un solo sistema Bloques o personalidad por plantilla?** Hoy el handoff viejo da
   serif, fondos oscuros y radios propios a RESTAURANTE, PORTFOLIO y PROFESIONAL. Elige:
   (A) un único sistema Bloques con las mismas fuentes, radios y ritmo en las seis; o (B)
   personalidad por plantilla. Si eliges (B), enumera **qué puede variar** (¿paleta de
   fondos? ¿una segunda fuente?) y **qué no** (¿tracking, escala, gutter, regla de
   hover?). Recuerda el costo: una sola persona mantiene todo, y cada variación es CSS
   propio por plantilla.
2. **Acento.** Debe funcionar con la derivación existente de **un solo acento** en OKLCH
   (D-27, D-32): `shared/palette.ts` entrega `--acento` y tres derivados
   (`--primario`, `--secundario`, `--texto`). LANDING baja la luminosidad del acento hasta
   4.5:1 **contra blanco** (`landing/index.tsx:30-32`, `clampAcento`). Dime: qué usa cada
   plantilla (acento sobre blanco, sobre `--ink`, sobre oscuro) y qué contraste objetivo
   necesita en cada caso. **Sin alfa sobre el acento** (regla de Bloques, `README.md:84`).
3. **Logo.** Para cada plantilla: cómo aparece en header y en footer, y sobre qué fondo
   (¿un logo oscuro sobre footer `--ink`?). Base actual: **44px de alto en escritorio y
   34px en móvil**, `object-fit: contain`, tope de ancho 180px (`Landing.module.css:44-52,
   598-600`), decisión del dueño que **difiere de los 36px de tu README** (`README.md:258`).
   Está en curso un ajuste "óptico" que escala la altura según la proporción para que un
   logo vertical angosto no se vea diminuto (`odd/tasks/logo-optico-y-huerfanos-r2.md`).
   Pedimos: la **regla óptica** (qué altura para 4:1, 1:1, 1:2; tope de área) y el
   tratamiento de fondos oscuros. Como SVG no se acepta (D-42), todo logo es raster.
4. **Monograma (sin logo).** Tu README dice **"Sans pesado"** (Montserrat 800, cuadrado
   relleno de acento, sin radio, `README.md:249`). El código hoy usa otra cosa:
   `Monograma.module.css` define cuatro variantes y LANDING usa `serifCalado` (letras
   en serif sin caja). Confirma cuál es la vigente para **cada** plantilla; si es una sola,
   dilo.
5. **Poco dato: cadena de degradación por sección.** Para cada sección de cada plantilla,
   una tabla estado → cómo se ve, al estilo de la de Nosotros (`README.md:218-228`).
   Regla fija: **campo opcional ausente = elemento no se renderiza; nunca se rellena con
   datos de ejemplo, nunca un bloque vacío, nunca precios ni horarios inventados.** Indica
   explícitamente qué sección de cada plantilla **nunca desaparece** (el "ancla de color").
6. **Móvil.** Un solo breakpoint (hoy `max-width: 767px`), fila de nav deslizable, **sin
   hamburguesa**, header pegado de 44px con sombra. Cada plantilla debe respetarlo; di si
   alguna necesita una excepción (p. ej. la barra fija de TIENDA) y por qué.
7. **Bloque legal dentro de las plantillas (D-40).** Queda para esta tanda. Define qué
   muestra y dónde va (¿pie de página? ¿una sección?). Pregunta abierta que el código no
   resuelve: ¿identifica al **negocio del cliente** (razón social y RUT, que el chat hoy no
   pide) o a **WebBot/Devalpo** como proveedor, o ambos? Propón una opción y su degradación
   cuando faltan esos datos.
8. **Costo de captura de cada campo nuevo.** Para cada campo de la tabla "Campos que no
   existen aún": versión mínima viable, quién la escribe (cliente en el chat, cliente
   después, Devalpo en `/admin`) y si lo **sacrificarías**. Bajar el alcance es una
   respuesta válida.
9. **Ranuras de foto.** Hoy `imagenes: string[]` es plano: `imagenes[0]` es la foto
   principal de todas las plantillas y el resto es galería (D-42). Tu prototipo anterior
   hablaba de ranuras rotuladas ("principal", "quien atiende", "un detalle"). Decide:
   ¿se queda el arreglo plano o pasa a ranuras tipadas? Si pasan a ranuras, lista las de
   cada plantilla, cuáles son obligatorias para que la plantilla se vea bien y cuál es la
   forma sin foto de cada una.
10. **Equivalente de la banda tipográfica.** En LANDING, la forma primaria de la banda de servicio
    (número grande, sin foto) existe porque no hay fotos al momento de pagar. Para cada
    plantilla, indica cuál es su equivalente: **la pieza que se ve bien sin ningún
    material propio.**

## Restricciones que no se negocian

Verificadas en el repositorio o en decisiones vigentes:

1. **Next.js 16 App Router**, TypeScript, **CSS Modules**; sin Tailwind, sin
   styled-components, sin librerías de UI nuevas (`handoff_bloques/README.md:24`).
2. **Montserrat es la fuente base**, cargada en `src/app/layout.tsx:13`. Instrument Serif
   existe pero está cargada de forma acotada y no se importa en el layout raíz
   (`shared/fuentes.ts`): usarla en una plantilla es una decisión consciente, no gratis.
3. **Componentes de servidor por defecto.** Hoy el único cliente del shell es
   `SeccionesSPA` (`SeccionesSPA.tsx`, "único componente cliente bajo templates/") más el
   formulario de contacto de LANDING. Cada plantilla puede sumar **como máximo un
   componente cliente propio**; justifica cada interacción cliente (filtros, "abierto
   hoy", formularios) contra ese tope.
4. **Retrocompatibilidad total del DTO:** todo campo nuevo es **opcional**, no se agrega
   ninguno obligatorio, y un sitio ya publicado no puede romperse (`SiteConfigDTO.ts`,
   `handoff_bloques/README.md:315`). Nada valida `configJson` en runtime, así que
   cualquier entrada puede llegar cruda al render.
5. **Nunca inventar datos del cliente** (precios, horarios, descripciones, cifras).
6. **Imágenes con `next/image`** y dimensiones explícitas, URLs públicas del bucket R2;
   hoy son JPEG/PNG/WebP de hasta 5 MB.
7. **Los formularios arman un mensaje de WhatsApp** (`wa.me/<tel>?text=...`), no
   `mailto:` ni backend (`PLAN-SLICES.md:93-95`). El teléfono es el CTA principal.
8. **Una sola persona construye todo**, una plantilla por ciclo de revisión pequeño.
   Prefiere soluciones que reutilicen el shell, los tokens y el monograma compartidos.
9. **Español neutro de Chile, nunca voseo**, en todo microcopy ("Escríbenos", "Cuéntanos",
   no "Escribinos"). Tu README anterior tiene voseo en su prosa ("Abrilo", "describí",
   "desbloqueá"): no lo copies a textos que vaya a ver un visitante.

## Qué esperamos recibir

- **Un documento por plantilla** (o uno con un capítulo por plantilla) con la **misma
  estructura que `handoff_bloques/README.md`**: qué construir y por qué; sistema (solo lo
  que difiere o se confirma); secciones en escritorio con medidas; móvil; cadena de
  degradación por sección; campos del DTO (existentes / nuevos, con su mínimo viable);
  arquitectura (qué es servidor y qué cliente); fuera de alcance.
- **Prototipos HTML**, escritorio y móvil, de cada plantilla **con tres estados de
  datos**: completo, mínimo (solo lo que el chat ya captura hoy) y mínimo + logo.
- Un capítulo breve de **respuestas a las diez decisiones transversales**, redactado una
  sola vez y referenciado desde cada plantilla.
- **Orden de entrega** (puede ser plantilla por plantilla): S2 SERVICIOS, S3 RESTAURANTE,
  S4 PORTFOLIO, S5 TIENDA, S6 PROFESIONAL. Entrega primero las decisiones transversales:
  las demás dependen de ellas.
- Una lista corta de **conflictos o ambigüedades** que encuentres en tu propio README de
  Bloques o en este brief. Prefiero una pregunta explícita a una suposición silenciosa.

## Fuera de alcance

- Rediseñar LANDING (salvo "ajustes al sistema" que detectes).
- El flujo de captura y el guion del chat: ya tiene su propio diseño (D-36). Aquí solo
  sugieres qué haría falta preguntar.
- Subida de archivos por el propio cliente, y cualquier superficie de edición.
- Pagos, dominios propios, panel `/admin`.
- Testimonios múltiples, FAQ, logos de clientes del cliente, blog, e-commerce con
  carrito (`handoff_bloques/README.md:355-362`).
- Un séptimo tipo `LOCAL DE BARRIO` (`PLAN-SLICES.md:112-115`).
- Código de producción: entrega especificación y prototipos, no el componente.
