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
| `/admin/sitios/[id]` | Gestiona un sitio: **pausar/reactivar**, **confirmar el pago y activar al cliente**, **asignar o quitar dominio propio** (con registro en Cloudflare si está configurado) y **editar el contenido** (`configJson`) como JSON. |

Toda la lógica de negocio está en use cases de `src/application/use-cases/`
(`ListarSitios`, `CambiarEstadoSitio`, `ActivarCliente`, `ConfirmarPagoSitio`,
`AsignarDominioPropio`, `ActualizarConfigSitio`); las páginas solo llaman a
esos use cases desde Server Actions.

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

## Pago y activación (manual)

El cobro es un link de pago único de Mercado Pago (`MERCADOPAGO_LINK_URL`,
ver `docs/BITACORA.md`, sección WB-43). No hay webhook: el pago se confirma a
mano desde el panel. Los sitios generados en modo demo pertenecen todos a un
único cliente compartido hasta que alguien paga; confirmar el pago es también
el momento en que ese sitio pasa a ser del comprador real.

1. Verifica el pago en la cuenta de Mercado Pago (Actividad) y ubica al
   comprador por nombre o correo del pagador.
2. Abre el sitio en `/admin/sitios/[id]`. La sección **Pago y activación**
   muestra uno de tres estados:
   - **Sitio demo, sin comprador**: el sitio todavía es del cliente demo
     compartido. El formulario pide, además de monto y referencia,
     **Nombre del comprador** y **Email del comprador**.
   - **Cliente sin pago**: el sitio ya tiene un cliente real asignado (por
     ejemplo, de una sesión anterior). El formulario solo pide monto y
     referencia.
   - **Cliente activo**: ya se confirmó un pago antes; no se muestra
     formulario.
3. Completa **Monto pagado (CLP)** (viene precargado con el precio vigente de
   la landing) y, opcionalmente, **Referencia de Mercado Pago** (el número de
   operación, hasta 100 caracteres). En un sitio demo, completa también
   nombre y email del comprador tal como quedaron en Mercado Pago. Haz clic
   en **Confirmar pago y activar**.
4. Si el sitio era demo: el panel busca un cliente con ese email exacto
   (sin distinguir mayúsculas ni espacios); si no existe, crea uno nuevo. El
   sitio pasa a pertenecer a ese cliente. En cualquier caso, el cliente queda
   activo con fecha de pago y se registra un `Pago` `CONFIRMADO` con
   proveedor `MERCADOPAGO`. El mensaje de éxito indica si el comprador era un
   cliente nuevo ("Cliente creado: correo@ejemplo.cl"), uno ya existente
   ("Cliente vinculado: correo@ejemplo.cl") o si no hubo comprador que
   resolver ("Cliente activado", caso de un sitio ya no-demo).

Validaciones: el monto debe ser un entero positivo; una referencia más larga
que 100 caracteres se rechaza; en un sitio demo, nombre y email del comprador
son obligatorios y el email debe tener formato válido. El comprador nunca
puede terminar siendo el propio cliente demo compartido — si el email
coincide, la confirmación se rechaza. Confirmar el pago dos veces con el
mismo correo no crea un segundo cliente: reutiliza el mismo y registra un
segundo `Pago` (compra repetida legítima). Si el sitio apunta a un cliente
inexistente, la sección lo indica y no muestra el formulario. El sitio
conserva su subdominio de demo después de la reasignación; renombrarlo queda
fuera de este flujo.

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
