# Brief para el diseñador: rediseño del chat de onboarding

> **Para qué es este documento.** Pegarlo en Claude Design como punto de partida.
> Trae el inventario exacto de lo que el chat pregunta hoy, lo que el rediseño de
> plantillas necesita y no tenemos, y las restricciones que no se negocian. Nada acá es
> una decisión tomada: es el material para que la conversación arranque informada.
>
> Escrito el 2026-09-20 desde el código, no de memoria. Cada afirmación es verificable.

## El encargo, en una línea

El rediseño de plantillas necesita bastante más contenido del cliente que el que el chat
recolecta hoy. Hace falta un diseño de captura que consiga ese contenido **sin romper la
promesa de la demo, que es velocidad**.

## Qué hace el chat hoy

Es una conversación guionada de **8 preguntas**, o 9 cuando el rubro no se pudo deducir y
hace falta preguntarlo. La primera —el nombre del negocio— se muestra como saludo antes
de que el usuario escriba nada.

Ya se trabajó para que el usuario escriba menos: **las preguntas de opción múltiple son
botones clicables**, no texto libre. Esa decisión se tomó porque el usuario tenía que
escribir demasiado, y está registrada como D-29 en `docs/DECISIONES.md`.

El flujo termina así: el visitante contesta → se le pide **nombre y correo** → se le
revela su sitio demo ya construido. El pago viene después, y lo confirma Devalpo a mano.

## Qué datos guardamos hoy

Del chat sale un `configJson` por sitio con estos campos, y solo estos:

| Campo | Qué es |
|---|---|
| `nombre` | Nombre del negocio |
| `rubro` | Deducido de lo que escribe, o preguntado si no se pudo deducir |
| `descripcion` | Una frase sobre el negocio |
| `sobreNosotros` | Opcional. **Hoy ningún sitio lo tiene** |
| `servicios` | Lista de nombres. Desde hoy cada uno **puede** llevar descripción, pero nadie la llena |
| `ciudad` | |
| `contacto` | Teléfono y correo |
| `redes` | Instagram y Facebook, opcionales |
| `estilo` | Una de cuatro opciones visuales. De acá sale el color de acento del sitio |
| `highlight` | Una frase destacada |
| `imagenes` | URLs. Hoy vienen de un banco de fotos por rubro, **no las sube el cliente** |
| `destacados` | Tres cifras para el hero. El campo existe, **ningún productor lo llena** |

## Qué necesita el diseño nuevo y no tenemos

De las tres direcciones propuestas para LANDING:

- **Descripción por servicio** — la piden **las tres**. El campo ya existe en el código
  desde hoy; falta de dónde sacar el texto.
- **Las tres cifras del hero** (`destacados`) — el campo existe hace tiempo y **nunca se
  llenó**, así que esa fila no aparece en ningún sitio, ni demo ni real.
- **Nombre y cargo de quien da el testimonio** — lo piden dos de las tres. Hoy
  `highlight` es una frase suelta, sin autor.
- **Puntos fuertes, cada uno con su línea de "por qué importa"** — lo pide una.
- **Logos de los clientes del cliente** — lo pide una. Categoría de contenido que no
  existe en ninguna parte del producto.

## El logo del propio negocio: no existe

No hay campo de logo en el DTO, ni en las plantillas, ni en el chat. **El header de cada
sitio pinta un cuadrado de color con la inicial del nombre del negocio.**

Para un sitio que se vende a $149.990, que el cliente no pueda poner su logo es un hueco
serio. Y es distinto de todos los demás: no se resuelve preguntando, se resuelve
**subiendo un archivo**, que es un tipo de interacción que el chat hoy no tiene.

Lo mismo vale para las fotos: hoy salen de un banco por rubro. El cliente nunca sube las
suyas.

## La tensión, dicha sin rodeos

Cada campo nuevo es una pregunta más. La demo vende **"tu sitio web en un día"**, y su
fuerza es que en dos minutos el visitante ve su sitio hecho. Si para lograr eso hay que
contestar veinte preguntas y subir archivos, se pierde justamente lo que la hace vender.

## Una hipótesis para evaluar, no una decisión tomada

Puede que esto no sea un problema de **interfaz** sino de **momento**.

Hoy todo se pregunta antes de mostrar nada. Pero el embudo real tiene dos instancias muy
distintas:

1. **Antes de que el visitante se comprometa.** Acá manda la velocidad. Solo hace falta
   lo mínimo para mostrarle algo que lo impresione.
2. **Después de que dejó sus datos, o después de que pagó.** Acá ya hay compromiso, y
   pedirle el logo, las fotos reales, las descripciones de sus servicios y sus cifras es
   razonable — incluso esperable.

Si eso es cierto, el entregable no es un chat más largo sino **dos superficies
distintas**: la demo rápida que ya existe, y algo nuevo para completar el sitio con
calma, donde subir archivos y escribir párrafos no compite contra un cronómetro.

**Pero esto es una hipótesis de quien escribe código, no de quien diseña.** Puede que
haya una forma de conseguirlo todo en la conversación sin que pese. Esa evaluación es
del diseñador.

## Restricciones que no se negocian

- **Nunca inventar datos del cliente.** Ni precios, ni horarios, ni descripciones de sus
  servicios redactadas por una IA. Si un campo está vacío, el bloque no se muestra. Es
  regla del proyecto y no está en discusión.
- **Un campo opcional ausente no puede verse como un error.** La sección desaparece, no
  queda un hueco.
- **Escribir menos, no más.** Las opciones múltiples ya son clicables por esta razón.
- **El equipo es una persona.** Lo que se diseñe tiene que poder construirlo un solo
  desarrollador, y competir en prioridad contra terminar las seis plantillas.

## Qué sería útil recibir

1. Una propuesta de **dónde** se pide cada cosa: qué se queda en la demo y qué se mueve
   después del compromiso, si es que algo se mueve.
2. El diseño de la superficie nueva, si la hipótesis de los dos momentos se sostiene.
3. Cómo se pide el **logo** y las **fotos** —subir archivos— sin romper el ritmo.
4. Si algún campo del diseño de plantillas conviene **sacrificar** por costar más de lo
   que aporta. Bajar el alcance es una respuesta válida.

---

## Respuesta del diseñador y decisiones tomadas (2026-09-20)

El diseñador respondió con una tercera vuelta del prototipo
(`design_handoff_plantillas_webbot/Plantillas WebBot v3.dc.html`, bloque `t3`).

**Aceptó la hipótesis de los dos momentos y le agregó un segundo movimiento que este
brief no proponía:** el chat de la demo **no crece, se acorta** — de 8-9 preguntas a 6.

### Decidido por Agustín

**Cuándo se abre «Completar mi sitio»: mixto.** El texto —descripciones de servicios,
testimonio, micro-preguntas de «sobre nosotros»— se abre **al dejar los datos**, antes de
pagar. El **logo y las fotos reales**, recién **después de pagar**.

El porqué: el texto sirve para enganchar, y cuanto más trabajo invirtió el visitante en
su sitio, más le cuesta abandonarlo. Pero el logo y las fotos son justo lo que más trabajo
le ahorran a Devalpo, así que esos se pagan primero.

Costo asumido: dos estados de permiso en vez de uno, y más lógica para mantener con una
sola persona.

### Sigue sin decidirse

- Cuál de las tres direcciones de LANDING (2a Editorial / 2b Bloques / 2c Oscuro). El
  diseñador no la declaró en prosa, pero las maquetas del momento 2 usan la firma visual
  de **2a**.
- El hueco que el diseñador no nombró: las ranuras rotuladas de foto («principal», «quien
  atiende», «un detalle») implican que `imagenes?: string[]` deje de ser un arreglo plano
  y pase a ranuras tipadas.
