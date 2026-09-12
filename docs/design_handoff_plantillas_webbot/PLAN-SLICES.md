# Plan de slices — rediseño de plantillas

> **Qué es este archivo.** El puente entre el handoff de diseño (`README.md`) y la
> implementación. El handoff dice **cómo se ve**; esto dice **en qué orden se construye,
> qué depende de qué y dónde está el riesgo**. No repite el diseño: para valores exactos
> siempre gana `README.md`.
>
> Fecha: 2026-09-12 · Ver `../DECISIONES.md`, D-23.

## El tamaño real

Los 5 templates actuales suman **~2.300 líneas** entre `index.tsx`, `sections.ts` y CSS
(medido: 1.086 de TypeScript, 1.219 de CSS). El handoff propone **6 templates** con 4
secciones cada uno, navegación SPA, animaciones y responsivo, más un tipo nuevo, 10 campos
opcionales en el DTO, una migración de Prisma y 4 rubros nuevos en el chat.

Estimación conservadora: **más de 5.000 líneas**. Contra el presupuesto de 400 líneas por
revisión, son **siete ciclos como mínimo**. Esto no es un cambio: es un programa.

## Orden y dependencias

```
S0 fundaciones ──┬── S1 LANDING
                 ├── S2 SERVICIOS
                 ├── S3 RESTAURANTE
                 ├── S4 PORTFOLIO
                 ├── S5 TIENDA
                 └── S6 PROFESIONAL  (además: enum, migración, chat)
```

**S0 bloquea todo. S1 a S5 son independientes entre sí. S6 va último.**

### S0 — Fundaciones del sistema de diseño

No entrega ninguna plantilla visible. Entrega lo que las seis comparten:

- Tokens estructurales (`--ink`, `--ink-muted`, `--line`, `--surface`, `--placeholder`)
  en `src/styles/tokens.css`, junto a los `--wb-color-*` que ya existen.
- `Instrument Serif` por `next/font/google`. Montserrat ya está cargada.
- **El clamp de contraste del acento**: función pura que sube o baja la luminancia del
  color del cliente para garantizar legibilidad sobre fondo claro y oscuro. Con tests.
- Keyframes `dvUp` / `dvFade` y el respeto a `prefers-reduced-motion`, que el prototipo
  no trae y hay que implementar.
- El envoltorio SPA: **un solo** componente cliente que envuelve el `<main>` y maneja qué
  sección está activa. Header, footer y el contenido de cada sección siguen siendo Server
  Components y entran como slots.

### S1 — LANDING

**Primero, y es deliberado.** Es el fallback de rubros desconocidos, o sea el de más
tráfico, y necesita **un solo campo nuevo** (`destacados?`). Valida el patrón completo
—sistema de diseño, SPA, clamp, responsivo— sobre la plantilla más segura.

Si el patrón está mal, se descubre en 400 líneas y no en 5.000.

### S2 a S5 — SERVICIOS · RESTAURANTE · PORTFOLIO · TIENDA

Uno por ciclo, cada uno con sus campos de DTO. Una vez probado el patrón en S1, son
repetición con personalidad propia (radios, paleta, densidad).

### S6 — PROFESIONAL, al final

Es el único que arrastra backend:

1. Valor `PROFESIONAL` en el VO `Template`, en el registry y en `RUBRO_TEMPLATES`.
2. **Migración de Prisma sobre el enum `Template`**, contra producción y sin staging
   (ver `../DECISIONES.md`, D-17).
3. Rubros nuevos `abogado`, `contador`, `psicologo`, `nutricionista` en el guion de
   `DemoChatService`, en el prompt de `ClaudeChatService` y en `rubroDefaults.ts`.

Ese punto 3 **toca el chat, que es el camino de venta**. No es trabajo de plantilla y no
debe mezclarse con el primer ciclo.

## Riesgos, en orden

| Riesgo | Por qué importa |
|---|---|
| **El clamp de contraste** | Es la pieza más sutil. Si sale mal, un cliente elige un color pálido y su sitio queda ilegible. Función pura y con tests, no a ojo. |
| **Cambio del contrato de paleta** | Hoy `src/components/templates/shared/palette.ts` inyecta 4 variables por sitio; el handoff propone una sola (`--acento`). Es más simple, pero **cambia cómo se ven los sitios ya publicados**. |
| **Migración del enum en producción** | Sin staging. Ver D-17: las migraciones se escriben y aplican a mano. |
| **Rubros nuevos en el chat** | Tocan el flujo que genera leads. Un error ahí no rompe un sitio: rompe la venta. |
| **Fotos reales** | PORTFOLIO depende de material del cliente. Si `imagenes` trae menos de 4, la grilla colapsa a 2 piezas y **no se rellena con stock**. |

## Reglas transversales del handoff que hay que respetar en todos los ciclos

- **Campo opcional ausente → no se renderiza.** Nunca rellenar con ejemplos, nunca
  mostrar un bloque vacío, nunca inventar precios ni horarios.
- **El nav se arma según lo que exista en el DTO.** Sin galería, no hay pestaña de
  galería.
- **El `.dc.html` es referencia, no código.** Estilos inline y vanilla JS porque es una
  maqueta de revisión. Se recrea con CSS Modules y el patrón
  `<nombre>/{index.tsx, sections.ts, *.module.css}` que el proyecto ya usa. Sin Tailwind,
  sin styled-components, sin librerías de UI nuevas.
- Los formularios arman mensajes de WhatsApp (`https://wa.me/<tel>?text=...`), no
  `mailto:`. Cero backend.

## Correcciones al handoff, verificadas contra el código

El handoff es sólido, pero tiene dos datos que no coinciden con el repositorio. Se
corrigen acá y no en su texto, para que siga siendo el entregable original del diseño.

1. **Los tokens de marca existen con otros nombres.** El handoff dice `--wb-navy`,
   `--wb-cyan`, `--wb-purple`, `--wb-orange`. En `src/styles/tokens.css` son
   `--wb-color-primary` (`#080056`), `--wb-color-highlight` (`#15defa`),
   `--wb-color-secondary` (`#5b46f8`) y `--wb-color-accent` (`#ffaf4d`). Mismos colores,
   otros nombres. Reutilizarlos; no declarar duplicados.

2. **La metadata por sitio ya no está pendiente.** El handoff la lista como bug vivo fuera
   de alcance. Se resolvió el 2026-09-12 y está en producción (`../DECISIONES.md`, D-18).
   Su copia de la bitácora es anterior a ese arreglo.

## Fuera de alcance, confirmado

Bloque legal, testimonios, FAQ, y un séptimo tipo `LOCAL DE BARRIO`. El bloque legal sigue
siendo el último bloqueador de venta del proyecto, pero es un cambio aparte.
