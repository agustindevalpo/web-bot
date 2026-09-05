# Panel interno (`/admin`)

Panel mínimo para que el equipo de Devalpo gestione los sitios de clientes sin
entrar a la base de datos. Vive en la misma app Next.js, bajo `/admin`, y solo
responde en el dominio de la app (`webbot.devalpo.cl`, `localhost` o
`*.up.railway.app`); `src/proxy.ts` deja pasar esas rutas sin reescribirlas.

## Qué permite hacer

| Pantalla | Qué hace |
|---|---|
| `/admin/login` | Ingreso con la contraseña compartida del equipo. |
| `/admin` | Lista todos los sitios (nombre, subdominio con link de vista previa, template, estado, dominio propio, fecha) y permite cerrar sesión. |
| `/admin/sitios/[id]` | Gestiona un sitio: **pausar/reactivar**, **asignar o quitar dominio propio** (con registro en Cloudflare si está configurado) y **editar el contenido** (`configJson`) como JSON. |

Toda la lógica de negocio está en use cases de `src/application/use-cases/`
(`ListarSitios`, `CambiarEstadoSitio`, `AsignarDominioPropio`,
`ActualizarConfigSitio`); las páginas solo llaman a esos use cases desde
Server Actions.

## Variables de entorno

Agregar estas líneas a `.env.example` y configurarlas en Railway
(`railway variables set ...`):

```dotenv
# Panel interno (/admin) — contraseña compartida del equipo. Sin esta variable el login responde 503.
ADMIN_SECRET=

# Cloudflare for SaaS — dominios propios de clientes. Con ambas, el panel registra
# el custom hostname automáticamente; sin ellas, el dominio solo se guarda en la base.
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

| Variable | Descripción |
|---|---|
| `ADMIN_SECRET` | Contraseña del panel. Se compara en tiempo constante; usa un valor largo y aleatorio (`openssl rand -base64 32`). |
| `CLOUDFLARE_API_TOKEN` | Token de API con permiso `SSL and Certificates: Edit` sobre la zona. Nunca se loguea ni se muestra en el panel. |
| `CLOUDFLARE_ZONE_ID` | ID de la zona de Cloudflare donde viven los custom hostnames (la zona de `devalpo.cl`). |

La sesión del panel reutiliza `AUTH_SECRET` (ya existente) para firmar su
propio JWT; no hace falta otra clave.

## Cómo ingresar

1. Abre `https://webbot.devalpo.cl/admin/login` (en local, `http://localhost:3000/admin/login`).
2. Ingresa la contraseña configurada en `ADMIN_SECRET` y haz clic en **Ingresar**.
3. La sesión dura 12 horas y se guarda en la cookie `webbot_admin` (httpOnly,
   `SameSite=Lax`, `Secure` en producción). Es independiente de la sesión de
   clientes (`webbot_auth`): un cliente logueado no puede ver `/admin`.
4. **Cerrar sesión** borra la cookie y vuelve al login.

Protecciones del login (`/api/admin/login`):

- Máximo 5 intentos cada 15 minutos por IP (limitador en memoria, mismo patrón
  que el login de clientes).
- Respuesta genérica `401` ante contraseña incorrecta; `503` si `ADMIN_SECRET`
  no está configurada.

## Flujo de dominio propio

El detalle de DNS, Cloudflare for SaaS y el dominio de destino
`dominios.devalpo.cl` está en `docs/DOMINIO_PROPIO.md`. Lo que hace el panel:

1. Normaliza lo que se escribe (minúsculas, sin `http(s)://`, sin puerto ni
   rutas) y valida que sea un hostname real con al menos un punto.
2. Rechaza dominios de Devalpo (`devalpo.cl` y cualquier subdominio) y
   dominios ya asignados a otro sitio.
3. Guarda el dominio en el sitio (`dominioPropio`).
4. Llama a `ICustomHostnameService.asegurarHostname(dominio)`:
   - Con Cloudflare configurado: `POST /zones/{zone}/custom_hostnames` con
     validación SSL `http`/`dv`. Si el hostname ya existía, lo busca y devuelve
     `existente`. Cualquier otro fallo se muestra como `error` con un detalle
     corto, sin tirar la operación (el dominio ya quedó guardado).
   - Sin Cloudflare: devuelve `no_configurado` y el panel lo indica.
5. Muestra el estado del hostname y del SSL, más las instrucciones DNS que hay
   que pasarle al cliente:
   - `www` → `CNAME` a `dominios.devalpo.cl`.
   - Raíz (apex): `CNAME`/`ALIAS` con flattening si el proveedor DNS lo
     soporta; si no, usar solo `www` y redirigir la raíz.

**Quitar dominio** deja `dominioPropio` en `null` y, como mejor esfuerzo,
elimina el custom hostname en Cloudflare (si falla, el dominio igual queda
desvinculado en nuestra base).

## Edición de contenido

El textarea muestra `configJson` formateado. Al guardar se valida que sea un
objeto JSON con un campo `nombre` de texto no vacío; cualquier otro error
(sintaxis, array, falta `nombre`) se muestra en pantalla y no toca la base.
El contenido reemplaza el anterior completo, así que conviene editar sobre lo
que ya está en el textarea.
