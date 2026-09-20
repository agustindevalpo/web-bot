# WebBot — Decisiones de arquitectura

> **Qué es este archivo.** El registro **append-only** de las decisiones que siguen
> rigiendo el proyecto. Juntas son la constitución de WebBot: explican por qué el
> código es como es y qué obliga o prohíbe de aquí en adelante.
>
> Reglas: se agrega al final, nunca se borra. Una decisión revertida no se elimina, se
> marca como reemplazada y se apunta a la que la sustituye. Toda decisión lleva
> evidencia verificable (`archivo:línea`, commit o clave de Engram) — sin evidencia es
> una opinión, no un registro.
>
> Los artefactos SDD en Engram (proyecto `web-bot`) son la fuente de verdad; este
> archivo los consolida. Estado de hoy: [`ESTADO.md`](./ESTADO.md).
> Historia día a día: [`BITACORA.md`](./BITACORA.md).

---

## D-01 — Flujo de ramas `feature` → `develop` → `main`, sin staging

**Fecha:** 2026-08-10 · **Estado:** vigente
**Contexto:** proyecto de un solo desarrollador con auto-deploy en Railway y sin
presupuesto para un entorno de staging.
**Decisión:** todo cambio nace en `feature/*`, se integra en `develop` y llega a
producción al mergear `develop` → `main`. Railway solo escucha `main`.
**Por qué:** `develop` da un punto de integración donde correr tests sin exponer nada;
un tercer entorno agregaría costo e infraestructura para un equipo de una persona. Se
acepta a cambio que no exista una réplica de producción donde ensayar.
**Consecuencia:** mergear a `main` es desplegar. No hay ensayo previo: lo que se
verifica antes del merge es lo único que se verifica. Las migraciones y los datos de
prueba se manejan a mano contra la Postgres real (ver D-16).
**Evidencia:** Engram `sdd-init/web-bot` (obs 1); `git log main`.

---

## D-02 — Arquitectura hexagonal con composition root manual

**Fecha:** 2026-08-10 · **Estado:** vigente
**Contexto:** había que decidir si organizar `src/` por convención de Next.js o por
capas de arquitectura.
**Decisión:** `src/` se organiza por capa (`domain`, `application`, `infrastructure`,
`app`, `components`). El dominio no depende de ningún framework; los casos de uso
dependen solo de puertos (`I*Repository`, `I*Service`); la infraestructura implementa
esos puertos. Toda la composición vive en un único archivo,
`src/infrastructure/container.ts`, escrito a mano.
**Por qué:** se rechazó un contenedor de DI con decoradores porque agrega una
dependencia y magia en tiempo de ejecución para un proyecto con una veintena de
objetos; un archivo de composición explícito se lee de arriba abajo y hace obvio qué
implementación está activa. Se rechazó organizar por feature porque el dominio
(`Cliente`, `Sitio`, `Pago`) es más estable que las pantallas.
**Consecuencia:** ninguna ruta de `src/app/` puede importar Prisma ni un adaptador
concreto: importa del container. Cambiar de proveedor (correo, IA, DNS) es cambiar una
línea del container, no buscar por el repo.
**Evidencia:** `src/infrastructure/container.ts`; Engram `sdd-init/web-bot` (obs 1).

---

## D-03 — Prisma 7 siempre con driver adapter

**Fecha:** 2026-08-10 · **Estado:** vigente
**Contexto:** Prisma 7 dejó de aceptar la construcción directa del cliente.
**Decisión:** el cliente se construye con `PrismaPg` de `@prisma/adapter-pg` sobre
`DATABASE_URL`, en `src/infrastructure/db/index.ts`. El `schema.prisma` vive bajo
`src/infrastructure/db/prisma/` y la configuración en `prisma.config.ts` en la raíz.
**Por qué:** no es una preferencia sino un requisito de la versión: `new PrismaClient()`
sin adaptador falla en tiempo de ejecución. Los ejemplos de la documentación antigua y
del roadmap original usan la forma vieja y están mal.
**Consecuencia:** `postinstall: prisma generate` es obligatorio en `package.json` o el
build de Railway falla. Cualquier snippet copiado de documentación anterior a Prisma 7
hay que adaptarlo antes de usarlo.
**Evidencia:** `src/infrastructure/db/index.ts`; `package.json` (`postinstall`);
Engram `sdd-init/web-bot` (obs 1).

---

## D-04 — El multitenant entra por `src/proxy.ts` y decide en una función pura

**Fecha:** 2026-08-10 (`proxy.ts`) · 2026-09-05 (`resolverDestino`) · **Estado:** vigente
**Contexto:** un solo despliegue sirve la app, los subdominios `*.sitios.devalpo.cl` y
los dominios propios de clientes. Next.js 16 renombró `middleware.ts` a `proxy.ts`, con
función exportada `proxy` en vez de `middleware`.
**Decisión:** `src/proxy.ts` es un adaptador delgado; toda la clasificación del host
vive en `resolverDestino()`, una función pura sin dependencias de Next. Devuelve
`app`, `subdominio` o `dominioPropio` y la ruta interna a reescribir.
**Por qué:** el middleware de Next corre en un entorno donde testear es caro; una
función pura se cubre con tests unitarios normales. La regla de precedencia (la cabecera
`X-WebBot-Forwarded-Host` se evalúa primero, pero igual pasa por las reglas de app y
subdominio) evita que una cabecera legítima convierta la app en una búsqueda por
dominio propio.
**Consecuencia:** la lógica de enrutado no se toca en `proxy.ts`, se toca en
`resolverDestino.ts` y se prueba ahí. Cualquier documentación que hable de
`middleware.ts` está desactualizada.
**Evidencia:** `src/proxy.ts:12`; `src/infrastructure/routing/resolverDestino.ts:82`;
`tests/unit/infrastructure/routing/resolverDestino.test.ts`.

---

## D-05 — Cobertura con umbrales por capa, no un único número global

**Fecha:** 2026-08-10 · **Estado:** vigente
**Contexto:** el roadmap original pedía 80% parejo en todo el repo.
**Decisión:** `jest.config.ts` fija un piso global de 70 branches / 80 functions / 80
lines / 80 statements, y pisos más altos donde importa: dominio 80/90/90/90, casos de
uso 70/85/85/85, `infrastructure/claude` 70/85/85/85. `collectCoverageFrom` cubre solo
`domain`, `application` y `claude`.
**Por qué:** exigir el mismo porcentaje a un value object y a un adaptador de UI empuja
a escribir tests decorativos. Los prompts preexistentes bajo `claude/prompts/` quedan
excluidos explícitamente porque ningún módulo los consume.
**Consecuencia:** bajar cobertura en el dominio rompe el build aunque el promedio global
se mantenga. Agregar una capa nueva a `collectCoverageFrom` obliga a definirle su piso.
**Evidencia:** `jest.config.ts:9-46`.

---

## D-06 — E2E con Cucumber + Playwright

**Fecha:** 2026-08-10 · **Estado:** vigente
**Contexto:** el plan original mencionaba Selenium.
**Decisión:** los escenarios end-to-end se escriben en Gherkin en español bajo
`tests/e2e/features/` y los steps manejan el navegador con `@playwright/test`. Selenium
no se instaló nunca.
**Por qué:** Playwright trae su propio runtime de navegador, corre headless sin
configurar drivers y ya viene tipado para TypeScript. Cucumber se mantiene porque los
escenarios en español sirven de especificación legible.
**Consecuencia:** los e2e necesitan `npx playwright install chromium` una vez y un
`npm run dev` levantado contra una base con datos. Cero referencias a Selenium en el
repo: si aparece una, es documentación vieja.
**Evidencia:** `cucumber.js`; `tests/e2e/steps/sitio-por-subdominio.steps.ts:2-3`;
`package.json` (devDependencies).

---

## D-07 — Correo real por Resend (HTTP), con cascada de fallback

**Fecha:** 2026-08-25 · **Estado:** vigente
**Contexto:** el magic link no llegaba en producción.
**Decisión:** `container.ts` elige el adaptador de correo en cascada: `ResendEmailService`
si hay `RESEND_API_KEY`, si no `GmailSmtpEmailService` cuando están `GMAIL_USER` y
`GMAIL_APP_PASSWORD`, si no `DevEmailService` (loguea el link a consola).
**Por qué:** Railway bloquea el egress SMTP en los puertos 465 y 587, así que Gmail no
puede funcionar en producción por mucho que las credenciales sean correctas. Resend usa
API HTTP y atraviesa ese bloqueo. Gmail se conserva porque sí sirve en local.
**Consecuencia:** cualquier proveedor de correo nuevo tiene que hablar HTTP, no SMTP.
Sin ninguna credencial la app no falla al arrancar: degrada a consola, lo que en
producción significa que el magic link simplemente no llega.
**Evidencia:** `src/infrastructure/container.ts:48-56`; `.env.example` (bloque de
correo); Engram `sdd/phase2-rollout/proposal` (obs 32).

---

## D-08 — `ClaudeChatService` se construye perezoso y falla en 503, no al arrancar

**Fecha:** 2026-08-24 · **Estado:** vigente
**Contexto:** el constructor del adaptador valida `ANTHROPIC_API_KEY` y tira si falta,
pero el modo demo no necesita esa clave.
**Decisión:** el container expone `getChatServiceReal(): IChatService | null`, memoizado,
que devuelve `null` cuando no hay clave. `/api/chat` responde 503 `chat_no_configurado`
en ese caso. El modelo se lee de `ANTHROPIC_MODEL` con default `claude-sonnet-4-6`.
**Por qué:** se rechazó el ternario *eager* (como el de correo) porque instanciar el SDK
al bootear rompería el arranque en un despliegue que solo usa la demo. Se rechazó
hardcodear el modelo, como hacía el roadmap, para poder rotarlo sin desplegar.
**Consecuencia:** el despliegue es inerte hasta que alguien cargue la clave en Railway, y
quitarla desactiva el chat real sin tocar código. `route.ts` y `container.ts` comparten
la única instancia: no se puede instanciar el servicio en otro lado.
**Evidencia:** `src/infrastructure/container.ts:78-85`; Engram
`sdd/claude-chat-service/design` (obs 7), decisiones D1-D3.

---

## D-09 — Suscripciones mensuales Starter / Pro / Agencia

**Fecha:** 2026-08-08 · **Estado:** **reemplazada por D-10**
**Contexto:** el modelo de negocio original apuntaba a MRR con tres planes
($19.990 / $39.990 / $99.990 al mes).
**Decisión (histórica):** cobro recurrente gestionado por el motor de pagos de Devalpo,
con el plan determinando si el cliente tenía dominio propio.
**Por qué se abandonó:** ver D-10. Se registra aquí porque dejó rastro vivo en el código.
**Consecuencia:** quedan vestigios que hay que reconocer y no confundir con el modelo
actual: el enum `Plan { STARTER, PRO, AGENCIA }` sigue en el esquema y `Cliente.plan`
tiene default `STARTER`; `IPagoService` sigue declarando `crearSuscripcion` /
`cancelarSuscripcion`. Nada de eso se usa para cobrar.
**Evidencia:** `src/infrastructure/db/prisma/schema.prisma:14,69-73`;
`src/application/services/IPagoService.ts`; `README.md:104-110` (documento desactualizado).

---

## D-10 — Pago único, promesa de un día, dominio propio incluido

**Fecha:** 2026-09-05 · **Estado:** vigente
**Contexto:** Devalpo vendía 2 sitios al mes, todos por referidos y casi sin marketing.
**Decisión:** se abandona la suscripción. WebBot pasa a ser el motor de producción de una
oferta de **pago único** con la promesa "tu sitio web en un día, en producción, con tu
propio dominio", a precio bajo y volumen empujado por marketing.
**Por qué:** el costo marginal de producir un sitio con WebBot es casi cero, así que la
palanca es el volumen, no la recurrencia. Se descartó bajar a margen cero: el CAC tiene
que quedar por debajo del margen por sitio. La promesa de "un día" obliga a que la
automatización del dominio propio sea la función crítica, no un extra del plan caro.
**Consecuencia:** la landing, los precios y el CTA hablan de un pago único. El motor de
pagos por suscripción deja de estar en el camino crítico. Toda funcionalidad que no
acerque una venta se pospone; la regla de Agustín es dejar de programar hasta cerrar 5
ventas.
**Evidencia:** Engram `webbot/business/positioning` (obs 273);
`src/app/_landing/precios.ts:5-13`.

---

## D-11 — Cinco templates independientes, con resolver puro y registry separado

**Fecha:** 2026-09-05 · **Estado:** vigente
**Contexto:** todos los sitios se renderizaban con un único layout genérico, y el mapeo
rubro → template estaba duplicado en tres lugares.
**Decisión:** un único mapa `RUBRO_TEMPLATES` (10 rubros → 5 valores de `Template`) con
fallback a `LANDING`; cinco componentes independientes bajo
`src/components/templates/{landing,servicios,portfolio,restaurante,tienda}/`; el
`resolver.ts` puro queda separado del `registry.ts` que importa JSX y CSS Modules.
**Por qué:** se rechazó un template parametrizable porque el criterio de aceptación era
que se vieran *distintos*, y parametrizar habría producido cinco variantes del mismo
layout. La separación resolver/registry existe porque el proyecto Jest `unit` no mapea
JSX ni CSS: el resolver se testea unitariamente y el registry se cubre por e2e. Las
búsquedas en el registry usan `Object.hasOwn` por seguridad ante contaminación de
prototipo, ya que el valor viene de la base.
**Consecuencia:** agregar un rubro es tocar un solo mapa. Agregar un template es agregar
una carpeta y una entrada al registry. Los builders de sección deben ser funciones puras
para poder testearse sin DOM.
**Evidencia:** `src/infrastructure/templates/rubroTemplates.ts:8-22`;
`src/components/templates/registry.ts:15-21`; `src/components/templates/resolver.ts`;
Engram `sdd/site-templates/archive-report` (obs 271).

---

## D-12 — Dominios propios con Cloudflare for SaaS y un Worker, no con Railway

**Fecha:** 2026-09-05 · **Estado:** vigente
**Contexto:** cada cliente necesita su propio dominio, y el plan de Railway limita los
dominios personalizados por servicio (Trial 1, Hobby 2, Pro 20).
**Decisión:** el dominio del cliente apunta por CNAME a Cloudflare for SaaS en la zona
`devalpo.cl`; Cloudflare termina TLS y un Worker reenvía al host wildcard de Railway con
las cabeceras `X-WebBot-Forwarded-Host` y `X-WebBot-Worker-Secret`. Los nameservers de
`devalpo.cl` se mueven de Bluehost a Cloudflare.
**Por qué:** el límite de Railway hacía inviable el modelo apenas pasados un par de
clientes; el plan gratuito de Cloudflare incluye 100 custom hostnames y cobra USD 0,10
al mes por cada uno adicional. Bluehost sigue alojando el WordPress institucional de
Devalpo, y el MX de Google Workspace no se toca.
**Consecuencia:** el secreto compartido es lo que hace confiable la cabecera: en local va
vacío y la cabecera se acepta tal cual, en producción tiene que coincidir exacto. El
registro `_acme-challenge` debe quedar DNS-only, sin proxy. Sin
`CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ZONE_ID` el panel guarda el dominio en la base pero
no lo registra en el edge (`NoopCustomHostnameService`).
**Evidencia:** Engram `webbot/custom-domains/architecture` (obs 279);
`src/infrastructure/container.ts:92-99`; `src/infrastructure/routing/resolverDestino.ts:55-66`;
`infra/cloudflare/worker/src/index.ts`; `docs/DOMINIO_PROPIO.md`.

---

## D-13 — Los precios viven en un solo módulo y los cupos se llevan a mano

**Fecha:** 2026-09-06 · **Estado:** vigente
**Contexto:** el precio aparece en la landing y en el CTA de la demo.
**Decisión:** `src/app/_landing/precios.ts` es el único lugar donde se escriben precios y
cupos; un test prohíbe duplicarlos fuera de ahí. `CUPOS_VENDIDOS` es una constante que se
actualiza a mano al vender.
**Por qué:** se rechazó contar los cupos en la base de datos porque implicaría una
consulta y un modelo para un número que cambia diez veces en total. El costo es que
alguien tiene que acordarse de sumar uno.
**Consecuencia:** al vender un cupo hay que subir `CUPOS_VENDIDOS`, desplegar y anotarlo
en `BITACORA.md`. Escribir un precio en un componente rompe el test.
**Evidencia:** `src/app/_landing/precios.ts:1-13`;
`tests/unit/app/landing/precioImports.test.ts`.

---

## D-14 — Cobro por link de Mercado Pago y activación manual desde `/admin`

**Fecha:** 2026-09-06 · **Estado:** vigente
**Contexto:** hacía falta cobrar ya, y el motor de pagos de Devalpo no está desplegado.
**Decisión:** el CTA apunta a un link de pago de Mercado Pago leído de
`NEXT_PUBLIC_MERCADOPAGO_LINK_URL` (si falta, cae a `/login`). No hay webhook: en
`/admin/sitios/[id]` se confirma el pago a mano, lo que reasigna el sitio demo al
comprador, activa al cliente y registra un `Pago` `CONFIRMADO` con proveedor
`MERCADOPAGO`.
**Por qué:** se descartó integrar varias pasarelas (Flow y Banco de Chile también están
habilitados) porque multiplicaba el trabajo sin acercar una venta. La URL no se hardcodea
para poder cambiarla desde Railway sin desplegar. La activación manual reutiliza
`ActivarClienteUseCase`, que ya existía y no usaba nadie.
**Consecuencia:** el cobro no es automático y no lo será hasta que exista el webhook: si
nadie mira Mercado Pago, el cliente paga y no se activa. El comprador nunca puede
terminar siendo el cliente demo compartido; esa confirmación se rechaza.
**Evidencia:** Engram `webbot/wb-43/decision` (obs 308); `src/app/chat/hrefPago.ts`;
`src/infrastructure/container.ts:114`; `docs/PANEL_INTERNO.md` (sección "Pago y activación").

---

## D-15 — El sitio demo se revela solo después de dejar nombre y correo

**Fecha:** 2026-09-07 · **Estado:** vigente
**Contexto:** la demo entregaba el sitio generado sin pedir nada, así que no quedaba
ningún lead.
**Decisión:** `/api/chat` deja de crear el `Sitio` y de devolver `subdominioDemo` al
completar la conversación: devuelve `requiereLead: true`. El sitio se materializa dentro
de `CapturarLeadDemoUseCase`, detrás de un `POST /api/chat/lead` propio. El `Sitio`
generado en demo pertenece **siempre** a `CLIENTE_DEMO_ID`
(`cliente-demo-webbot-devalpo`); la atribución del visitante va en un campo nuevo
nullable `Sesion.clienteId`. Un reenvío con la sesión ya atribuida corta circuito y
devuelve el mismo subdominio sin reescribir nada.
**Por qué:** se rechazó un discriminador en el cuerpo de `/api/chat` porque ese handler
ya entrelaza auth, dos limitadores y lógica de reintento. Se rechazó reasignar
`Sitio.clienteId` al visitante porque rompe el flujo de confirmación de pago (D-14) y la
insignia del panel. Se rechazó guardar nombre y correo en `datosJson` porque se pierde la
fila `Cliente` y la deduplicación por `email @unique`. El corte por atribución existente
evita que un reenvío con otro correo reatribuya el lead en silencio.
**Consecuencia:** `npm run db:seed-demo` pasa a ser precondición de cualquier entorno:
sin la fila del cliente demo, el endpoint de lead cae con `P2003` en
`Sitio_clienteId_fkey` y devuelve un 500 opaco. Confirmar el pago es el momento —y el
único— en que un sitio demo cambia de dueño.
**Evidencia:** Engram `sdd/demo-lead-capture/design` (obs 391), decisiones D1, D2, D5, D6;
`src/infrastructure/demo/rubroDefaults.ts:4`; `src/infrastructure/container.ts:115`;
`src/infrastructure/db/prisma/schema.prisma:54-55`.

---

## D-16 — `findOrCreateByEmail` en el puerto, con `create` → `P2002` → refetch

**Fecha:** 2026-09-07 · **Estado:** vigente
**Contexto:** dos envíos simultáneos del formulario de lead con el mismo correo pueden
crear dos clientes.
**Decisión:** el puerto `IClienteRepository` expone `findOrCreateByEmail`; la
implementación Prisma hace `create`, atrapa el código `P2002` de clave única y vuelve a
buscar por email.
**Por qué:** se rechazó `upsert` porque no es atómico bajo concurrencia en este caso. Se
rechazó atrapar `P2002` dentro del caso de uso porque haría entrar
`PrismaClientKnownRequestError` a la capa de aplicación, que no debe conocer el ORM.
**Consecuencia:** cualquier "buscar o crear" por clave única se resuelve en la
infraestructura y se expone como una sola operación del puerto. Los códigos de error de
Prisma no cruzan hacia arriba.
**Evidencia:** Engram `sdd/demo-lead-capture/design` (obs 391), decisión D3;
`src/domain/repositories/IClienteRepository.ts`;
`src/infrastructure/db/repositories/PrismaClienteRepository.ts`.

---

## D-17 — Las migraciones se escriben a mano y se aplican a mano

**Fecha:** 2026-09-07 · **Estado:** vigente
**Contexto:** no hay staging (D-01) y el despliegue de Railway no ejecuta migraciones:
no hay `prisma migrate deploy` ni en el build ni en el arranque.
**Decisión:** `prisma migrate dev` no se usa nunca en este proyecto. El procedimiento es
previsualizar el SQL con `prisma migrate diff --from-config-datasource
--to-schema=... --script` (solo lectura), escribir a mano
`prisma/migrations/<timestamp>_<nombre>/migration.sql` con ese SQL, y aplicarlo con
`prisma migrate deploy`.
**Por qué:** `migrate dev` es una herramienta de desarrollo que aprovisiona una shadow
database y puede reescribir el historial; apuntando a la Postgres de producción es
inaceptable. Los flags que aparecen en la documentación web para este flujo están mal:
los correctos son los de arriba.
**Consecuencia:** toda release que incluya una migración nueva exige un paso manual
contra producción antes o después del deploy. Olvidarlo deja la app corriendo contra un
esquema viejo. Antes de desplegar conviene consultar `_prisma_migrations` para saber qué
está aplicado.
**Evidencia:** Engram `sdd/demo-lead-capture/design` (obs 391), sección Migration;
Engram obs 582 (verificación de `_prisma_migrations` en producción);
`prisma/migrations/`.

---

## D-18 — Cada sitio de cliente sirve su propia metadata y Open Graph

**Fecha:** 2026-09-12 · **Estado:** vigente
**Contexto:** `src/app/layout.tsx` exportaba un único objeto `metadata` con la copia
comercial de Devalpo, y ninguna ruta lo sobrescribía: el sitio de una panadería mostraba
el título de otra empresa en la pestaña, en Google y en las previsualizaciones de
WhatsApp. Era un bloqueador de venta.
**Decisión:** las dos rutas de sitio (`/sites/[subdominio]` y `/sites/custom/[host]`)
exportan `generateMetadata`, que delega en un composer puro
(`src/app/sites/metadataSitio.ts`). El título es `{nombre} | {rubro} en {ciudad}`
omitiendo segmentos en blanco. Si `descripcion` está vacía **se deriva**, no se omite.
`og:url` es absoluta y se construye desde los parámetros de ruta, nunca desde
`headers()`. `og:image` sale de `configJson.imagenes[0]` transformada con `URL`/
`searchParams`. Un sitio inexistente o inactivo devuelve `{}`. La búsqueda del `Sitio`
se centraliza en `src/app/sites/buscarSitio.ts` envuelta en `React.cache()` a nivel de
módulo.
**Por qué:** se incluyó Open Graph porque las PyMEs chilenas comparten el link por
WhatsApp y la previsualización es parte del producto; la documentación de Meta lista
`og:description` como requerida, y por eso derivar gana a omitir — un validador
independiente detectó esa contradicción entre el diseño y el spec antes de implementar.
`og:url` viene de los parámetros de ruta porque la resolución de ruta es la que ya tomó
la decisión de confianza sobre el host. `React.cache()` evita duplicar la consulta a
Postgres en cada vista de sitio.
**Consecuencia:** `generateMetadata` y el componente de página deben llamar al mismo
binding cacheado con el mismo argumento, o vuelven las dos consultas. Las rutas
comerciales (`/`, `/chat`, `/login`, `/admin*`, `/onboarding`) conservan la metadata de
Devalpo sin cambios. Un `<title>` raro en un sitio de cliente es dato corrupto en
`configJson`, no un defecto del composer.
**Evidencia:** `src/app/sites/metadataSitio.ts`; `src/app/sites/buscarSitio.ts`;
`src/app/sites/urlSitio.ts`; commits `9d502dc`, `33fd96a`, `af76c85`, `54a573c`;
release `7f88280`; Engram `sdd/site-metadata/archive-report` (obs 583) y
`sdd/site-metadata/design` (obs 575, revisión 2).

---

## D-19 — Engram es la fuente de verdad; los `.md` son su reflejo

**Fecha:** 2026-09-12 · **Estado:** vigente
**Contexto:** la documentación se congeló el 2026-08-08/10 mientras el proyecto mutó
durante un mes. Los ciclos SDD sí describían la realidad, pero dispersos en un artefacto
por cambio e invisibles.
**Decisión:** el estado del proyecto vive en Engram (modo de persistencia `engram`, sin
`openspec/`). `docs/ESTADO.md` y `docs/DECISIONES.md` son proyecciones regenerables:
`ESTADO.md` se reemplaza completo en cada regeneración, `DECISIONES.md` solo se agrega al
final. Ante una discrepancia, gana Engram.
**Por qué:** un documento que se edita a mano en cada sesión se desincroniza; uno que se
regenera desde una fuente única no puede mentir por más de una regeneración. Se separan
en dos archivos porque responden preguntas distintas —qué es hoy y por qué es así— y
tienen ciclos de vida opuestos: uno se sobrescribe, el otro se acumula.
**Consecuencia:** ningún documento de `docs/` es fuente primaria. `docs/historico/`
queda como archivo muerto y no se cita como hecho. Si `ESTADO.md` empieza a crecer más
allá de dos pantallas, el exceso pertenece a `BITACORA.md`. Toda decisión que se tome en
una sesión debe quedar en Engram antes de reflejarse acá.
**Evidencia:** Engram `sdd-init/web-bot` (obs 1), sección Persistence mode;
`docs/historico/WEBBOT_ARQUITECTURA.md` y `docs/historico/WEBBOT_ROADMAP.md` (movidos en
la rama `docs/reconciliacion`).

## D-20 — La documentación es parte del `done` de un ciclo, no un paso posterior

**Fecha:** 2026-09-12 · **Estado:** vigente
**Contexto:** la reconciliación de D-19 arregló el mapa, pero no la causa de que se
pudriera. `sdd-archive` cerraba el ciclo en Engram sin tocar `docs/`, así que nada
promovía lo aprendido hacia la documentación viva. Cada ciclo dejaba su verdad enterrada
en su propio artefacto y el mapa nunca se movía. Sin una forzante, volvía a congelarse.
**Decisión:** un ciclo SDD no está cerrado hasta que la documentación refleja lo que
cambió. `sdd-archive` no puede reportar `done` sin (1) agregar a `DECISIONES.md` una
entrada por cada decisión vigente que el ciclo tomó, (2) regenerar `ESTADO.md` si el ciclo
invalidó algo que ese archivo afirma, y (3) declarar explícitamente en el informe de
archivo si no hubo nada que actualizar. El orquestador verifica los tres puntos antes de
aceptar el resultado. La misma regla rige el trabajo directo sin ciclo: si un cambio
invalida una afirmación de `ESTADO.md`, se actualiza en el mismo commit o PR.
**Por qué:** la documentación desactualizada no es neutra, es activamente dañina. La
auditoría del 2026-09-12 encontró que `docs/COMANDOS.md` recomendaba `prisma migrate dev`,
un comando que D-17 prohíbe en este proyecto, y que `README.md` afirmaba cobro recurrente
mensual una semana después de que el modelo pasara a pago único. Un documento así no
solo confunde: induce errores. Se exige declarar el "no hubo nada que actualizar" porque
el silencio se lee igual que el olvido, y eso es precisamente lo que no se puede
distinguir a un mes de distancia.
**Consecuencia:** archivar un ciclo cuesta más. Ese costo es deliberado y es el precio de
que el mapa siga sirviendo. Un informe de archivo sin mención a la documentación es un
ciclo incompleto, no uno terminado. Una entrada en `DECISIONES.md` sin evidencia
verificable no entra.
**Evidencia:** `CLAUDE.md` del proyecto, sección "Documentación viva"; auditoría en
`docs/COMANDOS.md:72` (el `migrate dev` corregido) y `README.md` (reescrito), ambos en el
commit `cd3932b`.

## D-21 — Se documentan `Plan`, `PausarSitio` y `ReactivarSitio` en vez de eliminarlos; se retira el proyecto Jest `integration` vacío

**Fecha:** 2026-09-12 · **Estado:** vigente
**Contexto:** una auditoría de deuda técnica encontró tres vestigios candidatos a
eliminar: el enum `Plan` y `Cliente.plan` (heredados de D-09), los casos de uso
`PausarSitioUseCase` y `ReactivarSitioUseCase` (compuestos en el container pero sin ruta
que los consuma), y el proyecto Jest `integration`, que solo contenía
`tests/integration/mocks/` y cero archivos `*.test.ts`, por lo que `npm run
test:integration` pasaba en verde sin haber ejecutado ninguna aserción propia.
**Decisión:** se conservan `Plan`, `PausarSitioUseCase` y `ReactivarSitioUseCase`,
documentando en el propio código por qué siguen ahí, y se retira el proyecto Jest
`integration` (y el script `test:integration`) moviendo sus mocks a `tests/mocks/`, que sí
usan seis tests unitarios.
**Por qué:** `PausarSitioUseCase`/`ReactivarSitioUseCase` no son código muerto, son el
flujo de suspensión por pago fallido bloqueado en que el motor de pagos de Devalpo no está
deployado (docs/ESTADO.md, sección 4) — su composición explícita sigue en
`src/infrastructure/container.ts:63-64`. Eliminar `Plan` costaría una migración contra la
base de producción (D-09) sin ninguna ganancia funcional, porque ningún módulo lee
`Cliente.plan` para decidir algo, verificado por grep. Un comando de test que no hace
ninguna aserción es peor que no tener el comando, porque se lee como cobertura cuando no
prueba nada: `tests/integration/` solo tenía `mocks/`, sin un solo `*.test.ts`.
**Consecuencia:** `schema.prisma`, `PausarSitio.usecase.ts` y `ReactivarSitio.usecase.ts`
llevan ahora un comentario que explica por qué siguen ahí. `jest.config.ts` solo declara
el proyecto `unit`; `package.json` ya no tiene el script `test:integration` ni las
dependencias `supertest`/`@types/supertest`, sin uso en ningún test del repositorio.
**Evidencia:** `src/infrastructure/db/prisma/schema.prisma:19,78`;
`src/infrastructure/container.ts:63-64`; `jest.config.ts:51` (único `displayName`
restante); `package.json` (scripts `test:*`); `tests/mocks/` (los cuatro mocks movidos,
antes en `tests/integration/mocks/`); rama `chore/deuda-tecnica`.

---

## D-22 — Sandbox de pagos local, con contraste declarado-vs-real para no fallar en silencio

**Fecha:** 2026-09-12 · **Estado:** vigente
**Contexto:** WebBot no tiene integración de Mercado Pago: el cobro es un único link
estático en `NEXT_PUBLIC_MERCADOPAGO_LINK_URL` (D-14), y hasta ahora no había forma de
probar el flujo de pago sin usar el link real. El riesgo concreto: alguien apunta la app
al checkout de pruebas de Mercado Pago para ensayar y se olvida de revertirlo — un
cliente real llega al checkout y no puede pagar, sin que nada lo avise.
**Decisión:** el sandbox corre **local, contra su propio contenedor** (`npm run
dev:sandbox`, `scripts/dev-sandbox.mjs`), no como un segundo ambiente desplegado: solo
existe el ambiente `production` en Railway (docs/ESTADO.md, sección 2) y un segundo
servicio cuesta dinero real para un desarrollador solo. Además de la URL del link, se
agrega una variable de intención explícita, `NEXT_PUBLIC_PAGOS_MODO` (`produccion` /
`prueba`), que nunca se usa sola: `contrastarModoPago()`
(`src/app/chat/hrefPago.ts:95-110`) la cruza contra `clasificarEnlacePago()`
(`src/app/chat/hrefPago.ts:41-73`), que deriva la clasificación real leyendo la URL con
`URL` (host `mpago.la` = productivo; `pref_id` o `/checkout/v1/redirect` = prueba). El
resultado del contraste, no la clasificación sola, decide el banner en `DemoCTA.tsx:46-62`:
`discrepancia` (declarado y real no coinciden, en cualquier dirección) muestra una alerta
roja más fuerte que la de sandbox tranquilo (`coincide-prueba`); sin declaración
(`sin-declarar`) o con la URL sin reconocer (`indeterminado`) no muestra nada, porque no
hay una afirmación que contrastar. `dev-sandbox.mjs` fija ambas variables juntas
(`NEXT_PUBLIC_PAGOS_MODO=prueba` + el link de sandbox) para que el propio sandbox quede
consistente y muestre siempre el banner tranquilo, nunca el de discrepancia.
**Por qué:** una bandera declarada sola es peor que no tener bandera, porque crea dos
fuentes de verdad que pueden discrepar sin que nadie se entere — alguien pone el link de
sandbox, deja `NEXT_PUBLIC_PAGOS_MODO=produccion` puesto de una prueba anterior, y el
sistema afirmaría "producción" con confianza mientras el checkout real está roto. Por eso
la bandera nunca se lee sola: solo vale contrastada contra la URL, que es la evidencia. Se
rechazó tratar la ausencia de bandera como "producción por defecto" porque eso fingiría
una certeza que nadie declaró; se rechazó fundir el banner de discrepancia con el de
sandbox tranquilo porque son severidades distintas — alguien que declaró producción y ve
el banner calmo de sandbox no se entera de que hay un problema real.
**Consecuencia:** el sandbox no reemplaza un ambiente de staging ni lo intenta ser: es una
herramienta de desarrollo local, desechable, sin datos que preservar entre corridas. El
banner de alarma solo se activa cuando alguien declara `NEXT_PUBLIC_PAGOS_MODO`
explícitamente — Railway en producción debería declarar `produccion` para que una
discrepancia futura (por ejemplo, alguien pega el link de sandbox por error) se vea de
inmediato en vez de quedar en silencio como hoy.
**Evidencia:** `src/app/chat/hrefPago.ts:20-110`; `src/app/chat/DemoCTA.tsx:12-18,46-62`;
`src/app/chat/DemoCTA.module.css` (clases `.alertaSandbox`/`.alertaDiscrepancia`);
`scripts/dev-sandbox.mjs`; `tests/unit/app/chat/hrefPago.test.ts`; docs/ESTADO.md,
secciones 1 y 6 (un solo ambiente Railway, receta local existente en el puerto 5433).

## D-23 — El rediseño de plantillas entra por ciclos, con `LANDING` primero y `PROFESIONAL` último

**Fecha:** 2026-09-12 · **Estado:** vigente
**Contexto:** llegó un handoff de diseño de alta fidelidad
(`docs/design_handoff_plantillas_webbot/`) que reemplaza las 5 plantillas actuales por 6
plantillas SPA y agrega un tipo nuevo, `PROFESIONAL`. Las 5 actuales suman ~2.300 líneas
entre TypeScript y CSS; lo propuesto supera las 5.000, más 10 campos opcionales de DTO,
una migración de Prisma y 4 rubros nuevos en el chat. Contra el presupuesto de 400 líneas
por revisión (D-21 y el preflight de sesión), no cabe como un cambio.
**Decisión:** se corta en siete ciclos con dependencias explícitas
(`docs/design_handoff_plantillas_webbot/PLAN-SLICES.md`). Un ciclo cero entrega solo las
fundaciones compartidas —tokens estructurales, `Instrument Serif`, el clamp de contraste
del acento, los keyframes con `prefers-reduced-motion` y el único componente cliente que
envuelve el `<main>`— sin ninguna plantilla visible. Después va `LANDING`, y recién al
final `PROFESIONAL`.
**Por qué:** `LANDING` primero porque es el fallback de rubros desconocidos —el de más
tráfico— y porque necesita un solo campo nuevo (`destacados?`): valida el patrón completo
sobre la plantilla más segura, y si el patrón está mal se descubre en 400 líneas y no en
5.000. `PROFESIONAL` al final porque es el único que arrastra backend: valor nuevo en el
enum `Template`, migración de Prisma contra producción sin staging (D-17), y rubros nuevos
en `DemoChatService`, en el prompt de `ClaudeChatService` y en `rubroDefaults.ts`. Ese
último punto toca el chat, que es el camino de venta: un error ahí no rompe un sitio,
rompe la venta. Mezclarlo con el primer ciclo pondría riesgo de producción dentro de un
cambio de diseño.
**Consecuencia:** ningún ciclo de plantilla puede empezar antes de que el ciclo cero esté
cerrado. Los cinco de plantilla son independientes entre sí y pueden reordenarse por
prioridad comercial, salvo `PROFESIONAL`. La copia de `BITACORA.md` que venía en el
paquete se eliminó al entrar al repositorio por ser idéntica a `docs/BITACORA.md` (D-19):
dos copias divergen apenas alguien toca una. El `.dc.html` se conserva como referencia de
diseño, no como código a copiar.
**Evidencia:** `docs/design_handoff_plantillas_webbot/README.md` y `PLAN-SLICES.md`;
tamaño actual medido con `wc -l` sobre `src/components/templates/*/`;
`src/domain/value-objects/Template.ts` y `schema.prisma:84-90` (5 valores, sin
`PROFESIONAL`); `src/infrastructure/templates/rubroTemplates.ts` (10 rubros).

## D-24 — Fundaciones de plantillas (S0a): un solo atributo enciende la animación, el hamburguesa se difiere de entrada

**Fecha:** 2026-09-12 · **Estado:** vigente
**Contexto:** el ciclo S0 de D-23 se partió en S0a (tokens, motion, envoltorio SPA) y S0b
(clamp de contraste del acento) porque el S0 original, con el clamp incluido, no cabía en
el presupuesto de 400 líneas por revisión. S0a entrega las piezas que las 6 plantillas
futuras van a compartir, sin ninguna plantilla visible todavía.
**Decisión:** tres reglas de nombrado y contrato, fijadas ahora para que S1-S6 no
improvisen cada una la suya:
1. **Tokens estructurales con prefijo `--wb-tpl-*`** (`src/styles/tokens.css`) — distinto
   de `--wb-color-*` (marca Devalpo) y de `--primario/--secundario/--acento/--texto`
   (inyectados por sitio en `palette.ts`). Los tres conjuntos conviven sin colisión porque
   ninguno comparte prefijo.
2. **`data-dv-anim` es el único selector que enciende una animación** (`src/styles/motion.css`,
   nunca `globals.css`). Un elemento sin ese atributo no anima, sea cual sea su CSS Module —
   la auditoría en review es un solo grep. El guard de `prefers-reduced-motion: reduce` usa
   `!important` a propósito: el estado oculto de cascada pesa (0,3,0) de especificidad y un
   guard sin `!important` a (0,1,0) perdería esa pulseada.
3. **El hamburguesa `<768px` se difiere a S1 desde el arranque de `tasks.md`, no como
   contingencia.** S0a entrega el nav móvil como fila horizontal con scroll
   (`overflow-x:auto`) en `SeccionesSPA.tsx` — un estado móvil legítimo, no uno roto.
**Por qué:** fijar el contrato de animación en un solo componente cliente
(`SeccionesSPA.tsx`) permite que las 4 secciones de cada plantilla se rendericen siempre
—nunca se desmontan, solo se ocultan por CSS— porque un sitio vendido como "tu sitio, en
Google" no puede tener 3 de 4 secciones ausentes del HTML. Diferir el hamburguesa evitó
que la estimación de S0a se fuera de 385 a más de 400 líneas sin sacrificar cobertura de
tests ni comentarios para lograrlo.
**Consecuencia:** `shared/fuentes.ts` (Instrument Serif) queda sin ningún importador hasta
S1 — los templates editoriales (LANDING, RESTAURANTE, PROFESIONAL) son quienes lo importan,
deliberadamente no el layout raíz, porque ese layout también sirve la landing comercial,
`/chat` y `/admin`. El comportamiento interactivo del envoltorio (cambio de sección,
`IntersectionObserver`) queda sin test automatizado en S0a: `jest.config.ts` corre con
`testEnvironment: 'node'`, sin jsdom, y esta cadena no lo agrega — la cobertura llega con
Playwright en S1, cuando exista una plantilla real para ejercitar.
**Evidencia:** `src/styles/tokens.css`, `src/styles/motion.css`,
`src/components/templates/shared/{navegacion.ts,SeccionesSPA.tsx,SeccionesSPA.module.css,fuentes.ts}`;
`tests/unit/components/templates/shared/navegacion.test.ts`.

## D-25 — El clamp de contraste (S0b) es búsqueda binaria con guarda, no un corte fijo de luminosidad

**Fecha:** 2026-09-12 · **Estado:** vigente
**Contexto:** el acento de cada sitio sale de `configJson.colores.acento` — dato de cliente
sin ninguna validación. Ese color pinta botones, enlaces, subrayados, números e íconos
sobre blanco en cuatro plantillas y sobre fondo oscuro en dos (`#171310` RESTAURANTE,
`#080056` PORTFOLIO). Un amarillo pálido desaparece sobre blanco; un azul marino
desaparece sobre oscuro. El handoff de diseño mandaba "subir la L de OKLCH hasta ~0.65".
**Decisión:** cuatro reglas, todas contra lo que pedía el handoff:
1. **Búsqueda binaria acotada sobre L, no un corte fijo.** Cada iteración convierte a sRGB
   real, mapea gamut, cuantiza a hex y mide el contraste WCAG de ESE hex, nunca de los
   números OKLCH (`contraste.ts:190-218`).
2. **Una sola linealización sRGB↔lineal con umbral `0.04045`**, compartida por la
   conversión OKLCH y por la luminancia WCAG (`contraste.ts:22-34`).
3. **El objetivo es un parámetro con default 3, no 4.5 quemado** (`contraste.ts:19-20`).
4. **Guarda de convergencia con fallback documentado**: si ninguna dirección alcanza el
   objetivo, devuelve negro o blanco —el que más contraste dé contra ese fondo— en vez de
   un color que falla en silencio (`contraste.ts:245-253`).
**Por qué:** no existe forma cerrada. La L de OKLCH **no** predice el contraste WCAG: croma
y tono desplazan la mezcla de canales RGB lineales por su cuenta, así que dos colores con
la misma L pueden dar contrastes distintos contra el mismo fondo. El corte de 0.65 que
circula está afinado para APCA, no para WCAG. Sobre el umbral: WCAG publica `0.03928` para
la misma curva que sRGB define en `0.04045` —inconsistencia conocida de su texto—, y
mezclar los dos en un mismo módulo produce números que no coinciden con ninguna de las dos
especificaciones. Sobre el 3:1: WCAG 2.1 SC 1.4.3 exige 4.5:1 solo para texto normal;
íconos, botones y bordes caen bajo SC 1.4.11, que exige 3:1 — pedir 4.5:1 para todo
oscurece el acento más de lo necesario y le come la identidad al color del cliente. Y la
guarda existe porque **nadie demostró que el contraste WCAG sea monótono respecto de la L
de OKLCH a croma y tono fijos**, que es justo la propiedad que garantizaría que la
bisección converge en vez de oscilar: no se le cree a la búsqueda, se remide el resultado.
**Consecuencia:** `contraste.ts` queda sin ningún importador hasta S1, igual que
`fuentes.ts` en S0a (D-24) — el fondo contra el que hay que clampear lo conoce cada
plantilla, así que el cableado pertenece a S1-S6 y no acá. Además quedó corregido un error
del research: rotulaba la matriz `[0.8189330101 …]` como "lineal-sRGB→LMS" cuando en
realidad es **XYZ→LMS**. Usarla sobre RGB lineal le inventa croma 0.03 y tono 28.9° a todo
gris, y con eso el clamp deja de preservar el tono. Se usa el par directo de Ottosson, con
las constantes tomadas de un archivo verificable del propio repo.
**Evidencia:** `src/components/templates/shared/contraste.ts`;
`tests/unit/components/templates/shared/contraste.test.ts` (45 tests: round-trip exacto,
anclas de luminancia que aíslan un coeficiente cada una, y el objetivo remedido sobre el
color devuelto contra los tres fondos); research `sdd/plantillas-contraste/research`
(Engram #608); matrices en `node_modules/@img/colour/color.cjs:499-501` (`rgb.oklab`),
`:764` (`xyz.oklab`, la que el research confundía) y `:791-796` (la inversa);
`docs/design_handoff_plantillas_webbot/PLAN-SLICES.md:40-41,78`.

## D-26 — Pendiente: de dónde sale el color de acento de cada cliente

**Fecha:** 2026-09-12 · **Estado:** RESUELTA — reemplazada por [D-27](#d-27--el-acento-sale-del-estilo-que-el-cliente-ya-responde-derivado-en-oklch-del-acento-del-rubro)
**Contexto:** al preparar el rediseño se descubrió que el cliente nunca elige un color. La
pregunta 7 del chat le ofrece un estilo ("Moderno y minimalista / Cálido y cercano /
Colorido y llamativo"), la respuesta se parsea y se guarda en `SiteConfigDTO.estilo`, y
**ninguna plantilla la usa** — verificado por grep sobre `src/components/templates/`. Los
colores salen del rubro detectado (`colores: defaults.colores`), así que dos panaderías
reciben exactamente los mismos colores. El argumento de venta es "tu sitio", no "un sitio
de panadería".
**Decisión:** SIN TOMAR. Tres caminos planteados: (1) conectar el estilo que ya se
pregunta, de modo que "cálido" dé una paleta y "moderno" otra, usando la respuesta que hoy
se descarta y sin sumar preguntas; (2) preguntar el color directo, con una pregunta más o
una paleta para elegir; (3) dejarlo por rubro y ajustarlo a mano desde `/admin` tras la
venta, que es lo que de hecho ocurre hoy.
**Por qué hay que decidirlo antes de S1:** el diseño nuevo se construye alrededor de **un
solo color de acento por cliente** que pinta botones, subrayados, números e íconos — es lo
que hace que dos sitios se vean distintos. Si ese acento sigue saliendo del rubro, el
rediseño se apoya en algo que hoy no distingue a un cliente de otro. Se combina con el otro
cabo suelto del mismo rediseño: colapsa los cuatro colores de `configJson.colores` a uno,
dejando `primario`, `secundario` y `texto` sin uso.
**Consecuencia mientras siga pendiente:** S0a y S0b pueden avanzar y entregarse, porque
ninguno toca `palette.ts` ni el origen del color. S1 (LANDING) no debe arrancar sin esto
resuelto.
**Evidencia:** `src/infrastructure/demo/DemoChatService.ts:18,93,96`;
`src/infrastructure/claude/ClaudeChatService.ts:141,175,207`;
`src/infrastructure/demo/rubroDefaults.ts` (paletas por rubro); grep de `estilo` en
`src/components/templates/` sin resultados fuera de `estiloCascada`, que es otra cosa.

---

## D-27 — El acento sale del estilo que el cliente ya responde, derivado en OKLCH del acento del rubro

**Fecha:** 2026-09-13 · **Estado:** vigente
**Contexto:** resuelve la pregunta que [D-26](#d-26--pendiente-de-dónde-sale-el-color-de-acento-de-cada-cliente)
dejó abierta y que bloqueaba S1 del rediseño de plantillas (D-23). De los tres caminos
planteados ahí se eligió el primero: usar la respuesta de estilo que el chat ya pide y
que hasta hoy se descartaba, sin sumarle preguntas al cliente.
**Decisión:** el acento final de un sitio se deriva al **generarlo** (no al renderizarlo)
como `mapearAGamut(transformar(oklch(acento_del_rubro), estilo))`, con una tabla de
excepciones manuales `(rubro, estilo) → hex` que gana sobre la regla. Cada estilo aplica
una transformación distinta: `moderno` baja el croma a 0.55×; `calido` rota el tono un
40 % del arco hacia el ámbar (70°) y sube 0.04 de L; `colorido` pide 1.35× de croma y, si
no entra en sRGB, busca la luminosidad que maximiza el croma que sobrevive al mapeo.
**Por qué al generar y no al renderizar:** el acento queda persistido en `configJson`,
editable después desde `/admin`, y los sitios ya vendidos no mutan solos cuando la regla
cambie.
**Por qué una regla y no una tabla de 30 valores a mano:** un rubro nuevo hereda sus tres
variantes sin decisiones de color extra, y se apoya en la maquinaria OKLCH que D-25 ya
había pagado. La tabla de override cubre las combinaciones puntuales que la regla no
acierta, sin obligar a acertar las 30 por adelantado.
**Dos límites que la regla NO puede superar, medidos sobre las 30 combinaciones:**
1. **Un acento frío no se vuelve cálido.** Rotar hacia el ámbar por el arco corto cruza
   el verde (`#0891B2` → `#4ba37a`) y por el largo cae en lavanda (`#9e7ec2`). Cálido y
   frío son mitades opuestas del círculo. Por eso un tono a más de 90° del ámbar conserva
   su tono y solo se ablanda; si un rubro frío necesita un cálido real, va al override.
2. **Un acento ya en la cúspide del gamut no se puede hacer más vívido.** `#FF8C00` y
   `#FF4500` están en el máximo croma que sRGB permite para su tono: `colorido` los
   devuelve intactos. La garantía del estilo es negativa a propósito — *nunca menos
   saturado ni más claro que el base* — porque la versión anterior los "cambiaba"
   bajándoles la saturación, que es entregar un color peor disfrazado de opción.
**Consecuencia:** esto lleva de 10 variantes visuales a 30, **no a unicidad por cliente**.
Dos panaderías que respondan ambas "cálido" siguen recibiendo el mismo sitio. Se aceptó
como piso, no como techo. `SiteConfigDTO.estilo` deja de ser un campo muerto. Queda
desbloqueado S1 (LANDING).
**Evidencia:** `src/domain/color/acentoPorEstilo.ts` (regla y transformaciones);
`src/infrastructure/demo/rubroDefaults.ts` (`OVERRIDES_ACENTO`, `resolverColores`);
`src/infrastructure/demo/DemoChatService.ts` y
`src/infrastructure/claude/ClaudeChatService.ts` (punto de cableado);
`tests/unit/domain/color/acentoPorEstilo.test.ts`; commits `627c2b1`, `965e247`,
`0b6b101`, `2fa8d72`; Engram obs #612.

---

## D-28 — El rubro se deduce con evidencia local puntuada, y cuando no alcanza se pregunta

**Fecha:** 2026-09-13 · **Estado:** vigente
**Contexto:** el rubro decide el template, la paleta y las fotos: es el dato que más
define si el sitio "se ve como lo mío". Se deducía con `detectarRubro`, que recibía
**solo el nombre del negocio** y comparaba por subcadena, devolviendo el primer rubro de
la lista con una coincidencia y, si no había ninguna, `panaderia`. Medido sobre un corpus
de 20 casos escritos como escribe la gente real —sin tildes, con faltas, con
regionalismos chilenos— acertaba **5 de 20**: un taller mecánico llamado "Servicios
Integrales SpA" salía con colores de pan y template `RESTAURANTE`.
**Restricción que manda sobre el diseño:** clasificar con un LLM resolvería esto de
raíz, y el código ya existe (`ClaudeChatService` le pregunta el rubro a Claude leyendo
toda la conversación). Se descarta **por decisión de negocio, no técnica**: implica costo
variable por demo y el producto todavía no genera ingresos. Se reevalúa cuando los haya.
La demo pública —todo visitante sin plan activo, o sea todo prospecto— seguirá corriendo
con deducción local.
**Decisión:** cuatro piezas, todas locales y sin costo recurrente.
1. `detectarRubro` recibe **nombre + descripción + servicios**, que es donde el cliente
   sí dice a qué se dedica. Sube el acierto de 5/20 a 19/20 en el mismo corpus.
2. La comparación es **por palabra**, no por subcadena: un keyword de 6 caracteres o más
   se compara como prefijo (`veterinar` cubre sus derivados) y uno más corto como palabra
   entera con plural opcional. Sin esto, ampliar el texto analizado convertía colisiones
   raras en habituales: `pan` en "pantalones", `ropa` en "Europa", `corte` en "cortesía",
   `moda` en "modalidad". El límite de palabra usa lookarounds sobre propiedades Unicode
   porque `\b` de JavaScript es ASCII y se equivoca con tildes y con la ñ.
3. Gana el rubro con **más coincidencias**, no el primero declarado; los empates se
   rompen por orden de declaración y quedan expuestos al llamador. Antes, una veterinaria
   que ofrecía "peluquería canina" se clasificaba como peluquería porque ese rubro está
   declarado antes.
4. El texto y los keywords se **normalizan sin tildes** antes de comparar, porque el
   cliente escribe sin ellas. Efecto colateral aceptado y verificado: la ñ se pliega en n
   (`ñ` se descompone en `n` + tilde combinante y no hay forma de separar ambos casos con
   el mismo mecanismo). Se comprobó contra 30 palabras con ñ de uso corriente que no
   genera ni un falso positivo.
**El fallback deja de mentir.** Un rubro no reconocido ya no es `panaderia` sino `otro`,
con paleta neutra (slate/grafito) y fotos genéricas. El template ya estaba resuelto y
nunca se ejecutaba: `RUBRO_TEMPLATES` no tiene entrada para `otro`, así que
`TEMPLATE_FALLBACK` (`LANDING`) aplica solo. `ClaudeChatService` tenía la misma mentira en
`RUBRO_VISUAL_FALLBACK` y también se corrigió.
**Caso especial del acento de `otro`:** para un rubro conocido, [D-27](#d-27--el-acento-sale-del-estilo-que-el-cliente-ya-responde-derivado-en-oklch-del-acento-del-rubro)
transforma el acento **del rubro** porque ese acento es una identidad a preservar. `otro`
no la tiene, así que el estilo elegido por el cliente decide el acento directamente:
`moderno` `#556270`, `calido` `#b06a3b`, `colorido` `#0f8b8d`, los tres medidos por
encima de 3:1 contra blanco. Es la variante que D-27 descartó para rubros conocidos, y acá
es la correcta justamente porque no hay identidad que conservar. El módulo de dominio
`acentoPorEstilo.ts` no conoce `otro`: el caso vive en `resolverColores`, con el resto de
los datos por rubro.
**Cuando el matcher no alcanza, se pregunta.** Si el puntaje es 0 o hay empate entre
rubros distintos, el chat agrega **una novena pregunta** con las categorías en etiquetas
para cliente y una salida explícita de "ninguno de estos". Va al final y no en el medio
para no correr el destructuring posicional de `extraerDatos`, donde los primeros ocho
índices significan siempre lo mismo. Un único helper arma el guion y tanto
`procesarMensaje` como `conversacionCompleta` derivan de él, para que no puedan
desincronizarse. `ChatWidget` no conoce el largo de la conversación, así que el front no
cambia.
**Lo que se descartó:** comparación difusa por distancia de edición para cubrir faltas de
ortografía. A distancia 1, `pan` es también `pon`, `pin` y `can`, y `gato` es `gasto`: se
ganan pocos aciertos y se compra una clase entera de falsos positivos difíciles de
depurar. Con vocabulario amplio y normalización de tildes se cubren las faltas reales sin
ese costo.
**Consecuencia:** el vocabulario de `DETECCION_RUBRO` pasa a ser la palanca de mayor
rendimiento y es **data, no algoritmo** — ampliarlo no requiere tocar código. Quedan
detectadas como faltantes: `zapatos`, `zapatilla`, `queque`, `pasteler`, `barber`,
`manicure`, `lubricentro`, `vacuna`, `cemento`, `colación`, `once` y un tronco `odontolog`
que cubriría "odontológica"/"odontología"/"odontólogo" de una vez.
**Evidencia:** `src/infrastructure/demo/rubroDefaults.ts` (normalización, puntaje,
`RUBRO_OTRO`, `ACENTO_OTRO_POR_ESTILO`, `resolverColores`);
`src/infrastructure/demo/DemoChatService.ts` (`construirScript`, pregunta guiada);
`src/infrastructure/claude/ClaudeChatService.ts` (`RUBRO_VISUAL_FALLBACK`);
`src/infrastructure/templates/rubroTemplates.ts` (`TEMPLATE_FALLBACK`);
`tests/unit/infrastructure/demo/rubroDefaults.test.ts` y
`tests/unit/infrastructure/demo/DemoChatService.test.ts`; commits `e0b3021`, `5caae5c`,
`dfb3454`, `5ab9933`; verificado en vivo contra la Postgres local: un negocio que responde
"ninguno de estos" queda con `rubro=otro`, `template=LANDING` y acento `#0f8b8d`.

---

## D-29 — Las opciones del chat se renderizan parseando las viñetas del propio mensaje

**Fecha:** 2026-09-13 · **Estado:** vigente
**Contexto:** el chat demo hace dos preguntas de selección múltiple —el estilo visual y,
condicionalmente, el rubro ([D-28](#d-28--el-rubro-se-deduce-con-evidencia-local-puntuada-y-cuando-no-alcanza-se-pregunta))—
y el cliente tenía que **tipear** la respuesta. En una demo que es el argumento de venta,
cada carácter que hay que escribir es una chance de abandono.
**Decisión:** el widget detecta las opciones **parseando las líneas que empiezan con `• `**
del mensaje del asistente, las quita de la prosa y las renderiza como botones. Un click
envía la etiqueta **exacta y literal** como mensaje del chat. El campo de texto sigue
habilitado: es un atajo, no una restricción.
**Por qué parsear y no agregar un campo `opciones` a la respuesta de la API:** un campo
estructurado es lo correcto en hexagonal —la presentación no debería leer prosa— pero acá
se rompe contra la realidad de los dos servicios de chat. `ClaudeChatService` genera el
texto de sus preguntas con el modelo y nunca podría poblar ese campo de forma confiable,
así que habría botones solo en modo demo y tipeo a mano en el modo pagado: exactamente al
revés de lo que se busca. Ambos servicios ya usan el mismo formato de viñeta, así que un
solo parser sirve para los dos, y un mensaje sin viñetas simplemente no muestra botones y
se responde escribiendo, como siempre.
**Por qué el click envía y no selecciona:** un radio son dos acciones (elegir y enviar);
un botón que envía es una. El objetivo es que el cliente trabaje lo mínimo.
**Consecuencia — esto es lo que obliga:** el formato `• opción` deja de ser una convención
de redacción y pasa a ser **un contrato** entre el texto de las preguntas y el front.
Cambiar la viñeta por un guion, numerar las opciones o reformatear la lista **apaga los
botones sin romper ningún test de backend**. Y la etiqueta se envía literal porque el
backend busca esas palabras: `parseEstilo` matchea contra "cálid"/"cercano"/"colorido"/
"llamativo" y el matcher de rubro acepta las etiquetas amigables — renumerar u
"ordenar" las opciones rompe la deducción río abajo.
**Alcance:** cero cambios de backend. `src/app/chat/opciones.ts` (función pura),
`ChatWidget.tsx` y `page.module.css`.
**Evidencia:** `src/app/chat/opciones.ts` (`extraerOpciones`);
`src/app/chat/ChatWidget.tsx` (`BurbujaAsistente`);
`tests/unit/app/chat/opciones.test.ts` y
`tests/unit/app/chat/BurbujaAsistente.render.test.ts` — este último renderiza con
`renderToStaticMarkup` porque `jest.config.ts` corre en `testEnvironment: 'node'` y no hay
jsdom para probar clicks; commits `b3873f4`, `ee6cb66`. Verificado en navegador contra el
entorno local: las tres opciones de estilo se renderizan como botones y el click envía
"Cálido y cercano" con su tilde intacta.

---

## D-30 — El correo del lead se precarga en `/login` desde la cookie, nunca desde la URL

**Fecha:** 2026-09-13 · **Estado:** vigente
**Contexto:** un visitante terminaba la demo, dejaba nombre y correo en el `LeadForm`, hacía
clic en «Quiero mi sitio real →» y aterrizaba en `/login`, que le pedía **el mismo correo
otra vez** con un texto que no respondía a lo que había clickeado ("Ingresa tu email para
crear tu cuenta"). Clickeaba para comprar y la pantalla le hablaba de crear una cuenta.
**Precisión sobre el aterrizaje en `/login`:** no es un defecto nuevo. `resolverEnlacePago`
(`src/app/chat/hrefPago.ts`) devuelve `HREF_PAGO_FALLBACK` cuando
`NEXT_PUBLIC_MERCADOPAGO_LINK_URL` no está definida, y en local no lo está. Se verificó
que producción **sí** tiene el link real inlineado en el bundle (`https://mpago.la/...`),
así que ese camino no se recorre en producción.
**Decisión:** `/login` resuelve el correo **en el servidor**, siguiendo la cadena
cookie `webbot_session` → `Sesion.clienteId` → `Cliente.email`, y lo precarga en el campo,
editable. `HREF_PAGO_FALLBACK` pasa a `/login?desde=pago`, y con ese marcador el texto
responde a lo que la persona clickeó.
**Por qué no `?email=` en la URL, que era lo obvio:** un correo en la query string queda en
el historial del navegador, en los logs del servidor y en la cabecera `Referer` hacia
cualquier recurso externo de la página. El dato ya es alcanzable desde la cookie, así que
exponerlo no compra nada y sí agrega superficie. Un marcador de intención (`desde=pago`)
sí puede ir en la URL: no es dato personal.
**Degradación obligatoria:** cualquier eslabón ausente —sin cookie, sesión no encontrada,
sesión sin `clienteId` porque el lead todavía no se capturó, cliente no encontrado— o un
repositorio que falle, devuelve `''` y el campo arranca vacío, que es el comportamiento de
siempre. `resolverEmailPrefill` nunca propaga el error: sería absurdo romper la puerta de
entrada por una comodidad.
**Consecuencia estructural:** `/login/page.tsx` deja de ser un único componente cliente y
pasa a ser un componente de servidor que resuelve el dato más `LoginForm.tsx` con
`'use client'`, igual que `src/app/chat/` ya separa `ChatWidget`, `LeadForm` y `DemoCTA`.
El nombre de la cookie se extrajo a `src/app/chat/sessionCookie.ts` para que el servidor
pueda importarlo sin cruzar la frontera `'use client'`.
**Nota de idioma:** el texto dice "Hiciste clic", no "Diste clic". "Dar clic" es uso
mexicano y colombiano; los clientes de WebBot son negocios chilenos.
**Pendiente relacionado, deliberadamente fuera de este cambio:** hoy un link de pago
**ausente** cae a `/login` sin ninguna alarma, mientras que un link de *pruebas* levanta un
banner rojo (D-22). El caso más caro —el botón de compra convertido en un login— es el
único sin aviso. Se difirió a un cambio posterior por decisión del usuario, dado que
`NEXT_PUBLIC_*` se inlinea en tiempo de build y por lo tanto la variable no puede
"caerse" en runtime: el fallo requiere un build corrido sin la variable, y su reparación
exige recargarla **y reconstruir**.
**Evidencia:** `src/app/login/emailPrefill.ts` (`resolverEmailPrefill`, pura e inyectada);
`src/app/login/page.tsx` (componente de servidor); `src/app/login/LoginForm.tsx`;
`src/app/chat/sessionCookie.ts`; `src/app/chat/hrefPago.ts:10`;
`tests/unit/app/login/emailPrefill.test.ts` (6 casos, incluido el repositorio que lanza) y
`tests/unit/app/login/LoginForm.render.test.ts`; commits `a8a7770`, `666ad11`, `f9707f2`.
Verificado en navegador contra el entorno local: el correo del lead aparece precargado y el
texto nombra el botón que se clickeó.

---

## D-31 — Pendiente: qué pasa con `primario`, `secundario` y `texto` cuando el diseño colapsa a un solo acento

**Fecha:** 2026-09-13 · **Estado:** RESUELTA — reemplazada por [D-32](#d-32--primario-secundario-y-texto-se-derivan-del-acento-y-dejan-de-persistirse)
**Contexto:** `PLAN-SLICES.md` lo lista como uno de los riesgos del rediseño y sigue sin
resolverse. Hoy `src/components/templates/shared/palette.ts` inyecta **cuatro** variables
CSS por sitio (`--primario`, `--secundario`, `--acento`, `--texto`) desde
`configJson.colores`. El handoff de diseño se construye alrededor de **una sola**:
`--acento`. [D-27](#d-27--el-acento-sale-del-estilo-que-el-cliente-ya-responde-derivado-en-oklch-del-acento-del-rubro)
resolvió de dónde sale ese acento, pero no qué pasa con los otros tres.
**Decisión:** SIN TOMAR. Tres caminos, sin evaluar todavía:
(1) mantener las cuatro variables por compatibilidad y que las plantillas nuevas usen solo
`--acento`, dejando tres huérfanas vivas en cada `configJson`;
(2) migrar `configJson` de los sitios existentes a la forma nueva;
(3) derivar `primario`, `secundario` y `texto` del acento con la misma maquinaria OKLCH de
[D-25](#d-25--el-clamp-de-contraste-s0b-es-búsqueda-binaria-con-guarda-no-un-corte-fijo-de-luminosidad),
y dejar de persistirlos.
**Por qué hay que decidirlo antes de S1:** S1 (`LANDING`) es el primer ciclo que toca una
plantilla de verdad, así que es el primero que se topa con el contrato de paleta. Y el
riesgo no es estético: `PLAN-SLICES.md` advierte que el cambio **afecta cómo se ven los
sitios ya publicados**. Hay sitios servidos en producción cuyo `configJson` tiene los
cuatro colores; cualquiera de los tres caminos decide si esos sitios cambian de aspecto,
cuándo, y si hace falta tocar datos.
**Consecuencia mientras siga pendiente:** no bloquea nada de lo que está en producción —
las cinco plantillas actuales siguen leyendo las cuatro variables y nadie nota nada. Sí
bloquea S1, y con S1 los cinco ciclos de plantilla que dependen de él.
**Recomendación registrada:** por tocar datos de sitios ya vendidos y por tener ambigüedad
real entre tres caminos con consecuencias distintas, es el primer caso de esta serie donde
un ciclo SDD completo se justifica de verdad. D-27 y D-28 no lo necesitaron porque la
ambigüedad se resolvió conversando; acá hay estado persistido de por medio.
**Evidencia:** `src/components/templates/shared/palette.ts:10-20` (las cuatro variables);
`docs/design_handoff_plantillas_webbot/PLAN-SLICES.md`, tabla de riesgos, fila "Cambio del
contrato de paleta"; `src/application/dtos/SiteConfigDTO.ts` (`colores` con los cuatro
campos); sitios en producción servidos por `/sites/[subdominio]`.

---

## D-32 — Primario, secundario y texto se derivan del acento y dejan de persistirse

**Fecha:** 2026-09-19/20 · **Estado:** vigente — código completo en rama, **sin
desplegar**: vive en `feature/paleta-contrato-un-color` (encadenada sobre
`feature/paleta-derivada-del-acento`, ninguna de las dos mergeada); `develop` y `main`
siguen en `963a63e`, el mismo commit que dejó a D-31 pendiente.
**Contexto:** resuelve [D-31](#d-31--pendiente-qué-pasa-con-primario-secundario-y-texto-cuando-el-diseño-colapsa-a-un-solo-acento),
que bloqueaba S1 del rediseño de plantillas (D-23). Ruta ODD (organic), no un ciclo SDD:
Agustín la eligió el 2026-09-19 apartándose de la propia recomendación de D-31 ("primer
caso de esta serie donde un ciclo SDD completo se justifica de verdad"), porque el mapeo
de impacto (Engram obs #744) mostró que el camino elegido no toca datos.
**Decisión:** camino **(3)** de los tres que planteaba D-31 — derivar `primario`,
`secundario` y `texto` del acento con la maquinaria OKLCH de D-25, y dejar de escribirlos
en `configJson.colores`. Regla de derivación (`src/domain/color/paletaDerivada.ts`):
`primario` = acento a L 0.22 en OKLCH mapeado a gamut (cita literal del handoff,
`docs/design_handoff_plantillas_webbot/README.md:237`, generalizada a los seis rubros);
`secundario` = L 0.45 (decisión propia de este ciclo, sin precedente textual); `texto` =
blanco o negro, el que gane `razonContraste` contra `primario`, **garantizado** ≥4.5:1
(WCAG SC 1.4.3) — si ningún extremo lo alcanza a L 0.22, la L de `primario` se reajusta
con `clampAcento` hasta lograrlo.
**Por qué el camino (3) y no (1) o (2):** (1) — mantener las cuatro variables y que las
plantillas nuevas lean solo el acento — dejaba huérfanos vivos sin resolver el contrato de
paleta que pide el handoff. (2) — migrar `configJson` de los sitios existentes — no tenía
ningún mecanismo sobre el cual construirse: las tres migraciones de Prisma son solo DDL,
cero `UPDATE`s previos sobre `configJson` (Engram obs #744). El hallazgo que decidió: el
(3) **no exige migración de datos**, porque toda fila ya tiene `acento` —el único
insumo— y los otros tres simplemente dejan de leerse.
**Qué NO se hizo, deliberadamente:** no hay migración de datos ni cambio de schema
Prisma (fuera de alcance explícito, `odd/tasks/paleta-derivada-del-acento.md`); las filas
existentes conservan `primario`, `secundario` y `texto` en su `configJson` como campos
huérfanos e inertes — nadie los borra ni los reescribe. `resolverColores` y
`RUBRO_DEFAULTS`/`prisma/seed-demo.ts` (antes duplicados a mano con los cuatro colores por
rubro) quedan reducidos a un solo color, el acento (commit `625f8ab`).
**Consecuencia aceptada, todavía no materializada:** cuando esta rama llegue a producción,
**los sitios ya publicados cambian de aspecto** — sus `primario`/`secundario` guardados
dejan de leerse y se reemplazan por la derivación. Efecto medido: los 11 rubros de
`RUBRO_DEFAULTS` ya tenían `texto: '#ffffff'` (`rubroDefaults.ts` en `963a63e`, líneas
26-103) y la derivación también da blanco para todos — la variable más usada de las tres
(39 usos, Engram #744) **no cambia en ningún sitio publicado**; el cambio visual real
queda confinado a `--primario` y `--secundario`. Las cinco plantillas vivas siguen
emitiendo las cuatro variables CSS (64 apariciones de las tres derivadas bajo
`src/components/templates`, verificado por grep) — dejar de emitirlas las habría roto; ese
cableado se retira recién cuando el rediseño de plantillas reemplace esos templates.
**Deriva de tono conocida y aceptada, no corregida:** `mapearAGamut` recorta el croma de
forma distinta a L 0.22 que a L 0.45 según el tono, así que `primario` y `secundario` no
siempre comparten tono exacto. Medido sobre los 11 acentos reales: `dentista` (`#0891B2`)
deriva 1.2231° y `yoga` (`#f0c040`) 1.4089°; los otros nueve quedan bajo el umbral de 1°.
Se fija como cota superior por rubro en el test, no se persigue una corrección — commit
`93c9690`.
**Rama de código provablemente muerta, conservada a propósito:** la reparación de
contraste (`clampAcento` sobre `primario` cuando ni blanco ni negro llegan a 4.5:1) nunca
se dispara con un acento real, porque el punto de equilibrio WCAG entre blanco y negro es
~4.583:1 — por encima del objetivo de 4.5. Se mantiene y se prueba con un objetivo
explícito más exigente que el de producción, porque protege un cambio futuro de
`L_PRIMARIO` — commit `93c9690`.
**Conflicto resuelto en el handoff de diseño:** `docs/design_handoff_plantillas_webbot/README.md:31`
y `:80` dicen que el acento sale de `configJson.colores.primario`. Desactualizado: D-27 ya
había establecido que el acento por cliente es `colores.acento`, derivado del estilo en
OKLCH. Con D-31 resuelta por el camino (3), `acento` pasa a ser el único color persistido,
así que esas dos líneas del handoff quedan obsoletas por construcción y no se siguen.
Queda documentado para que nadie las use como referencia más adelante.
**El acento persistido sale siempre en forma canónica:** una cuarta revisión de
confiabilidad encontró (`R3-001`) que `derivarPaletaDesdeAcento` reenviaba el string de
entrada de `acento` tal cual, sin pasar por la misma conversión que ya usaban `primario` y
`secundario`. Un hex válido pero no canónico (`#FF8C00`, `#f80`) salía entonces con otra
convención de formato que los tres colores derivados — nada se veía mal (CSS no distingue
mayúsculas en hex ni formato corto/largo), pero la coherencia de formato que el módulo
declara para las cuatro variables era falsa. Corregido: `acento` ahora sale de
`linealAHex` igual que los otros tres, así que hace el mismo viaje de ida y vuelta
(hex → RGB lineal → hex) y las cuatro variables CSS comparten una sola convención
(minúsculas, seis dígitos) — commit `9e29f2f`.
**Revisión adversarial:** cuatro revisiones de confiabilidad (`review-reliability`)
corrieron sobre este código, quedaron aprobadas y con acuse de recibo; sus hallazgos
motivaron los commits `6a4c1bc` (seis hallazgos de las dos primeras revisiones), `93c9690`
(cuatro hallazgos de la tercera) y `9e29f2f` (dos hallazgos de la cuarta, `R3-001`
corregido en código) — detalle en los propios mensajes de commit. Una quinta revisión
encontró tres hallazgos más de endurecimiento de tests, sin cambios en `src/` — ver
`odd/tasks/paleta-derivada-del-acento.md`.
**Verificación (estado de la rama al cierre, no de producción):** `npm run test:unit` →
812 tests, 61 suites, 0 skipped; `npx tsc --noEmit` limpio; `npm run lint` → 0 errores, 21
warnings preexistentes y ajenos a este cambio (los mismos que en `963a63e`).
**Evidencia:** `src/domain/color/paletaDerivada.ts`;
`src/components/templates/shared/palette.ts`; `src/infrastructure/demo/rubroDefaults.ts`;
`prisma/seed-demo.ts`; commits `a4e8ad6`, `a3ab4fe`, `625f8ab`, `6a4c1bc`, `93c9690`,
`b92ab20`, `9e29f2f`, `fd7eb64` (ramas `feature/paleta-derivada-del-acento` y
`feature/paleta-contrato-un-color`); `odd/tasks/paleta-derivada-del-acento.md`; Engram obs
#744 (mapeo de impacto) y #745 (espejo del documento ODD).
