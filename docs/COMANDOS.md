# WebBot — Comandos y URLs útiles

> Referencia rápida para correr el proyecto solo. Para el detalle de decisiones y el estado de cada tarea, ver [`BITACORA.md`](./BITACORA.md). Para la arquitectura de 4 capas, ver [`WEBBOT_ARQUITECTURA.md`](./WEBBOT_ARQUITECTURA.md).

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

---

## 3. Tests

```bash
npm run test:unit          # Jest — domain + application, rápido, sin BD
npm run test:integration    # Jest — mocks de repos (crece cuando haya rutas API)
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
npx prisma studio                              # UI para explorar/editar la BD — recordá cerrarla (queda escuchando en un puerto)
npx prisma migrate dev --name <nombre>          # nueva migración en desarrollo
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
| `npm run test:unit` | `Test Suites: 7 passed`, `Tests: 22 passed` |
| `npm run test:e2e` | `3 scenarios (3 passed)`, `15 steps (15 passed)` |
