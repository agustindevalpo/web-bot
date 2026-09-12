# WebBot — Comandos y URLs útiles

> Referencia rápida para correr el proyecto solo. Para el detalle de decisiones y el estado de cada tarea, ver [`BITACORA.md`](./BITACORA.md). Para la arquitectura vigente, ver [`ESTADO.md`](./ESTADO.md); para el porqué de cada decisión, [`DECISIONES.md`](./DECISIONES.md).

---

## 0. Si PowerShell bloquea `npx`/`npm`

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Alternativa sin tocar la política, comando por comando: `npx.cmd ...` / `npm.cmd ...`. O correr todo desde Git Bash, que no tiene esta restricción.

---

## 1. Setup inicial (clonar de cero)

```bash
git clone https://github.com/agustindevalpo/web-bot.git
cd web-bot
npm install
```

Crear `.env` en la raíz (gitignored) con al menos:

```bash
DATABASE_URL=postgresql://...   # ver "Base de datos" más abajo para conseguir la URL real
NEXT_PUBLIC_BASE_DOMAIN=sitios.devalpo.cl
```

`npm install` corre `prisma generate` solo (hook `postinstall`).

---

## 2. Desarrollo día a día

```bash
npm run dev              # levanta Next.js en http://localhost:3000
npx tsc --noEmit          # type-check sin emitir archivos
npm run build             # build de producción (falla si hay errores de tipos)
npm run lint               # eslint
```

**Sandbox de pagos** (ver `docs/DECISIONES.md` D-22): `npm run dev:sandbox` levanta un
Postgres propio (contenedor `webbot-pg-sandbox`, puerto 5435, distinto del de la receta
de abajo), migra, siembra el cliente demo y arranca `next dev` ya apuntado al link de
**pruebas** de Mercado Pago (`NEXT_PUBLIC_PAGOS_MODO=prueba`). Para pagar ahí hay que
estar logueado en Mercado Pago como **comprador de prueba**, en una ventana de
incógnito — nunca con la cuenta real de Devalpo. Tarjetas de prueba: más abajo, y la
misma tabla en la guía Word, Parte
C2. `npm run dev:sandbox -- --down` baja y elimina el contenedor.

### Tarjetas de prueba de Mercado Pago (Chile)

> **Los rechazos forzados NO funcionan hoy. Probado el 2026-09-12: con `FUND` en el
> nombre del titular, el pago se aprobó igual.** Mercado Pago cambió cómo se fuerza el
> estado y su documentación no se pudo consultar (devuelve 403). La tabla de abajo queda
> como referencia histórica, **no como instrucción**. Antes de volver a usarla hay que
> verificar el método actual contra la documentación oficial de Mercado Pago para
> Checkout Pro — que es un producto distinto de Checkout API y Bricks, y no
> necesariamente se comporta igual.
>
> Lo que **sí** está verificado: `APRO` aprueba, y todo el flujo sandbox funciona de punta
> a punta hasta `/congrats/approved/`.

Método histórico (el resultado lo decidía el nombre del titular, no el número de tarjeta):

| Titular | Resultado esperado | Estado |
|---|---|---|
| `APRO` | Aprobado | verificado el 2026-09-12 |
| `OTHE` | Rechazado por error general | sin verificar |
| `FUND` | Rechazado por fondos insuficientes | **NO funciona: aprobó igual** |

Datos de la tarjeta, iguales en todos los casos:

| Campo | Valor |
|---|---|
| Mastercard | `5416 7526 0258 2580` |
| Visa | `4168 8188 4444 7115` |
| CVV | `123` |
| Vencimiento | `11/30` |
| RUT | cualquiera, por ejemplo `12345678` |
| Correo | el del comprador de prueba |

Ver los rechazos seguiría valiendo la pena cuando se pueda: muestran lo que ve un cliente
cuando la tarjeta rebota, que con pymes pasa seguido (tope, débito sin fondos), y eso
cambia el mensaje de seguimiento por WhatsApp. Esa pantalla es de Mercado Pago y no se
puede reemplazar. No es urgente: el lead ya queda capturado **antes** del pago, así que a
quien no pudo pagar se lo puede contactar igual — esa era la pérdida cara y ya está
resuelta.

> **Si Mercado Pago corta con "Una de las partes con la que intentas hacer el pago es de
> prueba"** (la URL termina en `/fatal/`): las dos partes tienen que ser de prueba, y la
> que falta es la cuenta. Abrir una ventana de incógnito **nueva** y **loguearse ahí como
> comprador de prueba** antes de pegar el link. Incógnito por sí solo no alcanza: sin
> sesión, Mercado Pago toma la visita como invitado y da el mismo error. Verificado el
> 2026-09-12: con el comprador de prueba logueado, el flujo termina en
> `/congrats/approved/`.
>
> Ese mensaje no dice cuál de las dos partes es la de prueba. Para saber en qué ambiente
> se está, comparar el `preference-id` de la barra de direcciones con la constante del
> link sandbox en `scripts/dev-sandbox.mjs`: si coinciden, es el sandbox. **El dominio no
> sirve como pista** — Mercado Pago sirve producción y pruebas desde `www.mercadopago.cl`,
> y la URL se transforma durante el flujo (`pref_id` pasa a `preference-id`, cambia el
> path), así que deja de parecerse al link original sin haber cambiado de ambiente.

Regla del par de variables: `NEXT_PUBLIC_PAGOS_MODO` declara la intención
(`produccion` / `prueba`); `NEXT_PUBLIC_MERCADOPAGO_LINK_URL` es la evidencia (a qué
apunta de verdad). El CTA de la demo contrasta ambas — si no coinciden, avisa más
fuerte que si solo faltara la declaración (ver D-22).

---

## 3. Tests

```bash
npm run test:unit          # Jest — domain + application, rápido, sin BD
npm run test:coverage       # Jest con reporte de cobertura
npm run test:watch          # Jest en modo watch (solo unit)

npx playwright install chromium   # una sola vez, para los tests e2e

# e2e: necesita `npm run dev` corriendo en otra terminal (usa tu Postgres real)
npm run test:e2e

npm run test:all            # jest completo + cucumber-js
```

El feature e2e (`tests/e2e/features/sitio_por_subdominio.feature`) crea y borra un `Cliente`+`Sitio` de prueba (`e2e-activo`, `e2e-pausado`) en la BD real — no deja datos huérfanos si corre completo.

---

## 4. Prisma

```bash
npx prisma generate                          # regenera el cliente (schema en src/infrastructure/db/prisma/schema.prisma)
npx prisma studio                              # UI para explorar/editar la BD — recuerde cerrarla (queda escuchando en un puerto)
# NO usar `prisma migrate dev` en este proyecto (ver DECISIONES.md D-17): exige shadow
# database y no hay staging. Para una migración nueva:
#   1) npx prisma migrate diff --script ...   # previsualizar, solo lectura
#   2) escribir prisma/migrations/<ts>_<nombre>/migration.sql a mano
#   3) npx prisma migrate deploy               # aplicar
npx prisma migrate deploy                       # aplica migraciones pendientes (producción/CI)
```

---

## 5. Railway CLI

```bash
railway login              # una vez por máquina
railway link                # conecta esta carpeta al proyecto Railway (refreshing-communication)
railway variables            # ver variables reales del servicio (más confiable que la UI del dashboard)
railway logs                  # logs del servicio activo
railway deployment list        # historial de deploys
railway open                    # abre el dashboard del proyecto en el navegador
```

> El túnel SSH (`railway connect Postgres --tunnel-only`) **no funciona en Windows** en esta máquina (ver `BITACORA.md`, Tarea 1.3). La conexión local usa Public Access de Postgres + `DATABASE_URL` pública en `.env`.

---

## 6. Git — flujo de ramas del proyecto

```bash
git checkout develop && git pull
git checkout -b feature/tarea-x
# ... trabajo ...
git push -u origin feature/tarea-x
# merge feature/tarea-x → develop → main (main = deploy real, Railway solo escucha ahí)
```

---

## 7. URLs del proyecto

| Qué | URL |
|---|---|
| Repo GitHub | https://github.com/agustindevalpo/web-bot.git |
| Servicio Next.js en producción | https://web-bot-production-d190.up.railway.app |
| Subdominio de prueba (multitenant) | https://test.sitios.devalpo.cl |
| Dashboard Railway | https://railway.app (proyecto: `refreshing-communication`) |
| DNS de `devalpo.cl` | Zone Editor de cPanel en Bluehost (**no** en NIC.cl, que solo es el registrador) |
| Motor de pagos (repo privado, org con OAuth restrictions) | https://github.com/Devalpo/DeValpo.PaymentEngine.git |

---

## 8. Resultado esperado si todo está bien

| Comando | Esperado |
|---|---|
| `npx tsc --noEmit` | sin salida |
| `npm run build` | `✓ Compiled successfully` |
| `npm run lint` | `0 errors` (warnings en los servicios stub son normales) |
| `npm run test:unit` | `Test Suites: 52 passed`, `Tests: 541 passed` |
| `npm run test:e2e` | `3 scenarios (3 passed)`, `15 steps (15 passed)` |
