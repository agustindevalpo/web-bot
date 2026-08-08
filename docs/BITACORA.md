# Bitácora de desarrollo — WebBot

> Registro de avance para retomar el trabajo. Se actualiza cada vez que cerramos una tarea o pausamos sesión.
> Roadmap completo: [`WEBBOT_ROADMAP.md`](./WEBBOT_ROADMAP.md)

---

## Estado general

**Última sesión:** 2026-08-08
**Fase actual:** FASE 1 — Fundaciones
**Desarrollador:** Agustín (único dev del proyecto — el roadmap menciona 3 personas pero todo lo hace él)

```
FASE 1 — Fundaciones       [ ] 🟡 en progreso (3/7 tareas)
FASE 2 — Bot & IA           [ ] 🔴 pendiente
FASE 3 — Templates & Deploy [ ] 🔴 pendiente
FASE 4 — Lanzamiento        [ ] 🔴 pendiente
```

### Checklist Fase 1

```
[x] 1.1 — 3 servicios Railway en verde
[x] 1.2 — *.sitios.devalpo.cl con HTTPS funcionando
[x] 1.3 — Todas las tablas en PostgreSQL creadas
[ ] 1.4 — Webhook de pago activa/pausa cliente en BD   ← PAUSADA, ver "Próximo paso"
[ ] 1.5 — Middleware sirve rutas por subdominio
[ ] 1.6 — Todos los secrets cargados en Railway
[ ] 1.7 — CI/CD auto-deploy funcionando
```

---

## Repositorio

- **Repo:** https://github.com/agustindevalpo/web-bot.git
- **Rama:** `main` (auto-deploy activado en Railway)
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

---

## Decisiones que se apartan del roadmap original

| Tema | Roadmap dice | Se hizo | Por qué |
|------|-------------|---------|---------|
| Versión Next.js | 14 | **16.3.0** (última estable) | No tiene sentido arrancar con una versión vieja; lo que importa es App Router, que se mantiene. |
| DNS registro | A record con IP | **CNAME** | Railway no da IPs estáticas por servicio. |
| Conexión Prisma | `new PrismaClient()` | **`PrismaPg` driver adapter** | Prisma 7 (instalado) lo exige. |
| Conexión BD local | Túnel SSH Railway CLI | **Public Access + DATABASE_PUBLIC_URL** | Túnel SSH no funciona en este Windows (ver arriba). |

---

## Próximo paso — Tarea 1.4 (pausada)

Quedamos en la **Tarea 1.4 — Motor de pagos: completar suscripciones**. Antes de escribir el webhook (`app/api/webhooks/pagos/route.ts`) necesitamos que Agustín aporte info sobre el **motor de pagos ya existente de Devalpo** (Flow + MercadoPago + PayPal):

- ¿Dónde está el código/repo de ese motor?
- ¿Qué payload exacto manda al confirmar/fallar un pago? (el roadmap asume `{ clienteId, monto, estado, proveedor, referencia }`, pero hay que confirmarlo contra el sistema real)
- ¿Ya soporta cobro recurrente mensual en Flow y MercadoPago, o hay que armarlo?

**Alternativa si no hay info a mano todavía:** saltar a la **Tarea 1.5 — Middleware multitenant Next.js**, que es código puro (no depende de sistemas externos) y ya tenemos todo lo necesario (Prisma + tablas listas) para escribirla. Volver a la 1.4 cuando esté la info del motor de pagos.

---

## Cómo retomar

1. Leer esta bitácora + `WEBBOT_ROADMAP.md`.
2. Confirmar con Agustín si seguimos con 1.4 (con info del motor de pagos) o saltamos a 1.5.
3. `git pull` para tener el estado más reciente del repo.
4. Verificar que el `.env` local sigue teniendo el `DATABASE_URL` público correcto (no se sube al repo, está en `.gitignore`).
