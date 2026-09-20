# plantilla-landing-spa

**Objetivo.** S1 del rediseño de plantillas: reescribir `LANDING` como SPA de cuatro
secciones siguiendo el handoff de diseño, y con eso validar el patrón completo —sistema
de diseño, `SeccionesSPA`, clamp de contraste, responsivo— sobre la plantilla más segura
antes de replicarlo en las otras cinco.

**Ruta:** ODD (organic). **Rama base:** `develop` @ `23ed10b`.
**Rama de trabajo:** `feature/plantilla-landing-spa`.
**RDD:** **apagado a nivel clon** a pedido de Agustín, mientras dure este ciclo
(`gentle-ai review mode disable --scope clone`; el global sigue en `on`).
Compromiso asumido: **avisarle para reactivarlo antes de abrir el PR**, y mientras tanto
poner la verificación funcional el orquestador — build, tests y la app en el navegador,
temprano y seguido, no al final.
**TDD:** off — sin señal de TDD en el proyecto. Chequeos funcionales ordinarios.
**Runner:** `npm run test:unit`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Por qué LANDING primero

`PLAN-SLICES.md:48-54`: es el fallback de rubros desconocidos —o sea el de más tráfico,
`resolver.ts:8-17` y `rubroTemplates.ts:22`— y necesita un solo campo nuevo. S0 bloquea
todo; S1 a S5 son independientes entre sí.

## Lo que S0 ya dejó y NO hay que reescribir

Verificado en el repo, y es más de lo que el plan admite:

- `src/components/templates/shared/SeccionesSPA.tsx` (109 líneas) + su CSS (95) — el
  wrapper cliente completo: estado de sección activa, IntersectionObserver a 0.06 con
  `unobserve`, shell de header/nav/main/footer. **Nunca fue importado por nadie**: S1 es
  su primer consumidor.
- `src/styles/motion.css` — `dvUp`/`dvFade`, cascada por `data-dv-anim`, guarda de
  `prefers-reduced-motion`. S1 no escribe CSS de animación: solo aplica atributos.
- `src/components/templates/shared/navegacion.ts` — `filtrarSecciones`, `estiloCascada`.
- `src/styles/tokens.css:75-87` — tokens estructurales `--wb-tpl-*` mapeados 1:1 a los
  `--ink/--line/--surface/...` del handoff. **Consumirlos, no redeclararlos.**
- `src/components/templates/shared/fuentes.ts` — `instrumentSerif` ya definida y sin
  importadores a propósito: el layout raíz también sirve `/chat` y `/admin`, que no
  tienen por qué pagar esa fuente. **S1 la importa en su propia raíz.**
- `src/domain/color/contraste.ts` — `clampAcento`, escrito en S0b sin importador. S1 es
  quien lo cablea. LANDING usa el acento **sobre blanco**, así que necesita el techo
  (bajar `L` si viene muy claro) para cumplir 4.5:1, no el piso.

## Alcance decidido (Agustín, 2026-09-20): patrón mínimo primero

**Entra:** las cuatro secciones en alta fidelidad, Instrument Serif, clamp de contraste
cableado, y el formulario de contacto pasando de `mailto:` a mensaje de WhatsApp.

**No entra, y queda como slice aparte:**

- **Hamburguesa móvil.** S0 la difirió explícitamente a S1
  (`SeccionesSPA.module.css:25-29`) y dejó un nav de scroll horizontal. Se mantiene el de
  S0. Construirla es estado de cliente nuevo y no aporta a validar el patrón.
- **Productor de `destacados`.** El campo se agrega al DTO, pero el chat no lo pregunta ni
  lo extrae. Consecuencia declarada: **la fila de 3 cifras no se va a ver en ningún sitio
  todavía.** Es coherente con la regla transversal del plan —campo opcional ausente, no se
  renderiza— pero hay que saberlo: se construye a oscuras.

## Riesgo atajado antes de empezar

`Footer.tsx` es **compartido** por landing, servicios, restaurante y tienda
(`grep` sobre los `index.tsx`). El spec nuevo pide footer de 76px con fondo `--ink`.
**Reestilarlo rompería visualmente las otras tres plantillas**, que nadie rediseñó
todavía. Por eso S1 le da a LANDING su propio footer y deja el compartido intacto hasta
que cada slice migre.

## Tareas

- [x] **T1 — Constructor de mensaje de WhatsApp.** `buildWhatsAppUrlConMensaje(telefono,
      mensaje): string | null` en `src/components/templates/shared/enlaces.ts`. Devuelve
      `null` sin dígitos utilizables (convención de `buildMailtoUrl`, la única del archivo
      que ya rechazaba input) y degrada al link pelado cuando el mensaje queda vacío, en
      vez de emitir un `?text=` colgando. Ninguna función existente cambió de firma.
- [x] **T2 — `destacados?` en el DTO.** `{ valor: string; etiqueta: string }[]` opcional en
      `SiteConfigDTO`, aditivo y nunca fabricado. Los dos servicios de chat arman el DTO
      campo a campo sin spread del crudo, así que el campo no se filtra solo; se agregó un
      test de regresión que lo fija.
- [ ] **T3 — `landing/sections.ts` reescrito.** De props planas a las cuatro entradas de
      `SeccionSPA[]` que consume `filtrarSecciones`. Preservar dos contratos que los tests
      actuales ya fijan y siguen siendo correctos: degrada sin lanzar con una config de
      solo `{nombre}`, y `sobreNosotros → descripcion → null`.
- [ ] **T4 — `landing/index.tsx` sobre `SeccionesSPA`.** Importa `instrumentSerif`, cablea
      `clampAcento` contra blanco, arma el nav desde lo que existe en el DTO.
- [ ] **T5 — `Landing.module.css` en alta fidelidad.** Medidas exactas del handoff
      (`README.md:179-209`). Radio 6px, que es la personalidad de esta plantilla y no se
      unifica con las otras.
- [ ] **T6 — Footer propio de LANDING.** 76px, fondo `--ink`, según spec. El compartido
      queda intacto.
- [ ] **T7 — Verificación en navegador y documentación.** Levantar la app y mirar la
      plantilla de verdad, en escritorio y en móvil. Después, docs.

## Criterios de aceptación

1. Un sitio con config mínima (`{nombre}` y poco más) renderiza sin lanzar, con las
   secciones vacías simplemente ausentes del nav.
2. El acento del cliente cumple 4.5:1 sobre blanco en texto, por el clamp, para los 11
   acentos reales de la tabla por rubro.
3. Las cuatro secciones cambian sin recargar y respetan `prefers-reduced-motion`.
4. El formulario abre WhatsApp con el mensaje precargado.
5. Las otras cuatro plantillas siguen renderizando igual que antes.
6. `tsc`, `lint`, `test:unit` y `build` en verde.

## Entrega

Pronóstico: **~600 líneas** autoradas. Supera el presupuesto de 400, así que se encadena.
Estrategia: `feature-branch-chain`, la misma que Agustín ya eligió para este repo y que es
la práctica establecida (WB-22, demo-lead-capture, D-32). Si prefiere otra, se cambia.

Corte natural, cohesivo:

- **PR1 — cimientos compartidos:** T1 + T2. Piezas puras, sin tocar plantillas. ~150.
- **PR2 — la plantilla:** T3 a T6, con sus tests y docs. ~450.

## Hallazgo preexistente que S1 tiene que respetar (no arreglar)

No hay **ninguna validación en runtime** del `configJson` al leerlo de la base:
`src/app/sites/renderizarSitio.ts:18` hace `sitio.configJson as unknown as SiteConfigDTO`,
un cast pelado. Y `ActualizarConfigSitio.usecase.ts` —el panel admin, donde se pega JSON a
mano— solo valida que `nombre` sea string no vacío.

Consecuencia directa para esta slice: un `destacados` malformado (un string en vez de un
array, objetos sin `etiqueta`) llega **intacto hasta el render**. Como la plantilla nueva
va a mapear ese arreglo, un `.map` sobre algo que no es arreglo tira en el servidor y el
sitio del cliente devuelve error.

**Decisión: no se arregla la capa de parseo en esta slice** —es preexistente y su alcance
es todo el DTO, no `destacados`—, pero **T3 construye defensivo**: el criterio de
aceptación 1 ya exige degradar sin lanzar, y eso ahora incluye explícitamente datos con
forma equivocada, no solo datos ausentes.

## Progreso

- 2026-09-20 — Exploración read-only completa. Alcance elegido: patrón mínimo. Rama creada
  desde `develop` `23ed10b`.
- 2026-09-20 — **T1 + T2 cerradas.** Verificación observada por el writer y re-corrida por
  el orquestador: `npx tsc --noEmit` limpio · `npm run test:unit` **821/821** en 61 suites
  (venía de 812, +9 tests) · `npm run lint` 0 errores con los 21 warnings preexistentes.

- 2026-09-20 — **T3 a T6 cerradas** más dos defectos encontrados **mirando la plantilla en
  el navegador**, no en los tests, y arreglados en la misma tanda:
  - **Hueco en la grilla de Servicios.** Con 4 servicios + la celda CTA quedaban 5 celdas
    en una grilla 3×2 y la sexta se veía como un rectángulo gris. Ahora el CTA se extiende
    (`grid-column: span N`, con `N` calculado del resto de la fila) y llena lo que sobra,
    para cualquier cantidad de 1 a 6+.
  - **Nosotros repetía el hero palabra por palabra.** El H2 era el nombre del negocio —el
    mismo string que el H1— y el párrafo caía a `descripcion`, que es justo lo que el hero
    ya muestra. **Se elimina el fallback `sobreNosotros → descripcion` para esta
    plantilla**: tenía sentido en el scroll largo viejo, donde los dos bloques estaban a
    miles de píxeles; en la SPA están a un clic y se leía como error. El párrafo aparece
    solo si hay `sobreNosotros` propio, y el H2 pasa a ser chrome de sección
    («Quiénes somos»), igual que «Qué ofrecemos» en Servicios. Si la sección queda sin
    texto propio **y** sin fotos, desaparece del nav. Las otras cuatro plantillas
    conservan su fallback: cada una tiene su propio `sections.ts`.
  - Verificación: `tsc` limpio · `lint` 0 errores · `test:unit` **843/843**, cero skipped
    (venía de 821) · `build` limpio · y revisión visual de las cuatro secciones.

## Verificación visual pendiente

**El móvil no se pudo verificar.** Chrome no aplica el achique de ventana por debajo de
~500px desde la automatización, y tras dos intentos se cortó en vez de insistir. El
breakpoint de 768px está escrito en el CSS, pero **nadie lo vio renderizado**. Queda como
lo único sin comprobar de esta slice.

## Próximo paso

Reactivar RDD y abrir la cadena de PRs. Antes, decidir qué hacer con la verificación móvil.
