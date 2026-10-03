# Respuestas: un solo servicio y header móvil

> Responde `preguntas-disenador-bloques.md` (2026-10-03). Vale para las seis plantillas.
> **Reemplaza** la regla de "un solo servicio" del README de LANDING (`handoff_bloques/README.md`) y la decisión **C6** de `00-DECISIONES-TRANSVERSALES.md`. Ambos documentos ya quedaron corregidos.

---

## Pregunta 1 · Un solo servicio

### Decisión: la sección se muestra siempre. La regla de "absorberlo en el hero" se elimina.

LANDING queda igual que S2: si hay al menos un servicio, la sección se renderiza.

**Por qué:**

1. **El nav tiene cuatro etiquetas fijas (T1).** Con la regla anterior, "Servicios" podía apuntar a algo que no existe. Las otras salidas también fallan: bajar a 3 etiquetas rompe la regla y hace que el nav cambie según los datos, y apuntar "Servicios" al hero lleva al visitante a una sección que no es la que nombra.
2. **Es un componente compartido.** Una excepción que existe en una sola plantilla y que cambia la composición del hero es justo el tipo de variación que T1 quiso evitar.
3. **Me equivoqué al escribirla.** La regla venía de "una banda sola se ve como una lista incompleta". Ese problema es real, pero lo causa el **número "01"**, no la sección. Se resuelve sacando el número.

### La regla que sí aplica: con un solo servicio, no hay número

Un "01" sin "02" anuncia una serie que no existe. Con `servicios.length === 1`:

**LANDING: la banda pasa a una sola columna.** Fondo `#F2F1ED`, a sangre, padding `100px 96px` y sin celda visual.

| Elemento | Estilo |
|---|---|
| Nombre | `800 52px/1.08`, `-.042em`, `--ink`, tope `22ch`, margen inferior `24px` |
| Descripción (si existe) | `300 18px/1.85`, `--ink-muted`, tope `48ch`, margen inferior `36px` |
| Enlace | "Consultar por este servicio", igual que en las bandas: `600 12.5px`, acento, subrayado de `1.5px` con el tinte de 28 % |

Con foto (`servicios[0].foto`), la banda vuelve a la forma B de dos columnas, también sin número: la foto ocupa la celda visual y el título queda arriba del texto.

**Encabezado de la sección:** el eyebrow dice **"Servicio"** en singular. El H2 de la sección **no se renderiza**: con un solo ítem, el nombre del servicio cumple esa función y un H2 encima sería una repetición. Padding de la sección `140px 96px 0`.

**S2 SERVICIOS:** la lista se mantiene con una fila, **sin la celda del número**. Las columnas pasan a `1fr 1.15fr 200px`, o a `1fr 200px` si no hay descripción. El H2 se mantiene ("Servicios y precios" o "Nuestros servicios"), porque en esta plantilla responde una pregunta distinta del nombre del servicio.

**Cero servicios:** la sección no se renderiza y la etiqueta "Servicios" se quita del nav. Es la única excepción a las cuatro etiquetas, y solo ocurre si alguien vacía el arreglo en `/admin`, porque el chat siempre captura al menos un servicio.

**Móvil:** las mismas reglas. Con un solo servicio no hay número; en LANDING el nombre baja a `32px/1.1`.

---

## Pregunta 2 · Header móvil

### Decisión: "Hablemos" se elimina en móvil. El header en reposo mide 86px.

**1. "Hablemos" no va en móvil.** Ya hay dos accesos a la misma acción: "Escríbenos por WhatsApp" a ancho completo en el hero y el botón flotante. Un tercer botón compite con el nombre del negocio por 38px de alto, y el nombre es lo único que esa fila tiene que mostrar. En escritorio no cambia nada.

**2. Alto en reposo: 86px**, que son **42px de fila de marca + 44px de fila de nav**. Reemplaza los 82px de C6.

- **Por qué no 82px:** dejaban 38px para la fila de marca, y el dueño fijó 34px como alto base del logo en móvil. Un logo de 34px en una fila de 38px queda con 2px de aire arriba y abajo, y se ve apretado.
- **Por qué no 96–97px (lo provisorio):** existía solo para que cupiera el botón. Sin el botón, esos 10px son alto perdido justo en la pantalla más chica.

**Fila de marca, en detalle:**

- `height: 42px`, padding `0 18px`, `display: flex`, `align-items: center`, gap `9px`.
- Monograma de `26×26px`.
- Nombre del negocio en `700 12.5px/1.2`, `-.02em`, `--ink`. Puede ocupar **hasta dos líneas** (`-webkit-line-clamp: 2`, que suman 30px y caben en 42px). Si no cabe en dos, se corta con puntos suspensivos.
- No lleva nada más.

**3. Tope del logo en móvil: 34px.** La fórmula T3 de móvil cambia su tope de 46px a 34px:

```
móvil (header):  alto = clamp(22, √(3468 / r), 34);  si alto × r > 140 → alto = 140 / r
```

El alto base del dueño (34px para un logo 3:1) queda como **techo**. La regla de área constante ahora solo sirve para **achicar** los logos anchos, que son los que se ven desproporcionados.

| Proporción | Alto en el header móvil |
|---|---|
| 6:1 | 23 px (lo limita el ancho de 140px) |
| 4:1 | 29 px |
| **3:1** | **34 px** |
| 2:1 | 34 px (tope) |
| 1:1 | 34 px (tope) |
| 1:2 | 34 px (tope; ancho 17px) |

Un isotipo 1:1 de 34px junto al nombre se ve con el mismo peso que el monograma de 26px, porque el isotipo tiene aire propio y el monograma es un bloque lleno. Por eso no hace falta subir más los isotipos.

La regla de T3 se mantiene: con `r < 1.6` el logo va acompañado del nombre, y con `r ≥ 1.6` lo reemplaza.

**En el footer móvil** no hay restricción de alto y sigue la fórmula anterior (`clamp(22, √(3468 / r), 46)`), sobre la placa blanca.

**El header pegado no cambia:** 44px, solo la fila de nav y con la sombra de 5a.

---

## Pendiente que apareció al responder

**El botón flotante de WhatsApp no está en ninguna especificación de Bloques.** Lo nombran como si existiera "en toda la página", pero ni el README de LANDING ni T6 lo definen. Entiendo que se implementó por arrastre de la versión anterior.

**Lo apruebo**, y es parte del motivo para sacar "Hablemos" en móvil. Necesita medidas para que las seis plantillas lo tengan igual:

- **Forma:** círculo de `52px` en escritorio y `48px` en móvil, fondo `#25D366`, ícono blanco de `26` o `24px`. Sin sombra de elevación, consistente con la única sombra del sistema (la del header pegado).
- **Posición:** `right: 28px; bottom: 28px` en escritorio, y `right: 18px; bottom: 18px` en móvil.
- **Visibilidad:** se oculta mientras la sección **Contacto** está en pantalla (`IntersectionObserver` dentro del mismo componente cliente del nav, sin sumar un componente nuevo), para que no tape el botón "Enviar por WhatsApp" del formulario.
- **`aria-label`:** "Escríbenos por WhatsApp".

Si se implementó distinto, avísame y lo reviso contra esto antes de S3.
