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
