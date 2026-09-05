# Bitácora de desarrollo — WebBot

> Registro de avance para retomar el trabajo. Se actualiza cada vez que cerramos una tarea o pausamos sesión.
> Roadmap completo: [`WEBBOT_ROADMAP.md`](./WEBBOT_ROADMAP.md)

---

## Estado general

**Última sesión:** 2026-09-05 — **Reposicionamiento del producto** (ver sección [Reposicionamiento: fábrica de sitios](#reposicionamiento-fábrica-de-sitios-2026-09-05) más abajo): WebBot deja de ser un SaaS de autoservicio por suscripción y pasa a ser la fábrica interna de Devalpo para vender "tu sitio web en 1 día con dominio propio, pago único". Alcance de código cerrado en 5 puntos; motor de pagos, N8N y WhatsApp quedan fuera. Seguimiento en Jira bajo el flujo de trabajo FASE 5. Sesión anterior (2026-08-25): — **Frente 1 (Resend) y Frente 2 (ClaudeChatService) mergeados a `main`**, vía un plan SDD (`phase2-rollout`) que secuenció los dos rollouts para no bundlearlos. `main` y `develop` quedaron sincronizados en `40f7bf6`. Ninguno de los dos está *funcionalmente* activo todavía — ambos dependen de una API key que sigue sin cargarse en Railway (`RESEND_API_KEY` y `ANTHROPIC_API_KEY` respectivamente, ambos pasos manuales de Agustín). Deploy verificado con `railway status` + logs de arranque limpios. Ver sección [Deploy a producción (2026-08-25)](#deploy-a-producción-2026-08-25--frente-1-resend-y-frente-2-claudechatservice-a-main) más abajo. Sesión anterior (2026-08-24): **Backend real de `ClaudeChatService`** (Tareas 2.2–2.4, vía SDD + TDD estricto) — reemplazado el stub por el adaptador real (`@anthropic-ai/sdk`), extracción de datos con fallback de parseo para los 10 rubros, rate limiter propio (20 msg/24h por cliente), `container.ts` con construcción perezosa (`getChatServiceReal()`) y `route.ts` con el wiring completo (503/429/502 según corresponda). 104 tests unitarios, 17 suites, todo verde — ver sección [ClaudeChatService: backend real de Claude](#claudechatservice-backend-real-de-claude-fase-2-tareas-22–24). Sesión previa (2026-08-14): **Deploy a producción de todo lo de Fase 2** (`develop` → `main`): Chat UI, auth por magic link, Demo Mode y landing pública en vivo en `web-bot-production-d190.up.railway.app`. **Hallazgo importante de esa sesión:** el SMTP de Gmail (465 y 587) está bloqueado en el egress de Railway — se migró el envío del magic link a **Resend** (API HTTP). Ver también [Auth: magic link](#auth-chat-limitado--cuenta-magic-link--pago-en-progreso-rama-feature-auth-login), [Demo Mode + landing + template de sitio](#demo-mode--landing-pública--template-de-sitio-rama-webot_demo) y [Deploy a producción + bloqueo de SMTP](#deploy-a-producción-2026-08-14--bloqueo-de-smtp-en-railway).
**Fase actual:** FASE 2 — Bot & IA (arrancada, parcial — ver checklist)
**Desarrollador:** Agustín (único dev del proyecto — el roadmap menciona 3 personas pero todo lo hace él)
**Seguimiento también en Jira:** proyecto **WB (Web-Bot)** en `devalpo-team.atlassian.net` — espejo del roadmap. Estaba desactualizado respecto a esta bitácora al empezar la sesión del 14/08 (varios tickets de Fase 2 seguían en "Tareas por hacer" ya terminados); si no se sincronizó todavía en esta sesión, hacerlo antes de dar por buena la vista de Jira.

```
FASE 1 — Fundaciones       [ ] 🟡 6/7 tareas (falta solo 1.4, bloqueada — ver abajo)
FASE 2 — Bot & IA           [ ] 🟡 arrancada — UI + auth, falta el backend del chat (2.2-2.4)
FASE 3 — Templates & Deploy [ ] 🔴 pendiente
FASE 4 — Lanzamiento        [ ] 🔴 pendiente
```

### Checklist Fase 2

```
[x] 2.1 — Chat UI funciona en /chat        con /api/chat real detrás (modo demo, sin Claude — ver Demo Mode)
[x] 2.2 — Bot hace 8 preguntas en orden correcto      código real listo (ClaudeChatService.procesarMensaje, tests con SDK fake); falta ANTHROPIC_API_KEY para probar en vivo
[x] 2.3 — Extracción JSON válida para 10 rubros       código real listo (parseSiteConfig + fallback fence/regex, describe.each 10 rubros); falta ANTHROPIC_API_KEY para probar en vivo
[x] 2.4 — API /api/chat guarda historial en BD        /api/chat con wiring completo (limiter, short-circuit de reintento, mapeo 429/502/503) — agente Claude ya no es stub
[ ] 2.5 — Workflow N8N orquesta el flujo completo
[ ] 2.6 — Tests con 10 rubros documentados            hecho a nivel unitario (describe.each con fixtures simuladas); falta con Claude real
[ ] 2.7 — WhatsApp (opcional)
[+] extra no listada en el roadmap — Auth por magic link (código en producción, envío de email pendiente Resend), Demo Mode + landing + template de sitio (en producción desde 2026-08-14). Ver detalle abajo.
```

### Checklist Fase 1

```
[x] 1.1 — 3 servicios Railway en verde
[x] 1.2 — *.sitios.devalpo.cl con HTTPS funcionando
[x] 1.3 — Todas las tablas en PostgreSQL creadas
[ ] 1.4 — Webhook de pago activa/pausa cliente en BD   ← ÚNICA PENDIENTE, ver sección propia más abajo
[x] 1.5 — Middleware sirve rutas por subdominio
[x] 1.6 — Todos los secrets cargados en Railway (adaptado, ver detalle)
[x] 1.7 — CI/CD auto-deploy funcionando
```

---

## Repositorio

- **Repo:** https://github.com/agustindevalpo/web-bot.git
- **Ramas:** `main` (Railway auto-deploya solo desde acá) y `develop` (integración). Convención: `feature/tarea-x` → merge a `develop` → merge a `main` cuando el trabajo está listo para producción. Como no hay ambiente de staging, mergear a `main` = deploy real.
- Commits hechos esta sesión:
  1. Initial commit: README + roadmap
  2. Scaffold Next.js (App Router, TypeScript)
  3. Prisma schema + migración inicial

---

## Tarea 1.1 — Railway: proyecto y servicios ✅

- Proyecto Railway: nombre interno **`refreshing-communication`** (Railway lo auto-nombró así aunque el servicio principal se llama `web-bot`).
- Servicios creados:
  - **web-bot** (Next.js) — conectado al repo GitHub, rama `main`. URL pública: `web-bot-production-d190.up.railway.app`
  - **Postgres** — provisionado por Railway.
  - **Python** (FastAPI) — servicio vacío, todavía sin código. Se completa en la Tarea 3.2.
- Verificado con `curl` → 200 OK.

## Tarea 1.2 — Wildcard DNS + SSL ✅

- `devalpo.cl` está registrado en **NIC.cl**, pero los nameservers apuntan a **Bluehost** → la zona DNS real se edita en el **Zone Editor de cPanel de Bluehost**, no en NIC.cl. (Importante: NIC.cl solo es el registrador.)
- El roadmap original decía "agregar un registro A con la IP" — **eso está mal**, Railway no expone IPs estáticas por servicio. Se usó **CNAME**.
- Registros DNS cargados en Bluehost Zone Editor:

  | Tipo | Name | Value |
  |------|------|-------|
  | CNAME | `*.sitios` | `vt31z6no.up.railway.app` |
  | CNAME | `_acme-challenge.sitios` | `vt31z6no.authorize.railwaydns.net` |
  | TXT | `_railway-verify.sitios` | `railway-verify=5f4433d35d16959d2c914eb32680f42641c7e0ded5984237fbdd19dbbdcdea94` |

- Verificado: `https://test.sitios.devalpo.cl` responde 200 OK con SSL válido.

## Tarea 1.3 — Esquema PostgreSQL con Prisma ✅

- Se instaló Prisma (**v7.9.1** — más nueva que la asumida en el roadmap).
- Schema en `prisma/schema.prisma` con los 4 modelos del roadmap: `Cliente`, `Sitio`, `Pago`, `Sesion` (+ enums `Plan`, `Template`, `EstadoPago`, `Proveedor`).
- Migración `20260808162959_init` aplicada y verificada (las 4 tablas existen y son consultables sin error).
- **⚠️ Cambio importante respecto al roadmap:** Prisma 7 exige un *driver adapter*, no alcanza con `new PrismaClient()`. Ya están instalados `@prisma/adapter-pg` y `pg`. Cualquier código que instancie Prisma (`lib/db.ts`, el webhook de pagos de la Tarea 1.4, etc.) debe hacerlo así:

  ```ts
  import { PrismaClient } from '@prisma/client'
  import { PrismaPg } from '@prisma/adapter-pg'
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  export const prisma = new PrismaClient({ adapter })
  ```

### Conexión a la base de datos — cómo quedó resuelto

Se intentó el método recomendado por Railway (túnel SSH sin exponer la BD: `railway connect Postgres --tunnel-only`) y **no funcionó en esta máquina Windows**:
- El `ssh-agent` de Git Bash usa un socket Unix que el binario nativo `railway.exe` no puede leer.
- El servicio `ssh-agent` nativo de Windows está deshabilitado y activarlo pide permisos de administrador que no tenemos.

**Solución aplicada:** se activó **Public Access** en el servicio Postgres de Railway (Settings → Networking → Add Public Access, **y hay que clickear el botón "Deploy" para que el cambio de red se aplique** — no es automático, esto también costó tiempo).

- Host público actual: `sakura.proxy.rlwy.net:21654`
- `DATABASE_URL` en `.env` (local, gitignored) apunta a esta URL pública.
- Se deja **activo a propósito** (no solo para la migración puntual) porque `npm run dev` local también la va a necesitar.
- Tip para el futuro: usar `railway variables` (CLI, ya logueada y linkeada al proyecto) para ver valores reales de variables — es mucho más confiable que mirar la UI del dashboard, que varias veces mostró templates sin resolver (`${{PGUSER}}`, etc.) o cambios sin deployar.

## Tarea 1.5 — Middleware multitenant Next.js ✅

- `proxy.ts` en la raíz (Next.js 16 renombró la convención `middleware.ts` → `proxy.ts`; se migró a mano, la función exportada ahora se llama `proxy` en vez de `middleware`). Reescribe `*.sitios.devalpo.cl` → `/sites/[subdominio]`. Los hosts `localhost`, `webbot.devalpo.cl` (app principal, todavía no existe) y `*.up.railway.app` (dominio autogenerado de Railway) pasan directo sin rewrite.
- `app/sites/[subdominio]/page.tsx`: busca el `Sitio` en Postgres por `subdominio`, `notFound()` si no existe o no está activo. El render real de templates es un stub (placeholder) hasta la Tarea 3.1.
- `lib/db.ts`: cliente Prisma compartido (singleton, patrón estándar de Next.js) usando el driver adapter `PrismaPg` que exige Prisma 7.
- **Bug de deploy encontrado y arreglado:** el build en Railway fallaba (`Module '"@prisma/client"' has no exported member 'PrismaClient'`) porque el paso de generación del cliente Prisma no corría en un entorno de build limpio. Se agregó `"postinstall": "prisma generate"` a `package.json` — sin esto, cualquier deploy futuro con cambios de schema va a fallar en Railway aunque funcione local.
- Se configuró `DATABASE_URL` en el servicio `web-bot` de Railway apuntando a la **URL interna** de Postgres vía referencia de variable (`${{Postgres.DATABASE_URL}}`), no a la pública — en producción ambos servicios están en la misma red privada de Railway, no hace falta exponer la BD.
- Verificado en producción: `test.sitios.devalpo.cl` renderiza el sitio de prueba desde la BD; `noexiste.sitios.devalpo.cl` devuelve 404.

## Tarea 1.6 — Variables de entorno y secrets ✅ (adaptada)

- `.env.example` creado en el repo con todos los nombres de variables que anticipa el roadmap (sin valores).
- `DATABASE_URL` y `NEXT_PUBLIC_BASE_DOMAIN` ya están cargadas en Railway (servicio `web-bot`).
- **Decisión:** no se cargó ninguna key real todavía (Anthropic, Flow, Mercado Pago, PayPal, Unsplash, N8N) porque hoy no hay código que las consuma — se van a pedir y cargar recién en la tarea que las necesite (Fase 2 en adelante), para no acumular placeholders vacíos sin uso.
- **Decisión:** el paso del roadmap de "crear documento en Notion con dónde encontrar cada key" se reemplaza por esta bitácora — no tiene sentido un doc de equipo para un desarrollador solo (ver `project-webbot-solo-dev` en memoria).
- Done cumplido: Next.js sigue levantando en Railway sin errores de variables faltantes.

## Tarea 1.7 — CI/CD básico ✅

- Se creó la rama `develop` a partir de `main`.
- Se probó en vivo el flujo `feature/tarea-1-7-cicd → develop → main` (esta misma tarea se hizo así, como ejemplo de la convención a futuro).
- `.railwayignore` agregado (excluye `docs/`, `*.md`, `.git`, `node_modules`, `.next`, `.env*` del contexto de build).
- Verificado: push a `main` disparó un deploy que terminó exitoso (`railway deployment list` lo confirma), bien por debajo de los 2 minutos que pide el Done. Sitio de prueba respondiendo 200 después del deploy.

**Fase 1 queda 7/7 salvo la 1.4, que sigue bloqueada** (motor de pagos sin deployar — ver sección propia).

---

## Tarea 2.1 — Chat UI en Next.js (parcial ✅ UI, ❌ backend)

Mergeado a `main` (`c5fef42` / `3195e30`).

- `/chat` (público, sin login): `ChatWidget` con historial de mensajes, input, estado "escribiendo...", y un tope de **3 intercambios** (`MAX_INTERCAMBIOS_DEMO`) solo de UI — al llegar al límite muestra un CTA "Crear cuenta" que linkea a `/login`.
- El widget ya llama a `POST /api/chat`, pero **ese endpoint todavía no existe** (Tareas 2.2/2.3/2.4, agente Claude de onboarding — sigue como stub en `ClaudeChatService`). Hoy cualquier mensaje enviado muestra el error "El backend del chat todavía no está implementado".
- El tope de 3 intercambios tampoco se puede hacer cumplir en servidor todavía, porque no hay servidor — es puramente cosmético hasta que exista `/api/chat`.

**Por qué se dio por "Tarea 2.1 lista" sin backend:** el objetivo de esta sesión era destrabar el flujo de negocio completo (demo → cuenta → pago) antes de meterse con el agente Claude, que es la pieza más grande de Fase 2. La UI del chat quedó reutilizada tal cual en `/onboarding` (mismo componente, con `clienteId` ya logueado) para no duplicar código cuando el backend exista.

---

## Auth: chat limitado → cuenta (magic link) → pago (en progreso, rama `feature/auth-login`)

**Fecha:** 2026-08-12. Commit inicial `cc0e5c7` en `main`, desarrollo posterior sigue en la rama `feature/auth-login` (sin mergear). No es una tarea numerada del roadmap original — es una pieza de negocio que se decidió construir antes de 2.2, para no llegar al agente Claude sin manera de convertir el uso de la demo en cuenta y eventualmente en pago.

**Qué hay, siguiendo Clean Architecture:**

- **Dominio:** entidad `TokenAcceso` (hash SHA-256 del token, expira a los 15 min, de un solo uso) + excepción `TokenAccesoInvalidoException`.
- **Aplicación:** use cases `SolicitarAcceso` (genera token, lo guarda, dispara el email) y `VerificarAcceso` (valida el token, crea el `Cliente` si es la primera vez — usando la parte local del email como nombre placeholder, no hay flujo de perfil todavía), ambos con tests unitarios.
- **Infraestructura:** `PrismaTokenAccesoRepository`; `JwtSessionService` (JWT firmado con `jose`, HS256, cookie httpOnly de 30 días); rate limiting en memoria (`rateLimit.ts` — 10 intentos/hora por IP, 3/15min por email; aceptable para el deploy actual de una sola instancia, no sobrevive un restart ni escala a más de una instancia).
- **Presentación:** `/login` (pide email, siempre responde éxito genérico para no filtrar si el email ya tenía cuenta), `POST /api/auth/solicitar-acceso`, `GET /api/auth/verificar` (valida y redirige a `/onboarding` con la cookie puesta), `POST /api/auth/logout`, y `/onboarding` (server component que valida la cookie y si no hay sesión redirige a `/login`).
- Migración Prisma `20260812045232_add_token_acceso` aplicada.

**Envío del magic link — decisión de proveedor (se apartó de lo que anticipaba `.env.example`):**

| Tema | Se había anticipado | Se hizo | Por qué |
|------|---------------------|---------|---------|
| Proveedor de email | Resend (`RESEND_API_KEY`) | **Gmail Workspace SMTP** (`GMAIL_USER=team@devalpo.cl` + `GMAIL_APP_PASSWORD`, vía `nodemailer`) | Agustín ya tiene Workspace con dominio propio aprobado — evita dar de alta un proveedor nuevo y verificar dominio de nuevo en DNS cuando Gmail ya manda con la reputación del dominio `devalpo.cl`. |

- Nuevo `GmailSmtpEmailService` (`src/infrastructure/email/GmailSmtpEmailService.ts`): manda por `smtp.gmail.com:465` autenticado con contraseña de aplicación (no la contraseña normal — requiere verificación en 2 pasos activada en `team@devalpo.cl`).
- `DevEmailService` se mantiene como fallback: si `GMAIL_USER`/`GMAIL_APP_PASSWORD` no están cargadas, loguea el link a consola en dev y lanza error explícito en producción (en vez de fallar en silencio). `container.ts` elige automáticamente cuál usar según si esas dos variables están seteadas.
- ✅ **Envío real verificado en vivo (2026-08-12):** Agustín activó verificación en 2 pasos en `team@devalpo.cl`, generó la contraseña de aplicación en `myaccount.google.com` y la cargó en `.env` local (`GMAIL_USER`/`GMAIL_APP_PASSWORD`). Con `npm run dev` corriendo, se disparó `POST /api/auth/solicitar-acceso` con `email=team@devalpo.cl` — la API respondió `200` y **el correo llegó de verdad** a la bandeja de `team@devalpo.cl`, confirmado por Agustín. `GmailSmtpEmailService` queda probado de punta a punta, ya no es solo teoría.
- **Corrección de copy:** el template del email (y varios textos de `/login`, `/chat` y el mensaje de rate-limit) tenían voseo argentino ("Hacé click", "Ingresá tu email", "Probá de nuevo"). Agustín es chileno — se corrigió todo a español neutro ("Haz clic", "Ingresa tu email", "Inténtalo de nuevo").

**Verificación corrida:** `npx tsc --noEmit`, `npm run lint` (0 errores, mismos warnings preexistentes de los stubs de Fase 2/3) y `npm run test:unit` (11 suites / 37 tests) limpios, más el envío real confirmado arriba. No hay tests e2e nuevos para este flujo — el único e2e real sigue siendo el de sitio-por-subdominio (Tarea 1.5).

**Qué falta para considerar esto realmente cerrado:**
1. Cargar `GMAIL_USER`/`GMAIL_APP_PASSWORD` también en Railway (servicio `web-bot`) para que el envío real funcione en producción, no solo en local.
2. La parte de "pago" del flujo (mencionada en el mensaje del commit `cc0e5c7`) **no está implementada** — sigue bloqueada por la Tarea 1.4 (motor de pagos sin deployar).
3. `/api/chat` real (Tareas 2.2–2.4) — sin esto, tanto el chat demo como el `/onboarding` logueado no hacen nada más que mostrar el error de "backend no implementado".
4. Mergear `feature/auth-login` a `develop`/`main` cuando lo anterior esté resuelto (o decidir mergear solo la parte de auth y dejar pago documentado como pendiente, como se hizo con los stubs de Fase 2/3 en la migración a Clean Architecture).

---

## Demo Mode + landing pública + template de sitio (rama `webot_demo`)

**Fecha:** 2026-08-12/13. Rama `webot_demo`, creada desde `develop` (con `feature/auth-login` ya mergeado). Implementa `docs/WEBBOT_DEMO_MODE.md` — spec que Agustín dejó en `docs/` para separar el chat en modo demo (sin tokens de Claude) vs modo real (Claude, solo clientes con plan pagado). Esa spec y el HTML de referencia de la landing (`docs/WebBot Landing (standalone).html`) **se quedaron fuera del commit a propósito** — eran material de trabajo, no documentación del proyecto.

### Qué hay

- **`DemoChatService`** (`src/infrastructure/demo/`): guion fijo de 7 preguntas (+ la del nombre, que ya cubre el saludo estático del frontend — ver bug corregido abajo), $0 en tokens.
- **`rubroDefaults.ts`**: detecta el rubro por palabras clave en el nombre del negocio, pero **solo para elegir el "kit visual" por defecto** (template SERVICIOS/RESTAURANTE/TIENDA, paleta de colores, 2 fotos stock de Unsplash). El resto del contenido del sitio (nombre, descripción, servicios, ciudad, contacto, redes, estilo, highlight) sale del **parseo de las respuestas reales del chat** — split de texto y regex simples (email, @handle), sin IA.
  - **Esto fue un cambio de diseño pedido a mitad de sesión.** La spec original decía que el modo demo siempre muestra uno de 10 sitios prefabricados con datos de ejemplo, ignorando lo que el usuario escribe salvo el nombre (para detectar el rubro). Agustín lo corrigió: el valor del producto es que el demo se sienta "hecho para vos", no un ejemplo genérico ajeno — así que ahora se genera un sitio real con el contenido real de la conversación.
- **`/api/chat`** (nuevo): decide demo vs real por JWT + `cliente.activo`; en demo, al completar las 8 respuestas, **persiste un `Sitio` real en la BD** (dueño: `cliente-demo-webbot-devalpo`, no factura) con `subdominio = demo-{primeros 8 caracteres del sessionId}` — determinístico, no hace falta guardarlo en ningún otro lado para recuperarlo.
- **`/sites/[subdominio]`**: dejó de ser un stub (`<h1>subdominio</h1><p>Template: X</p>`) — ahora es un template real de una sola página (hero, highlight, servicios/menú/productos según el `template` del sitio, galería, footer), con **colores dinámicos por sitio** vía CSS custom properties (`--primario`, `--secundario`, `--acento`, `--texto` desde `configJson.colores`).
- **`/` (landing pública)**: reemplaza el scaffold de `create-next-app` que seguía ahí desde el inicio del proyecto. Portada 1:1 desde el HTML que Agustín dejó en `docs/` — que resultó ser un *artifact empaquetado* (recursos comprimidos gzip+base64 embebidos, no HTML plano); se decodificó el bundle directamente para sacar el copy, CSS y el logo real de Devalpo (`public/devalpo-logo.png`) en vez de reconstruir a ojo desde capturas. Fuentes reales (Fredoka + Montserrat) vía `next/font/google`. Todos los CTA apuntan a `/chat`.
- Rate limiting de demo (2 por IP/día) **se salta fuera de producción** (`NODE_ENV !== 'production'`) — si no, cualquiera se bloquea a sí mismo probando en local.
- `DemoCTA` arma el link de preview con `NEXT_PUBLIC_APP_URL` cuando es local (`localhost:3000/sites/...`) en vez de siempre apuntar al subdominio real de producción — si no, el iframe/link en dev muestra lo último deployado en `main`, no lo que se está probando.
- Precios de `DemoCTA` sincronizados con los de la landing: Presencia $29.990, Presencia Pro $49.990 (Popular), Agencia $149.990, Landing única $249.000 — antes tenía placeholders distintos (Starter/Pro/Agencia).

### Bugs reales encontrados y corregidos (no solo del roadmap, del propio código)

- **Pregunta duplicada:** `ChatWidget` ya muestra "¿Cómo se llama tu negocio?" como saludo estático antes de la primera llamada a la API; `DemoChatService` volvía a preguntarlo. Se sacó del guion del backend (ahora empieza en "¿A qué se dedica?").
- **Rate limiter de la spec original contaba por mensaje, no por conversación** — con 8 mensajes por demo, habría bloqueado al segundo intercambio. Se corrigió para contar solo al *iniciar* una sesión nueva.
- **Bug en el propio test unitario de la spec** — el fixture de "avanza al orden correcto de preguntas" no era alcanzable con ninguna fórmula de indexación consistente (verificado trazando las 8 rondas a mano). Corregido.
- **Assets estáticos rotos por el middleware multitenant:** el logo de la landing devolvía 404 — el fetch interno de `next/image` para imágenes locales llega con header `Host` vacío, y `proxy.ts` lo trataba como un dominio custom desconocido, reescribiéndolo mal. Se corrigió el `matcher` para excluir archivos estáticos por extensión (patrón recomendado por Next.js, no un parche puntual).
- **Voseo argentino** en el copy nuevo (misma corrección que ya se había hecho en auth, ver arriba) — Agustín es chileno.

### Verificación

`npx tsc --noEmit`, `npm run lint` (0 errores, mismos warnings preexistentes), `npm run build` y `npm run test:unit` (13 suites / 58 tests) limpios. Probado en vivo en el navegador de punta a punta varias veces: demo completa de 8 preguntas → sitio generado con paleta/fotos del rubro y contenido real → link de preview funcionando en local. Un intento de prueba vía clicks automatizados perdió un mensaje por timing (input todavía deshabilitado) — no era un bug del producto, se confirmó repitiendo la conversación por API directa.

### Qué falta / pendiente

1. **Deployar esta rama** — `main` sigue con el stub viejo de `/sites/[subdominio]` y el `globals.css` con auto dark-mode (ver el bug de "pantalla negra" que Agustín encontró probando `demo-veterinaria.sitios.devalpo.cl` en producción, ya arreglado acá pero no deployado).
2. **Confirmar `NEXT_PUBLIC_APP_URL` en Railway** apuntando a la URL real de producción — la usa tanto el magic link (`container.ts`) como ahora la detección local/producción de `DemoCTA`. `NEXT_PUBLIC_*` se hornea en build time, así que un cambio ahí pide redeploy, no alcanza con reiniciar el servicio.
3. **Sin límite de plan real** — el "rate limiting por cliente en modo real" (`sitiosGenerados`) que menciona la spec como protección adicional no se implementó; no estaba en los 6 pasos obligatorios del documento.
4. Una foto del seed original (`prisma/seed-demo.ts`, galería de `demo-panaderia`) no corresponde al rubro (viene tal cual del documento de Agustín) — pendiente de decidir si se cambia.
5. Los sitios demo generados (`demo-{sessionId}`) se acumulan en la tabla `Sitio` sin límite ni expiración — no hay barrido/TTL todavía.
6. Sigue sin existir `/api/chat` real con Claude (Tareas 2.2–2.4) — el modo "real" del `/api/chat` ya está armado y a la espera, pero `ClaudeChatService` sigue siendo un stub que tira error.

---

## Deploy a producción (2026-08-14) + bloqueo de SMTP en Railway

**Contexto:** hasta esta sesión, `main` (la rama que deploya Railway) seguía parada en el commit de la migración a Clean Architecture — nada de Fase 2 (Chat UI, auth, Demo Mode, landing) estaba en producción, a pesar de estar mergeado y probado en `develop` desde el 13/08.

### Qué se hizo

1. **Variables cargadas en Railway** (servicio `web-bot`, no estaban): `AUTH_SECRET` (mismo valor que local — sin esto, `JwtSessionService` tira error y el login no funciona), `NEXT_PUBLIC_APP_URL=https://web-bot-production-d190.up.railway.app` (antes apuntaba a `localhost:3000` heredado del `.env` local; afecta el link del magic link y el preview del Demo Mode).
2. **Merge `develop` → `main` y push** — disparó el deploy real. Verificado con `curl`: landing (`/`), `/login`, `/chat` y un sitio demo por subdominio (`demo-veterinaria.sitios.devalpo.cl`) responden 200 en producción.
3. **`/api/auth/solicitar-acceso` devolvía 500 en producción** — investigado con `railway logs` (error `ETIMEDOUT` conectando a `smtp.gmail.com`).

### El hallazgo real: Railway bloquea SMTP saliente hacia Gmail (465 y 587)

Se probaron dos hipótesis, ambas con evidencia concreta vía `railway logs --network`:

1. **Hipótesis IPv6 (descartada):** se pensó que Node resolvía `smtp.gmail.com` priorizando IPv6 y que el egress de Railway no completaba el handshake por esa vía. Se forzó IPv4 (`tls: { family: 4 }` en el transporte de `nodemailer` — no está tipado en `tls.ConnectionOptions` de `@types/node` pero sí es una opción válida en runtime, se pasa con `as ConnectionOptions`). **No arregló nada** — `railway logs --network --port 465` mostró que los paquetes SYN ya salían por IPv4 hacia la IP real de Google (`142.250.27.108:465`), se reintentaban con backoff exponencial, y nunca recibían respuesta (estado `ICMP_CSUM` en cada intento, cero paquetes de vuelta).
2. **Hipótesis puerto específico (descartada):** se probó 587 con STARTTLS en vez de 465 con TLS implícito, por si Railway solo bloqueaba 465. **Mismo patrón exacto** (`railway logs --network --port 587`): SYN retransmitidos hacia `142.251.127.109:587`, `ICMP_CSUM`, cero respuesta.

**Conclusión:** el egress de Railway bloquea SMTP saliente hacia Gmail en general, no es específico de puerto ni un problema de resolución DNS/IPv6. Es un patrón conocido en varios PaaS (bloqueo de puertos SMTP salientes por defecto, anti-abuso de spam).

### Solución: migrar el envío real a Resend (API HTTP)

Se creó `ResendEmailService` (`src/infrastructure/email/ResendEmailService.ts`) — envía vía `POST https://api.resend.com/emails` (HTTPS, no un socket SMTP crudo, así que no choca con el bloqueo). `container.ts` ahora prioriza `RESEND_API_KEY` si está cargada; si no, cae a `GmailSmtpEmailService` (que sigue sirviendo para dev local, donde el SMTP directo a Gmail sí funciona sin problema — se dejó el código, ahora en el puerto 587/STARTTLS tras el intento fallido de arreglo, no se revirtió a 465); sin ninguna de las dos, cae al log a consola de `DevEmailService`. Variables nuevas en `.env.example`: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

**Verificación corrida:** `npx tsc --noEmit`, `npm run lint` (0 errores, mismos warnings preexistentes), `npm run test:unit` (13 suites / 58 tests) y `npm run build` limpios. Mergeado a `develop` y pusheado (`c9e5d08`) — **todavía no mergeado a `main`**, porque falta la API key real de Resend (ver "Qué falta" abajo). Producción sigue en el deploy anterior (`d46e2f4`), con el login roto (cae a `DevEmailService`, que en producción tira error explícito en vez de fallar en silencio — no hay riesgo de que alguien reciba un link roto, simplemente no llega ningún link).

### Qué falta para que el login funcione en producción

1. **Crear cuenta en Resend** (resend.com) y generar un `RESEND_API_KEY` — paso manual de Agustín, no delegable.
2. **Verificar el dominio `devalpo.cl` en Resend** (agrega registros DNS tipo TXT/CNAME en el Zone Editor de Bluehost, mismo lugar que el wildcard de `sitios.devalpo.cl` — ver [Tarea 1.2](#tarea-12--wildcard-dns--ssl-)) para poder mandar desde `team@devalpo.cl` en vez del remitente de pruebas `onboarding@resend.dev` (que solo entrega a la cuenta dueña del API key, no sirve para usuarios reales).
3. Cargar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en Railway (servicio `web-bot`).
4. Mergear `develop` → `main` y pushear (ya tiene el código listo, commit `c9e5d08`).
5. Volver a probar `POST /api/auth/solicitar-acceso` en producción de punta a punta.

---

## ClaudeChatService: backend real de Claude (Fase 2, Tareas 2.2–2.4)

**Contexto:** `ClaudeChatService` era un stub que tiraba `no implementado` en `procesarMensaje`/`extraerDatos` — el modo real de `/api/chat` (clientes activados/pagados) estaba armado pero inalcanzable. Se implementó el adaptador real vía SDD (`sdd-apply`), TDD estricto (RED→GREEN por cada método).

### Qué se hizo

1. **`ClaudeChatService.ts` real** — mirroring `ResendEmailService`: el constructor siempre valida `ANTHROPIC_API_KEY` y tira descriptivo si falta (acepta un `Anthropic` opcional como seam de test). `procesarMensaje` hace una llamada `messages.create()` con el system prompt de las 8 preguntas (portado literal del roadmap), `max_tokens: 300`. `extraerDatos` hace una llamada con el prompt de extracción (10 rubros + `otro`), `max_tokens: 1024` (subido del `500` original del roadmap — con 500 se corría riesgo de truncar el JSON de un negocio con varios servicios).
2. **`parseSiteConfig` (función pura, exportada)** — estrategia de 3 pasos: `JSON.parse` directo → fallback de fence-stripping (```json ... ```) → fallback de slice `{...}` → si todo falla, tira `ClaudeServiceError('claude_extraction_failed', ...)` sin exponer el texto crudo al cliente (se loguea truncado a 500 caracteres, solo server-side). Nunca devuelve un `SiteConfigDTO` parcial. Normaliza rubro (10 valores + `otro` como catch-all), estilo (VO `Estilo`, default `moderno`), redes (`null → undefined`), servicios (`string[]`), y rellena `template`/`colores`/`imagenes` desde `RUBRO_DEFAULTS` (reutilizado de `src/infrastructure/demo/rubroDefaults.ts`, acoplamiento aceptado por diseño).
3. **`claudeRateLimit.ts`** — límite de 20 mensajes por `clienteId` cada 24h (separado del límite de demos por IP en `demoRateLimit.ts`), mismo patrón de `Map` en memoria (se resetea si Railway reinicia la instancia — limitación conocida, aceptable para el deploy de una sola instancia).
4. **`container.ts`** — se sacó la construcción eager `const chatService = new ClaudeChatService()` (rompía el boot si faltaba `ANTHROPIC_API_KEY`, incluso en modo solo-demo) y se agregó `getChatServiceReal(): IChatService | null`, perezoso y memoizado — devuelve `null` sin key configurada, construye una sola vez si está.
5. **`route.ts`** — consume `getChatServiceReal()`; devuelve `503 chat_no_configurado` si un cliente activado intenta chatear sin key configurada; chequea `verificarLimiteClaude` antes de cualquier llamada paga (`429 claude_limit_reached`, sesión intacta); short-circuit de reintento de extracción — si la conversación ya tiene las 8 respuestas pero `completada` sigue `false` (un intento previo de `extraerDatos` falló), la próxima llamada salta `procesarMensaje` y va directo a `extraerDatos`, sin pagar una vuelta extra ni ensuciar el historial; mapea `ClaudeServiceError` a `502` (`claude_no_disponible` o `extraccion_fallida` según el código) — la vuelta fallida de `procesarMensaje` nunca se persiste, pero el historial sí se persiste tras una extracción fallida (para que el short-circuit funcione en el reintento).
6. **Tests:** 104 tests unitarios (`npm run test:unit`, 17 suites), TDD estricto RED→GREEN por tarea, incluye `describe.each` sobre los 10 rubros (panadería, peluquería, dentista, restaurante, consultora, taller, yoga, ferretería, veterinaria, tienda) con respuestas de Claude simuladas en 3 formatos (JSON directo, con fence markdown, con prosa alrededor) para ejercer el fallback de parseo. `jest.config.ts` ahora exige 85% de cobertura en `src/infrastructure/claude/**` (antes la infra no tenía ningún gate de cobertura) — se excluyó explícitamente `src/infrastructure/claude/prompts/**` (dos archivos de una migración anterior, nunca importados por nadie, duplican los prompts que ahora viven inline en `ClaudeChatService.ts`; quedaron fuera de alcance de este cambio, no se tocaron ni se les exige cobertura).
7. **`package.json`**: agregado `@anthropic-ai/sdk`. **`.env.example`**: agregado `ANTHROPIC_MODEL=claude-sonnet-4-6` (`ANTHROPIC_API_KEY` ya estaba desde Fase 1).

### Qué falta

1. **`ANTHROPIC_API_KEY` no está cargada en ningún lado** (ni local ni Railway) — paso manual de Agustín, no delegable. Sin ella, `getChatServiceReal()` devuelve `null` y el modo real sigue devolviendo `503 chat_no_configurado` — el modo demo no se ve afectado.
2. **No se corrió un smoke test de boot real** (`npm run dev` + `curl`) — el único `DATABASE_URL` disponible en este entorno apunta a la base de producción de Railway (`sakura.proxy.rlwy.net/railway`), y escribir sesiones de prueba ahí no correspondía. Los dos escenarios del smoke test (demo intacto, `503` sin key) están cubiertos por tests automatizados (`tests/unit/infrastructure/container.test.ts`, `tests/unit/app/api/chat.test.ts`) en vez de una verificación manual en vivo.
3. Sigue bloqueado por la **Tarea 1.4** (motor de pagos, pausado) — sin eso no hay forma real de que un cliente llegue a `activo: true` en producción para probar el flujo pago de punta a punta.
4. `npm run test:coverage` (no `test:unit`) sigue mostrando fallas de threshold preexistentes y no relacionadas a este cambio (`GenerarSitio.usecase.ts`, `VerificarDominio.usecase.ts`, `Pago.ts`, `PagoInvalidoException.ts`, `SitioNoActivoException.ts`, `ReactivarSitio.usecase.ts`) — confirmado con `git stash` que ya fallaban antes de esta sesión, no son parte de este cambio.

---

## Deploy a producción (2026-08-25) — Frente 1 (Resend) y Frente 2 (ClaudeChatService) a `main`

**Contexto:** ambos frentes quedaron code-complete en sesiones anteriores pero ninguno había llegado a `main` — Resend estaba mergeado y probado en `develop` (`c9e5d08`) esperando la API key real, y ClaudeChatService estaba completamente sin commitear pese a verificado (104/104 tests) desde el 24/08. Se armó un plan SDD (`phase2-rollout`, artifact store Engram: explore → propose → spec → design → tasks → apply) para secuenciar el rollout de los dos sin bundlearlos en un solo push.

### Qué se hizo

1. **Frente 1 — Resend a producción:** `develop` (`6ca476e`, incluye `c9e5d08`) estaba 2 commits adelante de `main`. Fast-forward puro confirmado (`git log origin/develop..origin/main` vacío) — se pusheó directo con `git push origin develop:main`, sin hacer `checkout` ni tocar el working tree (evita pisar los cambios sin commitear del Frente 2, que en ese momento ya tocaban `.env.example` y `container.ts`, archivos que Resend también había modificado). Railway auto-deployó, verificado con `railway status`.
2. **Gitignore de `.atl/`:** el directorio de metadata del tooling SDD (`skill-registry.md`, `.skill-registry.cache.json`) no estaba en `.gitignore` — se agregó `/.atl/` en un commit aparte (`c0238ff`) antes de tocar el Frente 2, para que no se colara sin querer en el commit grande.
3. **Frente 2 — commit del ClaudeChatService:** el changeset completo (15 archivos: 8 modificados + 7 nuevos, ~1417 líneas) se commiteó como una sola unidad atómica (`40f7bf6`) — no se pudo partir en commits más chicos porque `container.ts`, antes de este cambio, instanciaba el adapter real de forma eager (explotaba en el boot sin `ANTHROPIC_API_KEY`); solo el getter perezoso (parte del mismo commit) lo arregla, así que un commit "solo fundamentos" habría dejado código muerto. Regression gate corrido contra `develop` HEAD antes de commitear: 104/104 tests, `tsc --noEmit` limpio, eslint 0 errores.
4. **Merge a `main`:** mismo patrón, otro fast-forward puro, pusheado (`git push origin develop:main`, `6ca476e..40f7bf6`) — y esta vez también se sincronizó `origin/develop` (`git push origin develop:develop`), que había quedado 2 commits atrás del remoto tras los commits locales del punto 2-3. Railway redeployó — logs de arranque limpios (`✓ Ready in 81ms`), sin crashear pese a que `ANTHROPIC_API_KEY` sigue sin cargar (confirma que el getter perezoso funciona como esperado: el modo real queda inerte hasta que se cargue la key, en vez de romper el boot).

### Estado tras este deploy

- `main` y `develop` sincronizados, ambos en `40f7bf6`.
- **Login por magic link: sigue bloqueado** — el código está en producción, pero faltan los pasos manuales de Agustín (cuenta Resend, DNS, cargar `RESEND_API_KEY`/`RESEND_FROM_EMAIL` en Railway). Checklist sin cambios, ver sección de arriba.
- **ClaudeChatService: código en producción, modo real todavía inerte** — falta cargar `ANTHROPIC_API_KEY` en Railway (mismo patrón que Resend: sin la key, cae a `503 chat_no_configurado` en vez de romper nada).
- No se corrió (ni correspondía) un smoke test en vivo del `503` — la única forma de alcanzar esa rama del código es un cliente logueado con `activo: true`, y no existe ninguno real en producción todavía (bloqueado por la Tarea 1.4). La evidencia de que no rompe queda en los logs de arranque limpios y en los tests unitarios (`tests/unit/infrastructure/container.test.ts`).
- Jira WB-13/WB-14 quedaron en "En curso" con la descripción reflejando el estado code-complete previo a este deploy — pendiente decidir si pasan a "Finalizada" ahora que el código está en `main`, o se dejan en curso hasta que la key esté cargada y probada en vivo.

---

## 5 templates de sitio (Fase 3, Tarea 3.1 / WB-22) — cadena de 7 PRs (2026-09-04/05)

**Contexto:** hasta ahora había un solo layout en `src/app/sites/[subdominio]/page.tsx` que se adaptaba con datos y colores; el roadmap pide 5 diseños visualmente distintos elegidos por el `Template` del sitio. Se hizo con ciclo SDD completo (cambio `site-templates`, artefactos en Engram: explore → research → propose → spec → design → tasks → apply → verify → archive). Antes de empezar se cerraron en Jira los tickets que ya estaban hechos en código (WB-12, WB-15, WB-17, WB-32).

### Decisiones de producto tomadas por Agustín

- Sin dependencias de test nuevas (ni jsdom ni Testing Library): los tests unitarios van sobre funciones puras (selección de template y *section builders*) y el render se cubre con e2e.
- `ITemplateService`, que existía sin usarse, se cablea como único punto de selección rubro→Template. Había **cuatro** mapas duplicados (`rubroDefaults`, `ClaudeChatService`, `DemoChatService` y el seed demo); ahora todos consumen `RUBRO_TEMPLATES` en `src/infrastructure/templates/rubroTemplates.ts`. `generarConfig` sigue sin implementar (es Tarea 3.2).
- Dos demos existentes cambian de template: **consultora → LANDING** y **taller → PORTFOLIO** (las etiquetas "Qué ofrecemos" y "Trabajos" ya existían para esos valores). No se agregaron demos nuevos.
- Entrega en **PRs encadenados** de menos de 800 líneas (presupuesto de revisión), cada uno apuntando al anterior. La tanda 1 salió en 1.178 líneas y se partió en 1a y 1b; 1b quedó en 825 con la etiqueta `size:exception` (creada en el repo).

### Qué hay

- **Arquitectura:** `ITemplateService.seleccionarTemplate` decide *qué* `Template` (capa aplicación/infra); `src/components/templates/registry.ts` + `resolver.ts` deciden *qué componente* lo renderiza (presentación). `page.tsx` es un dispatcher delgado que hace `await params`, carga el sitio y resuelve el componente con fallback a LANDING ante cualquier valor desconocido (lookup cerrado con `Object.hasOwn`, así claves de prototipo como `toString` tampoco escapan). Sin `next/dynamic` (los Server Components ya se dividen solos) ni `'use client'`.
- **Los 5 templates** en `src/components/templates/<nombre>/{index.tsx, sections.ts, *.module.css}`: LANDING (el layout anterior migrado tal cual, CSS movido con `git mv`), SERVICIOS (hero dividido, lista numerada, CTA de reserva), RESTAURANTE (hero fotográfico, menú a dos columnas con guías punteadas, franja de galería), PORTFOLIO (hero editorial oscuro sin imagen, grilla masonry con CSS columns, footer mínimo) y TIENDA (cabecera compacta + banner, grilla de productos con WhatsApp por tarjeta, barra de contacto fija solo con CSS). Cada raíz expone `data-template`.
- **DTO:** `SiteConfigDTO` suma `sobreNosotros?` y `contacto.formulario?` como opcionales; `parseSiteConfig` los normaliza sin fabricarlos. El formulario de contacto es solo presentación con `mailto:` (codificado); cablearlo a `IEmailService` queda para después.
- **Footer compartido** en `shared/Footer.tsx` (idéntico en 4 templates, regla de tres del diseño). Helpers puros en `shared/{palette,enlaces,types}.ts`.
- **Tests:** 104 → 259 unitarios. E2E: nuevo `templates_por_sitio.feature` con un escenario por template (8/8 escenarios, 50/50 pasos, corridos contra `npm run dev` local + la Postgres de Railway con fixtures que se limpian solos).
- **Bug preexistente corregido:** el escenario e2e "sitio activo" estaba roto desde `fa1dcaf` (Demo Mode): el fixture ponía `nombre: 'Sitio E2E'` y el step buscaba el subdominio en el `h1`, que desde ese commit muestra `config.nombre`. Se arregló el fixture, no el template.

### Cadena de PRs (mergear en orden, cada uno tiene como base el anterior)

| PR | Tanda | Commit | Líneas |
|---|---|---|---|
| #1 | 1a servicio de selección + DTO | `6c797e7` | 365 |
| #2 | 1b registry + resolver + LANDING + dispatcher (`size:exception`) | `6f7d69f` | 825 |
| #3 | 2 SERVICIOS | `036a533` | 656 |
| #4 | 3 RESTAURANTE | `38266ec` | 695 |
| #5 | 4a PORTFOLIO | `f885f89` | 630 |
| #6 | 4b TIENDA | `8b13828` | 749 |
| #7 | 5 reasignación de demos + footer + e2e + fix fixture | `bb3abfe` | 499 |

Ramas `feature/wb-22-site-templates-{1a,1b,2,3,4a,4b,5}`. Total: 50 archivos, +3.802 / −177. Verificación final: 259/259 unitarios, `tsc --noEmit` limpio, lint 0 errores (+2 avisos por los parámetros del stub `generarConfig`).

### Cierre (2026-09-05)

1. ✅ PRs #1 → #7 mergeados en orden a `develop` (merge commits) y `develop` → `main` (`9c19460`), deploy en Railway `SUCCESS`. **Gotcha de GitHub:** al mergear el PR #1 con `--delete-branch`, GitHub **cerró** el PR #2 en vez de reapuntarlo a `develop` (su base era la rama borrada). Se recuperó re-pusheando la rama base temporalmente, reabriendo el PR, cambiando la base y borrando la rama de nuevo. Para el resto de la cadena: mergear sin borrar, reapuntar el siguiente con `gh pr edit N --base develop`, y borrar las ramas al final.
2. ✅ `npm run db:seed-demo` corrido contra Railway tras el deploy: consultora → LANDING, taller → PORTFOLIO, el resto sin cambios. **Bug encontrado:** `prisma/seed-register.js` no registraba `tsconfig-paths`, y `seedDemoTemplates.ts` → `rubroTemplates.ts` importa con alias `@/`, así que el seed fallaba con `Cannot find module '@/domain/value-objects/Template'`. Se agregó el mismo registro que ya usa `tests/e2e/register.js`.
3. ✅ Verificado en producción con `curl`: cada demo responde 200 con su `data-template` correcto (consultora LANDING, taller PORTFOLIO, ferretería TIENDA, panadería RESTAURANTE, veterinaria SERVICIOS).
4. ✅ Jira WB-22 → Finalizada.
5. Opcional pendiente: afirmar paleta e imágenes a nivel DOM en e2e (hoy se verifican en unitarios y por código).

---

## Reposicionamiento: fábrica de sitios (2026-09-05)

**Contexto:** Agustín dudaba de si un SaaS de páginas web tiene sentido (mercado saturado por Wix/Hostinger/Durable, y las pymes chilenas no quieren pagar mantención). Al conversar salió el dato clave: **Devalpo ya vende sitios WordPress** (es su servicio más vendido), pero cada uno se hace a mano en Elementor.

### Números reales de Devalpo

| Concepto | Valor |
|---|---|
| Precio sitio de una página | USD 320 |
| Precio sitio multipágina | USD 400 |
| Costo programador por sitio | USD 180 |
| Tiempo de entrega | hasta 15 días |
| Volumen | ~2 sitios al mes, solo referidos y contactos |
| Modelo | pago único, hosting incluido un año, el cliente casi nunca edita |

Con WebBot (multitenant en un solo Railway) el costo marginal por sitio es casi cero y la entrega baja a 1–2 días. El margen sube de ~USD 120–200 a ~USD 280–360 al mismo precio, y sobre todo permite **bajar el precio y escalar volumen con marketing sin contratar más programadores**.

### Decisión

WebBot es la **fábrica de sitios de Devalpo**, no un SaaS de autoservicio. Promesa comercial: *"tu sitio web en un día, con dominio propio, pago único"*. El chat demo público es el imán de clientes; Devalpo cierra la venta y entrega.

### Alcance de código (cerrado, en orden)

1. Mergear los 7 PRs de WB-22 y cargar `RESEND_API_KEY` y `ANTHROPIC_API_KEY` en Railway.
2. Dominio propio por sitio (WB-26): campo `dominio` en `Sitio`, resolución por host en `proxy.ts`, alta del dominio en Railway, instrucciones de DNS para el cliente.
3. Panel interno mínimo para el equipo (WB-27): listar sitios, activar/pausar, asignar dominio, corregir `configJson`.
4. Landing nueva: promesa de 1 día, precio único, sin planes mensuales.
5. Link de pago Mercado Pago / Flow con activación manual.

**Fuera de alcance:** motor de pagos por suscripción (Tarea 1.4 / WB-8, WB-30), N8N (WB-16), bot de WhatsApp (WB-18), edición para el cliente final, autoservicio completo.

**Supuestos:** Devalpo compra y administra el dominio a nombre del cliente (si ya tiene uno, apunta el DNS); primer lanzamiento solo con sitios de una página (multipágina después); precio de referencia USD 150–200, se fija al armar la landing.

**Regla:** después del punto 5, no se escribe más código hasta vender 5 sitios con WebBot.

---

## Dominio propio por sitio (FASE 5, WB-26) — rama `feature/wb-26-dominio-propio` (2026-09-05)

**Bloqueante encontrado antes de codear:** Railway limita los dominios custom por plan (Trial 1 en total, Hobby 2 por servicio, Pro 20 por servicio) y el único slot del trial ya lo usa el wildcard `*.sitios.devalpo.cl`. Para una fábrica de sitios no escala. **Decisión de Agustín:** Cloudflare for SaaS (plan gratis, 100 hostnames de clientes incluidos, USD 0,10/mes cada adicional) delante de Railway. Implica mover el DNS de `devalpo.cl` de Bluehost a Cloudflare (solo el DNS: el WordPress de Devalpo sigue alojado en Bluehost, el correo de Google Workspace no cambia). Agustín ya tiene cuenta en Cloudflare (zona de Serendipia Ediciones); `devalpo.cl` entra como zona adicional.

### Arquitectura

`panaderia.cl` → CNAME a `dominios.devalpo.cl` → Cloudflare termina TLS → Worker (fallback origin, ruta `*/*`) reenvía a `custom.sitios.devalpo.cl` (Railway) con `X-Forwarded-Host: panaderia.cl` y `X-WebBot-Worker-Secret` → `src/proxy.ts` valida el secreto y reescribe a `/sites/custom/panaderia.cl` → la página busca por `dominioPropio` (con reintento sin `www.`) y reutiliza el dispatcher de templates.

### Qué hay

- `src/infrastructure/routing/resolverDestino.ts`: clasificación pura del host (app / subdominio / dominio propio) con 31 tests. Si `WORKER_SHARED_SECRET` está configurado y el secreto no coincide, la cabecera se ignora por completo. La cabecera confiable pasa igual por las reglas de app/subdominio, así nunca convierte a la app en una búsqueda por dominio propio.
- `src/proxy.ts` queda como adaptador delgado sobre `resolverDestino`; `src/app/sites/renderizarSitio.ts` comparte el render entre `[subdominio]` y `custom/[host]`.
- `infra/cloudflare/worker/` (wrangler, `src/index.ts`): passthrough para la zona propia, reenvío con cabeceras para el resto, `redirect: 'manual'`. Excluido de `tsc`/eslint del root.
- `docs/DOMINIO_PROPIO.md`: runbook de configuración única en Cloudflare, alta por cliente (API de custom hostnames) e instrucciones de DNS para el cliente.
- E2E `sitio_por_dominio_propio.feature`: sitio servido por `X-Forwarded-Host` y 404 para dominio desconocido. Corrido contra `npm run dev` + Postgres de Railway: 10/10 escenarios, 60/60 pasos.
- Verificación: 290 tests unitarios, `tsc --noEmit` limpio, lint 0 errores.

### Qué falta

1. Agregar `WORKER_SHARED_SECRET=` a `.env.example` a mano (el tooling no puede editar dotfiles).
2. Pasos manuales de Agustín en Cloudflare (ver `docs/DOMINIO_PROPIO.md`): zona `devalpo.cl`, comparar registros con Bluehost, cambiar nameservers en NIC.cl, activar Cloudflare for SaaS, fallback origin + CNAME target, desplegar el Worker, cargar `WORKER_SHARED_SECRET` en wrangler y en Railway.
3. Cablear el alta del custom hostname y la asignación de `dominioPropio` desde el panel interno (WB-27).

---

## Decisiones que se apartan del roadmap original

| Tema | Roadmap dice | Se hizo | Por qué |
|------|-------------|---------|---------|
| Versión Next.js | 14 | **16.3.0** (última estable) | No tiene sentido arrancar con una versión vieja; lo que importa es App Router, que se mantiene. |
| DNS registro | A record con IP | **CNAME** | Railway no da IPs estáticas por servicio. |
| Conexión Prisma | `new PrismaClient()` | **`PrismaPg` driver adapter** | Prisma 7 (instalado) lo exige. |
| Conexión BD local | Túnel SSH Railway CLI | **Public Access + DATABASE_PUBLIC_URL** | Túnel SSH no funciona en este Windows (ver arriba). |
| Archivo de middleware | `middleware.ts` | **`proxy.ts`** (función `proxy`) | Next.js 16 deprecó la convención `middleware.ts`. |
| Generación de Prisma Client | Implícita | **`postinstall: prisma generate`** en `package.json` | Railway no la corría sola en build limpio; rompía el deploy. |

---

## Migración a arquitectura de 4 capas (Clean Architecture)

**Fecha:** 2026-08-10. Se agregó `docs/WEBBOT_ARQUITECTURA.md` (Clean Architecture: `domain → application → infrastructure → presentation`, más pirámide de tests Jest + Playwright/Cucumber) y se migró todo el código existente de Fase 1 a esa estructura, bajo `src/`.

**Qué quedó con código real** (tiene respaldo hoy): entidades de dominio (`Cliente`, `Sitio`, `Sesion`, `Pago`), sus value objects, interfaces de repos y excepciones; DTOs, interfaces de servicios de aplicación, mappers y los 5 use cases (`GenerarSitio`, `ActivarCliente`, `PausarSitio`, `ReactivarSitio`, `VerificarDominio`); los 4 repositorios Prisma; el contenedor DI (`src/infrastructure/container.ts`); y la página de sitio por subdominio (ahora usa `sitioRepo` del container en vez de Prisma directo).

**Qué quedó como stub** (implementan la interfaz, lanzan `Error('no implementado')`): `ClaudeChatService`, `RailwayDeployService`, `PaymentEngineService`, `WhatsAppNotificacionService` — ninguno tiene su servicio externo real construido todavía (son trabajo de Fase 2/3, o dependen de la Tarea 1.4 bloqueada). Se hizo así para no inventar lógica de negocio de fases futuras, cumpliendo igual con "dejar la arquitectura lista".

**Tests agregados:** unitarios para las 4 entidades y para los use cases con lógica de orquestación mockeable (`ActivarCliente`, `PausarSitio`, `ReactivarSitio`); mocks de los 4 repositorios en `tests/integration/mocks/`; un solo feature BDD e2e real (`tests/e2e/features/sitio_por_subdominio.feature`) que ejercita la página de sitio por subdominio contra la BD real — es la única funcionalidad end-to-end que ya existe y corre en producción (Tarea 1.5). No se crearon tests de integración/e2e para `/api/chat` ni `/api/webhooks/pagos` porque esas rutas no existen todavía.

### Decisiones que se apartan de `docs/WEBBOT_ARQUITECTURA.md`

| Tema | El documento dice | Se hizo | Por qué |
|------|-------------------|---------|---------|
| Presentation layer | `src/presentation/app/...` | **`src/app/...`** | Next.js solo reconoce el App Router en `app/` o `src/app/` — no en una ruta arbitraria. `domain/application/infrastructure` quedan como carpetas hermanas de `app/` bajo `src/`, no como padres de ella. |
| Middleware | `middleware.ts`, función `middleware` | **`src/proxy.ts`, función `proxy`** | Next.js 16 renombró la convención (ya migrado en la Tarea 1.5, ver arriba). |
| Versión Next.js | 14 | **16.3.0** | Ya era una decisión tomada (ver tabla de arriba); no tiene sentido retroceder. |
| Schema Prisma | `url = env("DATABASE_URL")` dentro de `schema.prisma` | **Sin `url` en el schema** — se resuelve solo vía `prisma.config.ts` | Prisma 7 (instalado) usa `defineConfig({ datasource: { url } })` + adapter `PrismaPg`; poner `url` en el schema es el patrón viejo que ya sabíamos que rompe. |
| `IPagoService` | `crearSuscripcion` / `procesarWebhook(payload)` / `cancelarSuscripcion` | **`crearSuscripcion` (devuelve `checkoutUrl`) / `consultarSuscripcion` (GET, fuente de verdad) / `cancelarSuscripcion`** — sin método que "confíe" en el payload del webhook | El motor de pagos real (Tarea 1.4) es un microservicio con checkout redirect y webhooks salientes **sin firma** — el contrato real exige siempre reconfirmar con GET, nunca activar algo directo desde el body de un webhook. |
| Servicios de infraestructura externos | Implementaciones completas (`ClaudeChatService`, `FlowPagoService`, etc.) | **Stubs que lanzan error** (`PaymentEngineService` en vez de `FlowPagoService`, ya que el motor real no es solo Flow) | Esas integraciones son trabajo de Fase 2/3 o dependen de la Tarea 1.4 bloqueada; no se inventa su lógica todavía. |

### Verificación (todo corrido de verdad, no solo revisado a ojo)

`npx tsc --noEmit`, `npm run build`, `npm run lint`, `npm run test:unit` (7 suites / 22 tests) y `npm run test:e2e` (3 escenarios / 15 steps, contra `npm run dev` local + la Postgres real de Railway) corrieron limpios. El e2e crea y borra un `Cliente`+`Sitio` de prueba (`e2e-activo`/`e2e-pausado`); se confirmó después que no quedaron filas huérfanas.

**Detalles menores encontrados y corregidos durante la verificación:**
- `dotenv@17.4.2` imprime un "tip" promocional al azar en consola (uno de ellos apunta a `vestauth.com`, otro producto de los mismos autores) cada vez que corre `.config()`. No es nada del proyecto ni una inyección — está en el propio código fuente del paquete (`node_modules/dotenv/lib/main.js`, array `TIPS`). Se silenció con la opción `quiet: true` en los dos lugares donde lo usamos (`prisma.config.ts` y `tests/e2e/register.js`).
- `next dev` (Next.js 16) generó automáticamente `AGENTS.md` y `CLAUDE.md` en la raíz la primera vez que corrió — es una feature nueva de Next 16, se puede desactivar con `agentRules: false` en `next.config.ts`. Quedaron sin trackear en git, sin decidir todavía si se commitean.
- Se agregó `docs/COMANDOS.md` con todos los comandos (setup, tests, Prisma, Railway CLI, git) y URLs útiles del proyecto en un solo lugar, para no tener que ir a buscarlos por todo este documento.

**Nada de esto se comiteó todavía** — el working tree quedó con los cambios listos para revisar (`git status` muestra los `R` de los archivos movidos y los `??` de lo nuevo).

---

## Tarea 1.4 — Motor de pagos: hallazgos y estado (PAUSADA)

El repo del motor de pagos es privado: `https://github.com/Devalpo/DeValpo.PaymentEngine.git`. No se pudo clonar directamente porque la organización Devalpo tiene **OAuth App access restrictions** activadas (bloquea a Git Credential Manager aunque el usuario tenga permisos — error `403` con mensaje explícito de GitHub sobre esto, no era problema de permisos del repo). Se resolvió con Agustín descargando el ZIP manualmente a `C:\Users\agust\Documents\DeValpo.PaymentEngine-main`.

### Qué es realmente (distinto de lo que asume el roadmap)

El roadmap asume que "el motor de pagos" simplemente manda un webhook a WebBot con `{ clienteId, monto, estado, proveedor, referencia }`. La realidad es otra: es un **microservicio FastAPI independiente y reutilizable** (`motor-de-pagos`), con su propia Postgres, pensado para que cualquier app de Devalpo lo consuma por API. Soporta Flow, Mercado Pago, PayPal y Stripe (pagos únicos y suscripciones).

**Contrato de integración real** (`docs/integration-contract.md` del motor de pagos):

- WebBot es el "consumer app". Flujo:
  1. WebBot llama `POST /v1/subscriptions` con `{ gateway, external_order_id, amount, currency, description, customer: {email, name}, return_url, cancel_url, gateway_plan_id, metadata }` — header `X-API-Key`.
  2. El motor devuelve `{ subscription_id, gateway, external_order_id, status, checkout_url }`.
  3. WebBot redirige al cliente a `checkout_url`.
  4. Cuando el cliente vuelve, WebBot debe consultar `GET /v1/subscriptions/{subscription_id}` para el estado real — **no confiar solo en el webhook**.
  5. El motor también puede avisar de forma asíncrona pegándole a una URL propia (`PROJECT_WEBHOOK_URL`, configurada como env var **del motor de pagos**, no de WebBot) con body `{ "type": "subscription.active" | "subscription.past_due" | "subscription.cancelled" | "subscription.expired" | "payment.paid" | "payment.failed" | "payment.cancelled" | "payment.expired" | "payment.refunded", "data": {...} }`.
  - **Ojo:** esos webhooks salientes del motor **no llevan firma/secreto** — cualquiera que conozca la URL podría pegarle. Por eso el propio motor recomienda tratarlos solo como "aviso para refrescar" y volver a pedir el estado real con `GET`, no confiar en el payload a ciegas. Así hay que implementar el receptor en WebBot.
  - Enums reales de estado: `PaymentStatus` = created/pending/approved/pending_capture/processing/requires_action/paid/failed/cancelled/expired/refunded. `SubscriptionStatus` = created/pending/active/past_due/cancelled/expired. (El enum `Proveedor` que ya creamos en Prisma dice `MERCADOPAGO`, pero el motor usa el string `mercado_pago` con guion bajo — hay que mapear, no asumir que son el mismo string.)

### Bloqueante real: el motor de pagos no está deployado en ningún lado

Su propia doc dice explícito: *"This repository only builds and validates the service. It does not auto-deploy."* No hay URL productiva ni de staging. Para completar la Tarea 1.4 de verdad hace falta:

1. Deployarlo como servicio nuevo en Railway (tiene `Dockerfile` listo) — sería un **4to servicio**, con su propia Postgres (o reusar la existente, a decidir).
2. Cargar sus propios secrets (`FLOW_API_KEY`, `FLOW_SECRET_KEY`, `MERCADO_PAGO_ACCESS_TOKEN`, `PAYPAL_CLIENT_ID/SECRET`, `API_KEYS`, etc.) — Agustín los tiene que conseguir/generar.
3. Crear los **planes recurrentes reales** en los dashboards de Flow y Mercado Pago para Starter/Pro/Agencia y conseguir sus `gateway_plan_id`.
4. Agregar un campo a `Cliente` (o `Pago`) en el schema de Prisma para guardar el `subscription_id` que devuelve el motor — **no existe todavía**, hay que migrar.
5. Setear `PROJECT_WEBHOOK_URL` del motor apuntando a un endpoint nuevo de WebBot (ej. `app/api/webhooks/pagos/route.ts`).

**Decisión (2026-08-08):** se pausa la 1.4 acá. Se salta a la **Tarea 1.5 — Middleware multitenant**, que no depende de nada de esto. Se retoma la 1.4 cuando Agustín tenga tiempo/ganas de deployar el motor de pagos y conseguir credenciales/plan IDs reales.

---

## Cómo retomar

1. Leer esta bitácora + `WEBBOT_ROADMAP.md`.
2. `main` y `develop` están sincronizados (2026-09-05): los 7 PRs de WB-22 ya están mergeados y en producción, con el seed demo corrido — ver [5 templates de sitio](#5-templates-de-sitio-fase-3-tarea-31--wb-22--cadena-de-7-prs-2026-09-0405). **El plan vigente es la FASE 5 (Jira WB-40)** — ver [Reposicionamiento](#reposicionamiento-fábrica-de-sitios-2026-09-05): lo siguiente es el dominio propio por sitio (WB-26). `git status` debería estar limpio; si no, revisar qué quedó a medio commitear antes de seguir.
3. Verificar que el `.env` local sigue teniendo el `DATABASE_URL` público correcto (no se sube al repo, está en `.gitignore`).
4. **Producción ya tiene desde el 14/08:** Chat UI, landing pública, Demo Mode (con sus 10 sitios de ejemplo — el seed ya corrió contra la BD real, verificado sirviendo `demo-veterinaria.sitios.devalpo.cl`) y las variables `AUTH_SECRET`/`NEXT_PUBLIC_APP_URL` cargadas en Railway.
5. **Login por magic link sigue roto en producción** — el código ya está en `main` (mergeado 2026-08-25), falta solo: (a) crear cuenta en Resend y generar `RESEND_API_KEY`, (b) verificar `devalpo.cl` en Resend (DNS en Bluehost), (c) cargar `RESEND_API_KEY`/`RESEND_FROM_EMAIL` en Railway. En local sigue funcionando por Gmail SMTP directo sin problema (el bloqueo es solo en el egress de Railway).
6. Para retomar la Tarea 1.4: el código del motor de pagos está en `C:\Users\agust\Documents\DeValpo.PaymentEngine-main` (descargado por fuera del repo de WebBot, no es un submódulo ni está versionado acá). Repo real: `https://github.com/Devalpo/DeValpo.PaymentEngine.git` (privado, org con OAuth restrictions — si se necesita clonar de nuevo, mejor pedirle a Agustín el ZIP actualizado en vez de pelear con permisos OAuth).
7. Fase 1 está prácticamente cerrada (6/7, solo falta 1.4 que depende de deployar el motor de pagos). Fase 2 arrancó fuerte: Chat UI + Demo Mode + landing ya en producción, auth por magic link con el código ya en `main` pero bloqueada por el envío de email (punto 5). **El agente Claude de onboarding (Tareas 2.2–2.4) tiene el backend real implementado y también ya está en `main`** (ver [ClaudeChatService: backend real de Claude](#claudechatservice-backend-real-de-claude-fase-2-tareas-22–24) y [Deploy a producción (2026-08-25)](#deploy-a-producción-2026-08-25--frente-1-resend-y-frente-2-claudechatservice-a-main)) — falta cargar `ANTHROPIC_API_KEY` (ni local ni Railway la tienen todavía) para que deje de devolver `503 chat_no_configurado`, y sigue dependiendo también de la Tarea 1.4 (pago) para que un cliente real llegue a `activo: true`.
8. Jira (proyecto **WB**, `devalpo-team.atlassian.net`) espeja el roadmap para seguimiento. El 2026-09-04 se sincronizó con el código: WB-12, WB-15, WB-17 y WB-32 pasaron a Finalizada; WB-22 (5 templates) está En curso con los 7 PRs abiertos.
9. **Fase 3 arrancó con la Tarea 3.1 (WB-22) code-complete** en la cadena de PRs. Siguientes candidatas sin bloqueo externo: 3.2 template engine (`generarConfig` de `ITemplateService`, que hoy lanza `not_implemented`) y 3.6 panel básico de administración (WB-27).
