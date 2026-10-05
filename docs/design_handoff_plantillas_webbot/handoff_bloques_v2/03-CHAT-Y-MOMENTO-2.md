# S3 · Chat de onboarding y momento 2 en Bloques

> Responde `brief-momento-2-bloques.md` (2026-10-04).
> Prototipo: `S3 Chat y momento 2 - Bloques.dc.html`. Pantallas móviles a 390 px (C1–C3, R1–R3, M1–M5, G1) y dos de escritorio (E1, E2). Los códigos de pantalla se citan en todo el documento.
> Sistema: `handoff_bloques/README.md` con los ajustes de `00-DECISIONES-TRANSVERSALES.md` (T1–T10) y `01-RESPUESTAS-…`. Aquí solo va lo que difiere o es nuevo.
> Todo el microcopy está en español de Chile, sin voseo, y puede ir tal cual al código. Lo que va entre comillas es texto final.

---

## Qué construir y por qué

Hay cuatro piezas, en este orden de prioridad:

1. **El chat de 6 preguntas, rediseñado en Bloques** (C1–C3). Ya está decidido (D-36); falta el diseño.
2. **El paso de datos con teléfono** (R1). Es un cambio chico con mucho impacto: sin teléfono, el botón principal del sitio no funciona.
3. **El momento 2** (M1–M5, E2). Es la superficie que llena por fin los campos que las plantillas ya muestran.
4. **La página `/gracias`** (G1). Es estática y su existencia depende de una pregunta abierta (P1).

La razón de negocio: los campos de precio, horarios, Nosotros y cita **ya se renderizan en LANDING y SERVICIOS en producción**, pero solo se pueden llenar editando JSON. Cada sitio que se entrega hoy muestra el estado mínimo, aunque el cliente tenía la información y nadie se la pidió.

### (a) Estilo del chat: se rediseña en Bloques

**Decisión: el chat pasa a Bloques.** Deja el navy `#080056` de fondo, las burbujas `#0d0080` y la declaración de `Inter`.

**Por qué:**

- **El visitante pasa del chat a su sitio en el mismo minuto.** Si el chat es navy y cian y el sitio es blanco, hueso y con el acento del cliente, el reveal parece un cambio de producto. Con Bloques en los dos lados, el reveal se lee como la continuación natural del chat.
- **Mantener dos sistemas lo paga una sola persona.** Bloques ya tiene sus reglas escritas (tipografía, radios, hover, tracking); el sistema del chat no las tiene y hoy ni siquiera carga su fuente (la fuente efectiva es Arial).
- **El costo es bajo:** reescribir `src/app/chat/page.module.css` y los estilos del formulario. No cambia ningún componente de lógica.

**Cómo se distingue la herramienta del sitio:** el chat y el momento 2 usan **`--wb-purple` (`#5B46F8`) como acento**; todo lo que es vista previa del sitio usa el **acento del cliente**. El visitante ve siempre qué es WebBot y qué es su sitio. El navy de marca queda solo para el logotipo de WebBot si se usa como imagen; en la interfaz no aparece.

**El gesto de Bloques aplicado al chat:** **la pregunta activa manda.** Va a `700 24px` en móvil (`32px` en escritorio) y lo ya respondido baja a `14px`. Es el mismo contraste de escala que separa a Bloques de una plantilla genérica: un chat donde todo mide 15px se ve como cualquier widget.

### (b) Dónde vive el momento 2: en una pantalla propia, después del reveal

**Decisión: el reveal muestra primero el sitio y después invita a completarlo.** El momento 2 se abre en una ruta propia, `/chat/completar`, con **una tarea por pantalla**. Al cerrarlo, el visitante vuelve al reveal con el sitio actualizado.

**Por qué no dentro del chat:** describir cuatro servicios con precio son ocho campos. En burbujas de chat serían ocho preguntas más y el chat crecería de 6 a 14, que es justo lo que D-36 quiso evitar. Además, el chat es secuencial y el momento 2 tiene que poder omitirse, retomarse y editarse.

**Por qué no "el sitio es el formulario" (edición en el lugar, conflicto C3):** exige que las plantillas tengan un modo editable, es decir, componentes cliente dentro de cada sección de cada plantilla, con estados de foco y guardado propios. Son semanas de trabajo para una persona, y cada plantilla nueva (RESTAURANTE, PORTFOLIO, TIENDA) heredaría ese costo. La alternativa elegida, en cambio, es independiente de la plantilla: el momento 2 solo escribe en el `configJson`, y la plantilla se limita a mostrar el resultado.

**El orden del reveal (R2 → R3, E1):**

1. El sitio (vista previa).
2. El avance ("Tu sitio está al 35 %") con el botón **"Completar mi sitio"**.
3. La caja de pago, con el **aviso D-39 antes del botón** y su texto intacto.

El pago **nunca depende del momento 2**: la caja de pago está siempre en la misma pantalla del reveal, y el visitante puede pagar sin completar nada. Como el reveal sigue mostrando la vista previa arriba, la condición de haber visto el sitio antes de pagar se cumple siempre. Al terminar el momento 2, el botón final dice "Ver mi sitio y continuar" y lleva de vuelta al reveal, donde el sitio ya se ve actualizado y la caja de pago queda abajo.

### (c) Cómo se ve aterrizar cada respuesta: antes y después, al guardar

**Decisión: no hay vista previa mientras se escribe.** Al guardar cada tarea, la sección real del sitio se recarga y se muestra (M2 en móvil, columna derecha en E2).

**Por qué no en vivo:** el `iframe` no se refresca solo, y lograrlo exigiría renderizar las plantillas en el cliente o mandar `postMessage` en cada tecla. Las dos opciones duplican la lógica de render. Al guardar, en cambio, el render es **el mismo que verá el público**, sin una segunda implementación.

**De dónde sale el render:**

- La acción de servidor que guarda la tarea llama a `revalidatePath` sobre la ruta del sitio demo.
- El cliente cambia la `key` del `iframe` para forzar la recarga.
- El `src` lleva el ancla de la sección que cambió (`#servicios`, `#horarios`, `#nosotros`) y un parámetro `?v={contador}` para evitar la caché. El contador no es un dato personal, así que no choca con D-30.

**Velocidad:** guardar y recargar toma alrededor de un segundo. La promesa de los dos minutos se cumple porque **el momento 2 empieza después del reveal**: el tiempo hasta ver el sitio no cambia.

En escritorio (E2), la columna de vista previa dice **"Se actualiza al guardar"**, para que nadie espere verla cambiar mientras escribe.

### (d) Diferencias por plantilla: un solo flujo con tareas condicionales

**Decisión: hay un solo flujo, y la lista de tareas sale de una tabla por plantilla.** El componente es uno solo y lo que varía es qué tareas aparecen y qué campos tiene cada una.

| Tarea | LANDING | SERVICIOS | RESTAURANTE · PORTFOLIO · TIENDA |
|---|---|---|---|
| 1 · Describe tus servicios | descripción | descripción + precio desde | como LANDING hasta su capítulo |
| 2 · Tus horarios | — | sí | — |
| 3 · Quién está detrás | sí | sí | como LANDING |
| 4 · Una frase de un cliente | sí | sí | como LANDING |
| **Total de tareas** | **3** | **4** | **3** |

El texto "Paso X de N" se calcula con el total de la plantilla, así que una LANDING nunca muestra un "Paso 2 de 4".

**Cambio de rubro:** la plantilla se fija en la pregunta 2 del chat, antes del momento 2. El momento 2 lee la plantilla **al abrirse**. Como después del reveal no se vuelve al chat, la plantilla no cambia a mitad del momento 2. Si en el futuro se permite cambiar el rubro después, los datos guardados se mantienen igual (todos los campos son aditivos) y solo cambia qué tareas se muestran.

### (e) Omitir y estado mínimo

- **Cada tarea tiene "Omitir este paso".** Omitir no guarda nada: el campo queda ausente y la plantilla no renderiza el elemento (T5).
- **Una tarea omitida no se marca como error.** En el resumen dice "Lo omitiste · suma 10 %" y ofrece "Responder" (M3).
- **Un sitio sin nada de momento 2 es el estado mínimo de S2,** que es de primera clase: lista de servicios con los nombres a 40px y "Agendar →", Nosotros en una columna con la descripción, y sin banda de horarios. El reveal lo muestra al 35 % sin ningún mensaje de alerta.
- **El momento 2 se puede retomar** desde "Completar mi sitio" o "Editar respuestas" del reveal, mientras Devalpo no haya confirmado el pago (ver estados).

### (f) Móvil primero, a 390 px

Todas las medidas de este documento están pensadas primero para 390 px de ancho. Las alturas táctiles son estas:

- Botones primarios y opciones: **52px**.
- Sugerencias, chips y enlaces de acción ("Omitir este paso", "Volver al inicio"): **44px**.
- Botón de cerrar (X): **44 × 44px**.
- Campos: **48px** en el momento 2 y **52px** en el paso de datos.

En móvil, la barra inferior del momento 2 queda fija y respeta `env(safe-area-inset-bottom)`.

### (g) Después del pago: WhatsApp y `/admin`, más una página `/gracias`

**Recomendación: no construir ahora una superficie para que el cliente suba su logo y sus fotos.** El cliente las manda por WhatsApp y Devalpo las sube desde `/admin`, como hoy (D-42).

**El costo de construirla ahora:**

- No hay webhook, así que **el sistema no sabe quién pagó**. Haría falta un permiso de "pagado" que hoy no existe en el producto, atado a `confirmarPagoAction`, más un acceso autenticado del cliente (`/login` existe, pero no hay un panel de cliente) y un subidor con control de propiedad.
- En total son **entre 3 y 5 días de trabajo** de una sola persona, que compiten con terminar RESTAURANTE, PORTFOLIO y TIENDA.
- A cambio, ahorran unos **10 a 15 minutos por cliente** de trabajo de Devalpo.

**Cuándo vale la pena revisarlo:** cuando el trabajo manual supere unas 5 horas al mes, que es alrededor de 25 a 30 sitios pagados por mes.

**Lo que sí recomiendo construir: `/gracias` (G1),** una página de servidor estática, sin datos del visitante, de **medio día de trabajo**:

- No afirma que el pago está confirmado, porque el sistema no lo sabe. Dice qué pasa ahora y qué tener a mano.
- Lleva un botón de WhatsApp hacia Devalpo con un mensaje ya escrito.
- Que exista depende de que el link de Mercado Pago admita una URL de retorno (P1). Si no la admite, el mismo contenido va en el **primer mensaje de WhatsApp de Devalpo**, y el texto queda escrito en la sección de microcopy.

### (h) Microcopy

Está completo en la sección **Microcopy** más abajo, por pantalla. Sigue cuatro reglas:

- **Nunca** "desbloquea", "mejora tu sitio" ni "potencia".
- Cada estado incompleto dice **qué se ve mientras tanto** y lo que dice es verdad: "tu sitio usa tus iniciales", "en tu sitio solo se ve su nombre".
- Se habla de tú y sin voseo: "describe", "cuéntanos", "puedes", "escribe".
- Sin emojis. El cierre actual del guion pierde el 🚀.

### (i) El techo de 80 %: base de 35 % y suma por tarea completa

**Resuelve el conflicto 2.** El modelo:

| Parte | Aporte | Cuándo cuenta |
|---|---|---|
| **Chat y paso de datos** | **35 %** | siempre al llegar al reveal (6 respuestas + nombre, correo y teléfono) |
| **Texto (momento 2)** | **45 %** | ver la tabla por plantilla |
| **Archivos** | **20 %** | logo 10 % y fotos 10 %, solo después del pago, cargados por Devalpo |

**Reparto del 45 % por plantilla:**

| Tarea | LANDING | SERVICIOS |
|---|---|---|
| Servicios (y precios) | 20 | 15 |
| Horarios | — | 10 |
| Quién está detrás | 15 | 10 |
| Frase de un cliente | 10 | 10 |
| **Total** | **45** | **45** |

**Regla de suma: una tarea suma completa si se guarda con al menos una respuesta.** No hay porcentajes proporcionales. Por ejemplo, describir 1 de 4 servicios suma lo mismo que describir los 4.

Es deliberado: el porcentaje sirve para motivar, no para medir. Con una regla proporcional aparecerían decimales ("47 %") y el visitante sentiría que lo castigan por dejar un servicio sin precio, cuando eso es legítimo. Para el estado real de cada tarea está la línea de detalle del resumen ("3 de 4 descritos").

La función es una sola, pura, en la capa de aplicación: `calcularAvance(config, plantilla): number`. La usan el reveal, el momento 2 y `/admin`.

**Cómo se muestra:**

- **Barra de 8px de alto** con tres tramos:
  - Lo logrado: `--wb-purple`.
  - Lo que falta hasta el 80 %: `#DCD7FD`.
  - El último 20 %: rayado gris, con `repeating-linear-gradient(135deg, #CFCBC0 0 3px, #EDEBE5 3px 7px)`.
- Bajo la barra, a la derecha: "Logo y fotos: después del pago".
- **Al llegar al 80 %, el titular cambia** a "Completaste todo lo que se puede antes del pago." (M5). Es un logro, no un límite.
- **La barra nunca dice 100 % antes del pago**, porque no puede llegar a 100.

### (j) Accesibilidad de las opciones clicables

**Se mantienen como botones** (no como radios), para conservar el contrato D-29: un clic envía la etiqueta exacta.

| Aspecto | Comportamiento |
|---|---|
| **Grupo** | El contenedor lleva `role="group"` y `aria-labelledby` con el `id` del texto de la pregunta activa. Si hay ayuda ("También puedes escribir tu respuesta."), va en `aria-describedby`. |
| **Orden de tabulación** | Los botones en orden visual y después el campo de texto y el botón de enviar. Las sugerencias de servicios (C2) van antes del campo. |
| **Foco** | Anillo de 3px, `box-shadow: 0 0 0 3px rgba(91,70,248,.18)`, con el borde en `--wb-purple`. Se ve igual con el mouse o con el teclado, pero se aplica con `:focus-visible`. |
| **Teclado** | Enter y Espacio activan el botón (es un `<button>` nativo). No hay navegación con flechas: con 2 a 4 opciones, Tab basta. |
| **Después de responder** | El grupo se reemplaza por la burbuja con la respuesta y **el foco pasa al campo de texto**. Las opciones respondidas no quedan en el historial como botones, así que el lector de pantalla no las vuelve a anunciar. |
| **Mensajes nuevos** | La lista de mensajes es `role="log"` con `aria-live="polite"`. Cada pregunta nueva se anuncia una vez. |
| **Sugerencias (C2)** | Son `<button type="button">` con `aria-label="Agregar Limpieza a tu respuesta"`. Al tocarlas, el texto se agrega al campo, el foco vuelve al campo y el cursor queda al final. |
| **Avance** | La barra de 6 segmentos es `role="progressbar"`, con `aria-valuemin="1"`, `aria-valuemax="6"` y `aria-valuenow`. El texto "4 de 6" queda visible. |
| **Barra de porcentaje** | `role="progressbar"`, con `aria-valuemax="100"` y `aria-valuetext="35 %. El 20 % final se completa después del pago."` |
| **Errores del formulario** | Cada campo con error lleva `aria-invalid="true"` y `aria-describedby` apuntando a su mensaje. Al enviar con errores, el foco va al primer campo con error. |

---

## Sistema (lo que difiere de las plantillas)

| Elemento | Valor |
|---|---|
| Acento de la interfaz | `--wb-purple` `#5B46F8`; hover `#4632DE` |
| Tinta / tinta suave | `#101218` / `#565E6B`; ayuda larga `#3F4652` |
| Fondo | `#FFFFFF`. Tarjetas suaves `#F2F1ED` (avance, límite) y notas `#F7F6F2` |
| Bordes | campos `1.5px #E2E0EC`, opciones `1.5px #D8D6E4`, separadores `1px #EFEEF4` |
| **Error** (nuevo, solo en formularios) | `#B42318` en borde y texto. Contraste de 6,5:1 sobre blanco |
| Fuente | Montserrat. **Se elimina `Inter`** de `page.module.css` |
| Radios | botones y opciones `999px`, campos `12px`, tarjetas `20px`, vista previa `16px` |
| Gutter móvil | `24px` (`16px` solo en la barra de respuesta y en la tarjeta del paso de datos) |

---

## Pantallas · móvil a 390 px

### Chat (C1, C2, C3)

**Header:** `52px` + barra de avance, con un borde inferior de `1px #EFEEF4`.

- Izquierda: "WebBot" en `800 16px`, `-.03em`, y "por Devalpo" en `500 11px` `#565E6B`, con gap de `8px`.
- Derecha: "{n} de 6" en `600 12px` `#565E6B`.
- Barra: 6 segmentos de `3px` de alto, gap `4px`, radio `2px`. Completos en `--wb-purple`, pendientes en `#E2E0EC`. Padding inferior `12px`.

**Historial:**

- Mensaje del bot ya respondido: `400 14px/1.55`, `#565E6B`, sin burbuja, ancho máximo `88%`.
- Respuesta del visitante: burbuja a la derecha, `#101218`, texto blanco `500 14px/1.45`, padding `10px 14px`, radio `18px 18px 4px 18px`, ancho máximo `80%`.
- Gap entre mensajes: `10–12px`.

**Pregunta activa** (con `24px` de margen superior):

| Pieza | Estilo |
|---|---|
| Rótulo | "Pregunta {n} de 6", `600 11px`, `.2em`, mayúsculas, `--wb-purple`, margen inferior `12px` |
| Pregunta | `700 24px/1.25`, `-.02em`, `#101218`, margen inferior `22px` (`10px` si hay ayuda) |
| Ayuda | `400 14px/1.55`, `#565E6B`, margen inferior `18px` |

**Opciones (C1):**

- Apiladas a ancho completo si son 4 o menos y ninguna supera los 28 caracteres. Si no, van en fila con salto de línea.
- Botón: alto mínimo `52px`, padding `0 22px`, borde `1.5px #D8D6E4`, radio `999px`, `600 15px` `#101218`, gap `10px`.
- Hover: borde `--wb-purple` y fondo `#F6F4FE`.
- Foco: lo mismo, más el anillo.
- En la lista de 11 rubros, las opciones van en fila, con `44px` de alto y `600 14px`.
- Bajo las opciones: "También puedes escribir tu respuesta." en `400 12.5px` `#565E6B`.

**Sugerencias (C2):**

- En fila con salto de línea y gap `8px`. Alto `44px`, padding `0 16px`, borde `1.5px #D8D6E4`, radio `999px`, `500 14px`.
- Llevan un "+" delante en `700`, `--wb-purple`.
- Tocar una sugerencia agrega `{texto}, ` al final del campo. Si el texto ya está en el campo, la sugerencia se oculta.

**Barra de respuesta:**

- Padding `12px 16px calc(12px + env(safe-area-inset-bottom))` y borde superior `1px #EFEEF4`.
- Campo: `48px` de alto, radio `12px`, borde `1.5px #E2E0EC`, `400 15px`. Al tener foco: borde `--wb-purple` y halo `0 0 0 3px rgba(91,70,248,.12)`.
- Botón de enviar: círculo de `48px`, `--wb-purple` con flecha blanca. Con el campo vacío, va en `#E2E0EC` y queda deshabilitado (`aria-disabled`).
- El campo **sigue habilitado** con opciones en pantalla (D-29).

**Límite diario (C3):** cuando `POST` devuelve 429, una tarjeta **reemplaza a la barra de respuesta** y el historial queda visible.

- Tarjeta: `#F2F1ED`, radio `20px`, margen `0 16px 30px`, padding `28px 24px 24px`.
- No se usa rojo, porque no es un error del visitante.
- El botón primario abre WhatsApp de Devalpo; el secundario lleva a `/`.

### Paso de datos (R1)

- Aparece **dentro del chat** después del cierre, como tarjeta: borde `1.5px #E2E0EC`, radio `20px`, padding `24px 20px 20px`.
- **Tres campos obligatorios**, en este orden: nombre, correo y WhatsApp del negocio.
  - Rótulos: `600 13px`, margen inferior `6px`.
  - Campos: `52px` de alto, radio `12px`, `400 15px`, separados por `14px`.
- **Teléfono:** el prefijo "+56 9" es un segmento fijo (`#F7F6F2`, `600 15px`, borde derecho `1.5px #E2E0EC`) y el campo acepta **8 dígitos**. Usa `inputmode="numeric"` y `autocomplete="tel-national"`. Los espacios se quitan antes de validar y se guarda `+569XXXXXXXX`.
- **Bajo el teléfono:** "Es el número que recibe los mensajes de tu sitio. Puedes cambiarlo después." (`400 12.5px` `#565E6B`).
- **Error:** borde `#B42318` y mensaje en `500 12.5px` `#B42318` bajo el campo. La validación se hace al enviar y, después del primer intento, al salir de cada campo.
- **Botón:** "Ver mi sitio", de `52px`.
- **Bajo el botón:** "Usamos estos datos solo para tu sitio." más el enlace a `/privacidad`.
- `POST /api/chat/lead` pasa a recibir `{sessionId, nombre, email, telefono}`.
  - Escribe `contacto.telefono` y `contacto.email` en el `configJson`, de forma defensiva.
  - El correo del lead se usa también como correo de contacto del sitio. Se puede cambiar después por WhatsApp.

### Reveal (R2, R3)

Es la **misma pantalla de `/chat`** después del lead, con scroll. Gutter `24px`.

1. **Rótulo** "Tu sitio" + H1 "Así se ve {nombre}" en `800 28px/1.08`, `-.04em`.
2. **Vista previa:**
   - `iframe` a ancho completo, alto `min(70vh, 560px)`, borde `1px #E2E0EC`, radio `16px`, `title="Vista previa de tu sitio"`.
   - Sin interacción, como hoy.
   - Debajo, "Abrir el sitio completo →" (`600 14px`, `#4632DE`, `44px` de alto), que abre una pestaña nueva.
3. **Tarjeta de avance:** `#F2F1ED`, radio `20px`, padding `22px 20px 20px`.
   - Título "Tu sitio está al {p} %" en `700 16px`.
   - La barra (ver i).
   - El texto de invitación.
   - Botón **"Completar mi sitio"**, en tinta `#101218` y no en violeta, para no competir con el botón de pago.
   - Al 80 % la tarjeta se compacta (R3): título, barra, la frase "Completaste todo lo que se puede antes del pago." y el enlace "Editar respuestas".
4. **Caja de pago:** separada por `border-top: 1px #101218` y con padding superior `28px`.
   - Rótulo "Tu sitio propio".
   - H2 "Listo en 1 día hábil" en `800 32px`.
   - Precio en `800 40px` + "pago único".
   - Tres viñetas con "✓" violeta.
   - **El aviso D-39, verbatim, antes del botón**, en `400 12.5px/1.65` `#3F4652`, con "Términos y condiciones" subrayado.
   - Botón "Quiero mi sitio real", de `56px`.
   - Debajo, el texto de pago actual, verbatim.

### Momento 2 (M1–M5)

Ruta `/chat/completar`, con la misma cookie de sesión que el chat.

**Header (`56px`):**

- Botón de cerrar (X) de `44 × 44px` con `aria-label="Cerrar y volver a mi sitio"`. Las respuestas que ya se guardaron se mantienen.
- Título "Completar tu sitio" en `700 14px`.
- A la derecha, el porcentaje en `600 12px`. Es violeta cuando acaba de subir y gris en el resto de los casos.

**Pantalla de tarea (M1, M4):**

| Pieza | Estilo |
|---|---|
| Rótulo | "Paso {n} de {N}" |
| Título | `700 24px/1.25` |
| Ayuda | `400 14px/1.55` `#3F4652`, margen inferior `22px` |
| Grupo de campos | separados por `border-top: 1px #EFEEF4` y padding `16px 0` |
| Nombre del servicio (no editable) | `700 15px`, margen inferior `10px` |
| Campos | `48px`, radio `12px`, `400 14px`, gap `8px` |
| Campo de precio | ancho `170px` en móvil y `150px` en escritorio |

- **Barra inferior fija:** borde superior `1px #EFEEF4` y padding `12px 24px calc(16px + env(safe-area-inset-bottom))`. Lleva el botón primario "Guardar y ver cómo queda" (`52px`) y, debajo, "Omitir este paso" (`44px`, `600 14px`, tinta, sin subrayado).
- **"Guardar"** queda deshabilitado mientras no haya ninguna respuesta. Con la tarea vacía, la única salida es "Omitir".

**Pantalla "Así quedó" (M2):**

- Check de `26px` en violeta y la línea "Guardado · tu sitio subió a {p} %".
- Título "Así quedó en tu sitio".
- `iframe` del sitio con el ancla de la sección, `420px` de alto, radio `16px`, sin interacción.
- **Línea de lo que falta**, si aplica (ver microcopy).
- Botón primario "Siguiente: {nombre de la próxima tarea}" y, debajo, "Cambiar algo" (vuelve a la tarea).
- En la última tarea, el botón dice "Ver el resumen".

**Resumen (M3, M5):**

- Titular `800 28px/1.08` y la barra con su leyenda.
- Una fila por tarea: círculo de `28px` (lleno violeta con "✓" si está completa; borde `1.5px #C9CDD6` si no), título `700 14.5px`, detalle `400 12px` `#565E6B` y una acción a la derecha ("Editar" o "Responder", `600 13px` `#4632DE`). Filas con padding `14px 0` y separadores `1px #EFEEF4`.
- **Antesala "Después del pago":**
  - Rótulo gris (no violeta).
  - Grilla de 3 zonas de `64px` de alto, borde `1.5px dashed #CFCBC0`, fondo `#F7F6F2`, radio `12px`, con el nombre en `600 11px` `#565E6B`.
  - Debajo, una línea que dice qué pasa mientras tanto.
  - **Sin candado**, sin la palabra "bloqueado" y sin botón para subir archivos.
- Botón inferior: "Volver a mi sitio" (tinta) si quedan tareas pendientes, o "Ver mi sitio y continuar" (violeta) al 80 %.

Las zonas de la antesala dependen de la plantilla:

| Plantilla | Zonas |
|---|---|
| LANDING | Logo · Foto principal · Una foto por servicio |
| SERVICIOS | Logo · Foto principal · El lugar · 3 fotos |

**Tareas sin pantalla dibujada:**

- **Horarios (SERVICIOS).** Hasta 3 filas, cada una con dos campos: "Días" y "Horario".
  - Sobre la primera fila hay tres sugerencias que llenan el campo "Días": "Lunes a viernes", "Sábado" y "Domingo".
  - El enlace "Agregar otro horario" desaparece al llegar a 3 filas.
  - El texto se guarda tal cual, sin normalizar.
- **Frase de un cliente.**
  - "La frase": `textarea` de 3 filas, máximo 160 caracteres, con contador visible al pasar los 120.
  - "Nombre de quien la dijo".
  - "Relación (opcional)".
  - Para que sume, basta con la frase; el autor es opcional (C3 de T).

**Largos máximos:**

| Campo | Máximo |
|---|---|
| Descripción de servicio | 90 caracteres |
| Precio desde | 20 |
| Días / horario | 30 / 30 |
| Cada micro-pregunta | 80 |
| Nombre del autor | 40 |
| Relación | 40 |

El campo deja de aceptar texto al llegar al máximo; no muestra un error.

### `/gracias` (G1)

- Página de servidor estática, sin cookies ni datos del visitante.
- Rótulo, H1 `800 32px` y párrafo.
- Lista numerada de 3 ítems, separados por `1px #EFEEF4`, con el número en `800 13px` violeta.
- Barra inferior con el botón de WhatsApp hacia Devalpo y, debajo, "Si ya nos escribiste, no necesitas hacer nada más."
- El mensaje ya escrito es genérico (ver microcopy), porque la página no sabe quién es el visitante.

---

## Pantallas · escritorio

**Chat (sin pantalla dibujada; mismos componentes):**

- Header de `72px` a ancho completo y columna centrada de `max-width: 640px`.
- Pregunta activa en `700 32px/1.2`.
- Opciones en fila con salto de línea, nunca apiladas.
- La barra de respuesta va en el flujo, bajo la pregunta, y no queda fija.

**Reveal (E1):**

- Grid `minmax(0,1fr) 400px`, gap `48px`, padding `40px 48px 48px`, sobre fondo `#F7F6F2`.
- **Izquierda:** el H1 y el `iframe` del sitio renderizado a `1280px` de ancho y escalado con `transform: scale(var(--k))`, donde `--k` es el ancho del contenedor dividido por 1280.
- **Derecha:** columna `position: sticky; top: 24px` con la tarjeta de avance y la caja de pago, ambas blancas con borde `1px #E2E0EC` y radio `20px`. El aviso D-39 queda antes del botón y todo es visible sin hacer scroll en una pantalla de 800px de alto.

**Momento 2 (E2):**

- Header de `72px`: a la izquierda "Volver a mi sitio" con una flecha; a la derecha, el porcentaje y una barra de `200px`.
- Grid `520px minmax(0,1fr)`, de alto `calc(100vh - 72px)`.
- **Izquierda:** la tarea, con padding `40px 48px` y el título en `800 34px`. En la tarea de servicios, la descripción y el precio van en una fila `minmax(0,1fr) 150px`. Los botones quedan al pie, en fila.
- **Derecha:** fondo `#F7F6F2` con el `iframe` del sitio a escala. Arriba, el rótulo "Tu sitio" y el texto "Se actualiza al guardar".
- **En escritorio no hay pantalla "Así quedó":** al guardar, el `iframe` de la derecha se recarga en la sección y la tarea avanza sola a la siguiente, mostrando el aviso "Guardado · tu sitio subió a {p} %" durante 4 segundos (`role="status"`).

---

## Microcopy

### Guion del chat (`DemoChatService`)

| # | Texto | Formato | Campo |
|---|---|---|---|
| 1 | "Hola, soy el asistente de WebBot. En seis preguntas armamos tu sitio. ¿Cómo se llama tu negocio?" | texto | `nombre` |
| 2a | "Por el nombre, parece que es {RUBRO_FRASE}. ¿Es correcto?" | botones: "Sí, es correcto" · "No, es otra cosa" | `rubro` |
| 2b | Si no se deduce, o si responde "No, es otra cosa": "¿Cuál de estas categorías describe mejor tu negocio?" | botones: los 10 `RUBRO_LABELS` + "Ninguno de estos" | `rubro` |
| 3 | "¿A qué se dedica tu negocio? Cuéntalo en una o dos frases." | texto | `descripcion` |
| 4 | "¿Cuáles son tus principales servicios?" Ayuda: "Escribe los 3 o 4 más importantes, separados por coma." | texto + sugerencias por rubro | `servicios` |
| 5 | "¿En qué ciudad o comuna atiendes?" | texto | `ciudad` |
| 6 | "¿Qué estilo prefieres para tu sitio?" | botones: "Moderno y minimalista" · "Cálido y cercano" · "Colorido y llamativo" (**texto exacto, es contrato D-29**) | `estilo` |
| Cierre | "Listo. Ya tengo lo necesario para armar tu sitio." | — | — |

- **`RUBRO_FRASE`** es un mapa nuevo y fijo en el guion, con el artículo incluido. Por ejemplo: "un dentista", "una peluquería o salón de belleza", "una consultora", "una panadería", "un taller". Hay una entrada por cada rubro de `RUBRO_LABELS`.
- Las etiquetas de los botones de 2a son nuevas y pasan a ser parte del contrato del parser.
- **`SUGERENCIAS_SERVICIOS`** es un mapa nuevo y fijo, con 5 sugerencias por rubro y ninguna para "Ninguno de estos". Es solo texto de interfaz: el parser no lo lee.

### Paso de datos

| Elemento | Texto |
|---|---|
| Título | "Tu sitio está listo para verlo" |
| Texto | "Déjanos tus datos y te lo mostramos ahora." |
| Rótulos | "Tu nombre" · "Tu correo" · "WhatsApp del negocio" |
| Ayuda del teléfono | "Es el número que recibe los mensajes de tu sitio. Puedes cambiarlo después." |
| Botón | "Ver mi sitio" |
| Pie | "Usamos estos datos solo para tu sitio. Política de privacidad" |
| Error: nombre vacío | "Escribe tu nombre." |
| Error: correo vacío | "Escribe tu correo." |
| Error: correo sin dominio | "Revisa el correo: le falta el final, por ejemplo .cl o .com." |
| Error: otro formato de correo | "Revisa el correo, parece incompleto." |
| Error: teléfono | "Escribe los 8 dígitos que van después del +56 9." |
| Error de red | "No pudimos guardar tus datos. Revisa tu conexión e inténtalo de nuevo." |

### Límite diario

| Elemento | Texto |
|---|---|
| Rótulo | "Sitios de prueba" |
| Título | "Por hoy llegaste al máximo de sitios de prueba" |
| Texto | "Desde esta conexión se pueden armar 2 sitios de prueba al día. Puedes volver mañana, o escribirnos y lo armamos contigo." |
| Botones | "Escribir a Devalpo por WhatsApp" · "Volver al inicio" |
| Mensaje de WhatsApp | "Hola, quiero armar el sitio de mi negocio con WebBot." |

### Reveal

| Elemento | Texto |
|---|---|
| Rótulo y título | "Tu sitio" · "Así se ve {nombre}" |
| Enlace | "Abrir el sitio completo →" |
| Avance | "Tu sitio está al {p} %" |
| Leyenda de la barra | "Logo y fotos: después del pago" |
| Invitación, SERVICIOS | "Con dos minutos más, tu sitio muestra precios, horarios y quién atiende. Todo es opcional." |
| Invitación, LANDING | "Con dos minutos más, tu sitio describe tus servicios y cuenta quién está detrás. Todo es opcional." |
| Botón | "Completar mi sitio" |
| Al 80 % | "Completaste todo lo que se puede antes del pago." · "Editar respuestas" |
| Caja de pago | "Tu sitio propio" · "Listo en 1 día hábil" · "{precio}" · "pago único" |
| Viñetas | "Tu dominio propio y el sitio publicado" · "Agregamos tu logo y tus fotos" · "Sin contratos ni permanencia mínima" |
| Aviso D-39 | **verbatim del código actual** |
| Botón de pago | "Quiero mi sitio real" |
| Bajo el botón | **verbatim del código actual** |

> Verifica la viñeta "Tu dominio propio": solo va si el plan incluye dominio (P5).

### Momento 2

| Elemento | Texto |
|---|---|
| Header | "Completar tu sitio" |
| **Tarea 1** · título | "Describe tus servicios" |
| Tarea 1 · ayuda, SERVICIOS | "Una línea por servicio y, si quieres, el precio desde. Lo que dejes vacío no aparece en tu sitio." |
| Tarea 1 · ayuda, LANDING | "Una línea por servicio. Lo que dejes vacío no aparece en tu sitio." |
| Tarea 1 · marcadores | "Qué incluye, en una línea" · "Precio desde" |
| **Tarea 2** · título | "¿Cuándo atiendes?" |
| Tarea 2 · ayuda | "Escribe tus horarios tal como quieres que se lean. Hasta tres." |
| Tarea 2 · marcadores y enlace | "Días" · "Horario" · "Agregar otro horario" |
| **Tarea 3** · título | "Cuéntanos quién está detrás" |
| Tarea 3 · ayuda | "Tres respuestas cortas. Las mostramos con tus palabras, sin cambiarlas." |
| Tarea 3 · preguntas | "¿Desde qué año trabajan?" · "¿Quién atiende o lleva el negocio?" · "¿Qué hacen distinto?" |
| Tarea 3 · nota | "Si respondes solo una o dos, tu sitio muestra solo esas. Nada queda en blanco." |
| **Tarea 4** · título | "Una frase de un cliente" |
| Tarea 4 · ayuda | "Copia un mensaje real que te haya mandado un cliente. Si no tienes uno, omite este paso: tu sitio no muestra una cita inventada." |
| Tarea 4 · rótulos | "La frase" · "Nombre de quien la dijo" · "Relación (opcional)" |
| Tarea 4 · marcador de relación | "Por ejemplo: paciente o cliente desde 2020" |
| Botones | "Guardar y ver cómo queda" · "Omitir este paso" · "Siguiente: {tarea}" · "Cambiar algo" · "Ver el resumen" |
| Guardado | "Guardado · tu sitio subió a {p} %" · "Así quedó en tu sitio" |
| Falta 1 servicio | "{servicio} sigue sin descripción, y en tu sitio solo se ve su nombre. Puedes volver a este paso cuando quieras." |
| Faltan 2 o más | "{n} servicios siguen sin descripción, y en tu sitio solo se ven sus nombres. Puedes volver a este paso cuando quieras." |
| Resumen · titular | "Tu sitio está al {p} %" (al 80 %: "Completaste todo lo que se puede antes del pago") |
| Resumen · leyenda | "Hasta 80 % antes del pago" · "Logo y fotos" |
| Resumen · detalles | "{k} de {n} descritos" · "{n} horarios" · "Lo omitiste · suma {x} %" · "Pendiente · suma {x} %" |
| Resumen · acciones | "Editar" · "Responder" |
| Antesala · rótulo | "Después del pago" |
| Antesala, SERVICIOS | "Nos los mandas por WhatsApp cuando pagues. Mientras tanto, tu sitio usa tus iniciales y no muestra fotos del lugar." |
| Antesala, LANDING | "Nos los mandas por WhatsApp cuando pagues. Mientras tanto, tu sitio usa tus iniciales y muestra tus servicios con números grandes." |
| Antesala al 80 % | "Nos los mandas por WhatsApp cuando pagues, y los agregamos antes de publicar." |
| Botones del resumen | "Volver a mi sitio" · "Ver mi sitio y continuar" |
| Momento 2 cerrado | "Tu sitio ya está en preparación" · "Para cambiar algo, escríbenos por WhatsApp y lo hacemos por ti." · "Escribir por WhatsApp" |
| Sesión vencida | "No encontramos tu sitio de prueba" · "Puede que haya pasado mucho tiempo desde que lo armaste. Escríbenos y lo recuperamos." |

### `/gracias`, y primer mensaje de Devalpo si no hay URL de retorno

| Elemento | Texto |
|---|---|
| Rótulo y título | "Gracias" · "Ahora revisamos tu pago" |
| Texto | "Lo confirmamos a mano y te escribimos por WhatsApp en menos de un día hábil para publicar tu sitio." |
| Lista · encabezado | "Para publicarlo, ten a mano:" |
| Ítem 1 | "Tu logo" — "PNG, JPG o WebP, de hasta 5 MB. Si no tienes, usamos tus iniciales." |
| Ítem 2 | "Una foto de tu local o de tu equipo" — "Es la que va arriba en tu sitio." |
| Ítem 3 | "Más fotos, si tienes" — "Del lugar o de cada servicio. Son opcionales." |
| Botón | "Mandar logo y fotos por WhatsApp" |
| Pie | "Si ya nos escribiste, no necesitas hacer nada más." |
| Mensaje de WhatsApp | "Hola, acabo de pagar mi sitio de WebBot. Les mando mi logo y mis fotos." |

**Primer mensaje de Devalpo, si no hay `/gracias`:**

> "Hola, {nombre}. Recibimos tu pago y ya estamos preparando tu sitio. Para publicarlo, mándanos por aquí tu logo (PNG o JPG) y una foto de tu local o de tu equipo. Si tienes más fotos del lugar o de tus servicios, también sirven. Si no tienes logo, usamos tus iniciales."

---

## Estados y cadena de degradación

| Estado | Qué ve el visitante |
|---|---|
| **Chat: pregunta de texto** | C2: pregunta a 24px, ayuda, sugerencias si el rubro las tiene y la barra de respuesta |
| **Chat: pregunta con botones** | C1: opciones apiladas, ayuda "También puedes escribir tu respuesta." y el campo habilitado |
| **Chat: rubro no deducido** | 2b directamente: los 11 botones en fila con salto de línea, a 44px |
| **Límite diario (429)** | C3: el historial se mantiene y la tarjeta reemplaza a la barra |
| **Error de red en el chat** | Bajo la última burbuja: "No pudimos enviar tu respuesta." + "Reintentar" (`44px`). La respuesta no se pierde |
| **Paso de datos con errores** | R1: borde y mensaje por campo, y el foco en el primero con error |
| **Reveal, 0 tareas** | R2 al 35 %. El sitio queda en el estado mínimo de su plantilla, que es de primera clase |
| **Reveal, algunas tareas** | La tarjeta muestra el porcentaje real y la vista previa ya incluye lo guardado |
| **Reveal, 80 %** | R3: la tarjeta compacta, "Editar respuestas" y la caja de pago debajo |
| **Momento 2: tarea vacía** | M1 sin respuestas: "Guardar" deshabilitado y "Omitir" disponible |
| **Momento 2: guardado** | M2 en móvil; en escritorio, el aviso y el iframe recargado |
| **Momento 2: resumen parcial** | M3: tareas completas, omitidas y pendientes, más la antesala |
| **Momento 2: resumen completo** | M5: el titular de logro, todas las tareas completas y la antesala |
| **Momento 2 cerrado** (Devalpo confirmó el pago) | Una pantalla con el texto "Momento 2 cerrado" y el botón de WhatsApp. No se puede editar |
| **Sesión vencida o inexistente** | Una pantalla con el texto "Sesión vencida" y el botón de WhatsApp |
| **Después del pago** | G1 si hay URL de retorno; si no, el primer mensaje de Devalpo |

**Degradación del sitio según lo que responde en el momento 2** (SERVICIOS; en LANDING solo aplican las filas que corresponden):

| Tarea | Respondida | Omitida |
|---|---|---|
| Servicios y precios | Filas con descripción y precio. Las filas sin precio muestran "Agendar →". H2 "Servicios y precios" | Nombres a 40px y "Agendar →". H2 "Nuestros servicios" |
| Horarios | Banda de horarios y tarjeta de horarios en Contacto | Ninguna de las dos se renderiza |
| Quién está detrás | De 1 a 3 tarjetas en Nosotros; con 3, dos columnas | Nosotros en una columna con la descripción. **Nunca desaparece** |
| Frase de un cliente | Cita en Nosotros, con autor si lo hay | No hay cita |

---

## Campos del DTO

Todos son opcionales y aditivos. `parseSiteConfig` los lee de forma defensiva. No hay migración.

| Campo | Quién lo escribe | Dónde |
|---|---|---|
| `nombre`, `rubro`, `descripcion`, `servicios[]` (nombres), `ciudad`, `estilo` | **Chat** | preguntas 1 a 6 |
| `contacto.telefono` | **Paso de datos** | nuevo en `POST /api/chat/lead` |
| `contacto.email` | **Paso de datos** | el correo del lead |
| `servicios[].descripcion` | **M2** | tarea 1 |
| `servicios[].precioDesde` | **M2** | tarea 1, solo SERVICIOS |
| `horarios[]` | **M2** | tarea 2, solo SERVICIOS |
| `sobreNosotrosPartes` | **M2** | tarea 3 |
| `highlight`, `highlightAutor` | **M2** | tarea 4 (sale del chat) |
| `momento2Omitidas?: string[]` | **M2** | **nuevo**, guarda los identificadores de las tareas omitidas, para que el resumen diga "Lo omitiste" y no "Pendiente". No afecta al render |
| `redes` | **Admin** | conflicto C1 |
| `destacados` | **Admin** | P3 |
| `logo`, `logoDimensiones`, `imagenes[]`, `servicios[].foto` | **Admin** | después del pago |
| `legal` | **Admin** | después del pago (T7) |

---

## Arquitectura

| Pieza | Tipo | Notas |
|---|---|---|
| `/chat` | servidor | Shell. Lee la sesión y decide si muestra el chat o el reveal |
| `ChatWidget` | **cliente** (existe) | Se le cambian los estilos y se le agregan: barra de 6 segmentos, rótulo de la pregunta activa, sugerencias, `role="group"` y `role="log"`, y la tarjeta del 429 |
| `LeadForm` | **cliente** (existe) | Se le agrega el teléfono con prefijo fijo, la validación por campo y los mensajes de error |
| `POST /api/chat/lead` | servidor | Recibe además `telefono` y escribe `contacto` en el `configJson` |
| `DemoCTA` (reveal) | servidor + una isla cliente | La tarjeta de avance y la caja de pago son de servidor; recibe `p` calculado con `calcularAvance`. La isla cliente solo escala el `iframe` en escritorio |
| `/chat/completar` | servidor | Lee el `configJson` por la cookie de sesión y arma la lista de tareas con `TAREAS_POR_PLANTILLA` |
| `Momento2` | **cliente** | Maneja el paso actual, los campos y la `key` del `iframe` |
| `guardarTareaAction(tarea, valores)` | acción de servidor | Valida los largos, recorta los espacios, hace un merge defensivo, llama a `revalidatePath` del sitio demo y devuelve el nuevo `p`. Si Devalpo ya confirmó el pago, rechaza la escritura |
| `calcularAvance(config, plantilla)` | función pura, capa de aplicación | La usan el reveal, el momento 2 y `/admin` |
| `TAREAS_POR_PLANTILLA` | constante, capa de aplicación | La tabla de (d), con los pesos de (i) |
| `/gracias` | servidor, estática | Sin cookies ni datos. Depende de P1 |

**Sin librerías nuevas.** El chat sigue sin llamar a Claude: todo texto nuevo está en el guion o en constantes.

---

## Fuera de alcance

- La subida de logo y fotos por el cliente (ver g).
- La edición en el lugar sobre el sitio.
- La vista previa en vivo mientras se escribe.
- Las tareas propias de RESTAURANTE (carta), PORTFOLIO y TIENDA (productos), que llegan con sus capítulos.
- La captura de `destacados`, `redes` y `legal` por parte del cliente.
- Los webhooks de Mercado Pago y el permiso automático de "pagado".
- El chat con Claude real.

---

## Conflictos y preguntas abiertas

Marco con **→** los que resolví con una propuesta; los demás necesitan la respuesta del dueño.

### Conflictos del brief

- **C1 · `redes` queda huérfano. → Resuelto:** no se captura en el chat ni en el momento 2. Devalpo la pide en el primer WhatsApp después del pago, junto con el logo y las fotos, y la carga en `/admin`. Se aprovecha que esa conversación ya ocurre: no suma pasos y no suma fricción antes del pago. Las plantillas ya muestran Instagram en Contacto y en el footer si el campo existe.
- **C2 · El 55 % del prototipo v3. → Resuelto:** la base es de 35 % (lo que ya se capturó en el chat y en el paso de datos), y el reveal no invita a subir el logo ni las fotos antes de pagar. Ver (i).
- **C3 · "El sitio es el formulario". → Resuelto:** no. La alternativa es una tarea por pantalla y la recarga del sitio al guardar. Ver (b) y (c).
- **C4 · Dirección visual de v3. → Resuelto:** todo se redibujó en Bloques. Las maquetas de momento 2 de `Plantillas WebBot.dc.html` quedan **obsoletas**.
- **C5 · D-40 frente a T7. → Propuesta:** agregar dos campos de formulario a `/admin`, "Razón social" y "RUT", en vez de escribirlos en el JSON. Es poco trabajo (un par de horas), pero **necesita tu prioridad**. Además, hay que corregir el comentario obsoleto de `SiteConfigDTO.ts:68-75`.

### Preguntas para el dueño

- **P1 · ¿El link de Mercado Pago admite una URL de retorno?** Si la admite, se construye `/gracias` (G1). Si no, el mismo contenido va en el primer mensaje de WhatsApp de Devalpo. No cambia nada más del diseño.
- **P2 · ¿Qué cambia `estilo` en Bloques?** En T1 el sistema es uno solo y el acento sale de `colores.primario`. Si `estilo` ya no cambia nada visible, la pregunta 6 promete algo que el sitio no cumple. Hay dos salidas: que `estilo` elija el acento por defecto cuando el cliente no tiene uno (mi propuesta), o reemplazar la pregunta por otra. **Esta decisión afecta al guion y no la tomo yo.**
- **P3 · `destacados` (cifras de LANDING).** Hoy nadie lo captura. Propongo dejarlo solo en Admin, cuando el cliente lo mencione por WhatsApp. Pedirlo en el momento 2 es una pregunta difícil ("¿qué cifra te enorgullece?") para un aporte chico. ¿Lo confirmas?
- **P4 · ¿Cuándo se cierra el momento 2, y cuánto duran los datos de quien no paga?** Propongo cerrarlo cuando Devalpo confirma el pago, porque desde ahí Devalpo trabaja sobre el sitio y una edición simultánea del cliente podría pisar su trabajo. ¿Cuánto tiempo vive la sesión del chat? Eso define cuándo aparece el estado "Sesión vencida".
- **P5 · ¿El plan incluye dominio propio?** Lo necesito para la viñeta "Tu dominio propio y el sitio publicado" de la caja de pago. Si el plan no lo incluye, la viñeta cambia a "Tu sitio publicado en 1 día hábil".
- **P6 · `{precio}`.** ¿Sale de una constante o de configuración? El diseño solo necesita el texto ya formateado.
