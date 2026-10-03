# Dos preguntas sobre Bloques que el handoff no resuelve

> **Para qué es este documento.** Pegarlo en Claude Design. Son dos contradicciones
> entre `handoff_bloques/README.md` (LANDING) y `handoff_bloques_v2/00-DECISIONES-TRANSVERSALES.md`
> que aparecieron al implementar. Las dos están resueltas de forma provisoria en el código;
> necesitamos tu decisión antes de construir S2 SERVICIOS sobre la misma base.
>
> Escrito el 2026-10-03, después de implementar LANDING en Bloques completo (header,
> hero, banda de cifras, bandas de servicio, Nosotros, contacto y footer).

## Contexto mínimo

- LANDING ya sigue tu README y las decisiones T1–T10. Lo que se describe abajo como
  "hoy" es lo que está construido.
- Las respuestas valen para las seis plantillas: header, navegación y secciones son
  componentes compartidos.
- Responde cada pregunta **por escrito, con la regla exacta y su porqué**. Si eliges una
  opción que no está en la lista, descríbela con medidas.

---

## Pregunta 1 · Un solo servicio

**El conflicto.** El README de LANDING dice: *"Con un solo servicio la sección no se
justifica: el servicio se absorbe en el hero como tercera línea y la sección no se
renderiza."* Pero T1 dice que el nav tiene **siempre 4 etiquetas**
(Inicio · Servicios · Nosotros · Contacto). Si la sección desaparece, la etiqueta
"Servicios" apunta a nada. Además, en S2 SERVICIOS tú mismo decidiste lo contrario: con un
solo servicio la lista se mantiene con una fila "porque responde ¿cuánto cuesta?".

**Hoy (provisorio):** se renderiza la sección con una sola banda (forma A: número gigante
"01" + nombre + descripción + enlace a WhatsApp). El nav mantiene sus 4 etiquetas.

**Qué necesitamos que decidas:**

1. ¿La regla de "absorber en el hero" se mantiene para LANDING, o LANDING se alinea con
   S2 y siempre muestra la sección?
2. Si se mantiene, define la **"tercera línea"** con medidas: dónde va dentro del hero
   (¿bajo el párrafo, antes de los botones?), tipografía, y si lleva la descripción del
   servicio o solo el nombre.
3. Si se mantiene, ¿qué pasa con el nav? Opciones que vemos:
   - (a) baja a 3 etiquetas (rompe T1);
   - (b) "Servicios" apunta al hero;
   - (c) otra que propongas.

---

## Pregunta 2 · Header móvil de 82px

**El conflicto.** C6 fija el header móvil en **82px en reposo y 44px pegado**. Con la
fila de navegación de 44px (tu alto táctil mínimo), quedan **38px** para la fila de
marca. En esa fila hoy conviven:

- el monograma de 26px **o el logo**, que según tu propia regla T3 llega hasta **46px de
  alto** en móvil (un isotipo 1:1 o 1:2);
- el nombre del negocio (`700 12.5px`, hasta dos líneas si es largo);
- el botón **"Hablemos"**, con alto táctil de **44px**.

Ni el botón ni un logo de 46px caben en 38px. Tu maqueta 5a de móvil no dibuja el botón
en esa fila, pero ningún documento dice que se elimine.

**Hoy (provisorio):** fila de marca de 52px + fila de nav de 44px = **96–97px en
reposo**; al pegarse queda solo la fila de nav, 44px, con la sombra de tu spec. El botón
"Hablemos" queda en la fila de marca con 44px de alto.

**Qué necesitamos que decidas:**

1. ¿"Hablemos" se elimina en móvil? (El hero ya tiene "Escribir por WhatsApp" a ancho
   completo y hay un botón flotante de WhatsApp en toda la página.)
2. ¿Cuál es el alto máximo del logo en la fila de marca móvil? Si los 82px se mantienen,
   la regla T3 móvil (`clamp(22, √(3468 / r), 46)`) necesita un tope menor.
3. Si prefieres conservar el botón, confirma que el header en reposo puede medir 96px y
   que 82px queda descartado.

---

## Lo que NO cambia con tu respuesta

- El header pegado sigue siendo solo la fila de nav, 44px, sin hamburguesa.
- Escritorio no se toca (96px, con "Hablemos").
- La regla T3 de escritorio se mantiene.
