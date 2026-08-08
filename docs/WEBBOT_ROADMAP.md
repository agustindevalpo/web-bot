# WebBot — Roadmap Técnico de Desarrollo
**Devalpo 2026 · SaaS de sitios web generados por IA**

> Este documento es la fuente de verdad del desarrollo de WebBot.
> Trabaja tarea por tarea en orden. No avances a la siguiente sin completar el criterio de **Done**.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend / Chat UI | Next.js 14 (App Router) |
| Backend API | Next.js API Routes + Python (FastAPI) |
| Base de datos | PostgreSQL (Railway) |
| Orquestación | N8N (ya en Railway) |
| IA | Claude Sonnet API (3 agentes encadenados) |
| Deploy | Railway — multitenant, un solo servicio |
| DNS | Wildcard `*.sitios.devalpo.cl` |
| Pagos | Motor Devalpo (Flow + MercadoPago + PayPal) |
| Imágenes | Unsplash API |
| Dominio propio | CNAME → sitios.devalpo.cl (plan Pro) |

---

## Estructura del repositorio

```
webbot/
├── app/                        # Next.js App Router
│   ├── chat/                   # Interfaz de chat con el bot
│   ├── admin/                  # Panel de administración Devalpo
│   ├── api/
│   │   ├── chat/               # Endpoint principal del bot
│   │   ├── sites/              # CRUD de sitios
│   │   ├── webhooks/           # Recibe pagos y eventos
│   │   └── dns/                # Verificación de dominios
│   └── [site]/                 # Renderizado dinámico por subdominio
├── components/
│   ├── chat/                   # Componentes del chat
│   ├── admin/                  # Componentes del panel
│   └── templates/              # Los 5 templates de sitio
├── lib/
│   ├── db/                     # Conexión y queries PostgreSQL
│   ├── claude/                 # Wrappers del agente IA
│   └── n8n/                    # Triggers hacia N8N
├── python/
│   ├── template_engine.py      # JSON → archivos Next.js
│   ├── asset_builder.py        # Imágenes Unsplash
│   └── deploy_trigger.py       # Dispara deploy en Railway
├── middleware.ts                # Routing por subdominio
├── prisma/
│   └── schema.prisma           # Esquema de BD
└── .env.example                # Variables de entorno requeridas
```

---

## Variables de entorno requeridas

Crea `.env.local` con estas variables antes de empezar:

```bash
# IA
ANTHROPIC_API_KEY=

# Base de datos
DATABASE_URL=postgresql://...

# Pagos (motor Devalpo)
FLOW_API_KEY=
FLOW_SECRET_KEY=
MP_ACCESS_TOKEN=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Imágenes
UNSPLASH_ACCESS_KEY=

# Railway (para deploy programático)
RAILWAY_API_TOKEN=
RAILWAY_PROJECT_ID=

# App
NEXT_PUBLIC_BASE_DOMAIN=sitios.devalpo.cl
ADMIN_PASSWORD=
N8N_WEBHOOK_URL=
```

---

## FASE 1 — Fundaciones (Sem 1–2, Días 1–10)

**Objetivo:** Infraestructura completa lista para construir encima.
**Responsables:** Matías (infra/Next.js) · Daniel (BD/pagos) · Agus (secrets/N8N)

---

### Tarea 1.1 — Railway: crear proyecto y servicios

**Responsable:** Matías
**Días:** 1–2
**Prioridad:** 🔴 CRÍTICA

**Qué hacer:**
1. Crear proyecto en Railway llamado `webbot`
2. Agregar servicio **Next.js**: conectar repo GitHub `webbot`, rama `main`
3. Agregar servicio **PostgreSQL**: Railway lo provisiona automáticamente
4. Agregar servicio **Python** (FastAPI): para el template engine
5. Verificar que los 3 servicios levantan sin errores
6. Anotar las URLs internas de cada servicio

**Código de verificación:**
```bash
# Desde el servicio Next.js, debe responder:
curl https://webbot-production.up.railway.app
# → 200 OK

# Desde Railway dashboard, PostgreSQL debe mostrar:
# Status: Active
# Connection string: disponible en Variables
```

**Done cuando:** Los 3 servicios están en verde en Railway dashboard y Next.js responde con 200.

---

### Tarea 1.2 — Wildcard DNS + SSL

**Responsable:** Matías
**Días:** 2–3
**Prioridad:** 🔴 CRÍTICA
**Depende de:** 1.1

**Qué hacer:**
1. En el proveedor DNS de `devalpo.cl` (verificar cuál es — Bluehost o NIC Chile), agregar:
   ```
   Tipo: A
   Host: *.sitios
   Valor: IP del servicio Next.js en Railway
   TTL: 300
   ```
2. En Railway, en el servicio Next.js → Settings → Domains → agregar `*.sitios.devalpo.cl`
3. Railway genera SSL automático (puede tardar 10–30 min)
4. Probar con un subdominio de prueba:
   ```bash
   curl https://test.sitios.devalpo.cl
   # debe responder (aunque sea 404, confirma que el wildcard funciona)
   ```

**⚠️ Importante:** La propagación DNS puede tardar hasta 48h. Lanzar esta tarea el **Día 1 a primera hora** aunque el resto no esté listo.

**Done cuando:** `https://test.sitios.devalpo.cl` responde con HTTPS sin warnings de certificado.

---

### Tarea 1.3 — Esquema PostgreSQL con Prisma

**Responsable:** Daniel
**Días:** 2–3
**Prioridad:** 🔴 CRÍTICA

**Qué hacer:**
1. Instalar Prisma en el proyecto:
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```

2. Escribir el schema completo en `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Cliente {
  id           String    @id @default(cuid())
  email        String    @unique
  nombre       String
  telefono     String?
  plan         Plan      @default(STARTER)
  activo       Boolean   @default(false)
  fechaCreacion DateTime @default(now())
  fechaPago    DateTime?
  sitios       Sitio[]
  pagos        Pago[]
}

model Sitio {
  id            String   @id @default(cuid())
  clienteId     String
  cliente       Cliente  @relation(fields: [clienteId], references: [id])
  subdominio    String   @unique   // ej: panaderialtrigal
  dominioPropio String?  @unique   // ej: www.panaderialtrigal.cl
  template      Template
  configJson    Json                // datos completos del sitio
  activo        Boolean  @default(true)
  fechaCreacion DateTime @default(now())
  fechaUpdate   DateTime @updatedAt
}

model Pago {
  id         String      @id @default(cuid())
  clienteId  String
  cliente    Cliente     @relation(fields: [clienteId], references: [id])
  monto      Int                    // en CLP
  estado     EstadoPago
  proveedor  Proveedor
  referencia String?                // ID en el proveedor externo
  fecha      DateTime    @default(now())
}

model Sesion {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  historial   Json     @default("[]")  // array de mensajes
  datosJson   Json?                    // datos extraídos al completar
  completada  Boolean  @default(false)
  fechaCreacion DateTime @default(now())
}

enum Plan {
  STARTER   // $19.990 CLP/mes — subdominio devalpo
  PRO       // $39.990 CLP/mes — dominio propio
  AGENCIA   // $99.990 CLP/mes — hasta 10 sitios
}

enum Template {
  LANDING
  SERVICIOS
  PORTFOLIO
  RESTAURANTE
  TIENDA
}

enum EstadoPago {
  PENDIENTE
  CONFIRMADO
  FALLIDO
  REEMBOLSADO
}

enum Proveedor {
  FLOW
  MERCADOPAGO
  PAYPAL
  TRANSFERENCIA
}
```

3. Correr migración:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

**Done cuando:** `npx prisma studio` abre y muestra todas las tablas sin errores.

---

### Tarea 1.4 — Motor de pagos: completar suscripciones

**Responsable:** Daniel
**Días:** 3–5
**Prioridad:** 🔴 CRÍTICA

**Qué hacer:**
1. En el motor de pagos existente, verificar que Flow y MercadoPago soportan cobro recurrente mensual
2. Crear endpoint en Next.js que recibe el webhook de confirmación de pago:

```typescript
// app/api/webhooks/pagos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // El motor de pagos envía: { clienteId, monto, estado, proveedor, referencia }
  const { clienteId, monto, estado, proveedor, referencia } = body

  // Registrar el pago
  await prisma.pago.create({
    data: { clienteId, monto, estado, proveedor, referencia }
  })

  // Si pago confirmado → activar cliente
  if (estado === 'CONFIRMADO') {
    await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        activo: true,
        fechaPago: new Date()
      }
    })
  }

  // Si pago fallido → pausar cliente
  if (estado === 'FALLIDO') {
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { activo: false }
    })
    // Disparar notificación (tarea 4.3)
  }

  return NextResponse.json({ ok: true })
}
```

3. Probar con webhook simulado en sandbox de Flow y MercadoPago

**Done cuando:** Pago de prueba en sandbox activa `cliente.activo = true` en la BD correctamente.

---

### Tarea 1.5 — Middleware multitenant Next.js

**Responsable:** Matías
**Días:** 4–5
**Prioridad:** 🔴 CRÍTICA
**Depende de:** 1.1, 1.3

**Qué hacer:**
Crear `middleware.ts` en la raíz del proyecto:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
const APP_DOMAIN = 'webbot.devalpo.cl' // la landing del producto

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const { pathname } = req.nextUrl

  // Si es el dominio principal de la app → dejar pasar normal
  if (host === APP_DOMAIN || host.startsWith('localhost')) {
    return NextResponse.next()
  }

  // Si es un subdominio de clientes: cliente.sitios.devalpo.cl
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const subdominio = host.replace(`.${BASE_DOMAIN}`, '')

    // Reescribir internamente a /sites/[subdominio]
    const url = req.nextUrl.clone()
    url.pathname = `/sites/${subdominio}${pathname}`
    return NextResponse.rewrite(url)
  }

  // Si es un dominio propio de cliente (plan Pro): www.mipyme.cl
  // Next.js lo recibe porque Railway acepta el dominio custom
  // Buscar el subdominio asociado en BD (se hace en la página /sites/[subdominio])
  const url = req.nextUrl.clone()
  url.pathname = `/sites/custom/${host}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Crear la página que renderiza el sitio del cliente:

```typescript
// app/sites/[subdominio]/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { renderTemplate } from '@/components/templates'

export default async function SitioCliente({
  params
}: {
  params: { subdominio: string }
}) {
  const sitio = await prisma.sitio.findUnique({
    where: { subdominio: params.subdominio, activo: true }
  })

  if (!sitio) return notFound()

  return renderTemplate(sitio.template, sitio.configJson)
}
```

**Done cuando:** `test.sitios.devalpo.cl` sirve una respuesta desde Next.js (aunque sea un 404 con el layout de Devalpo).

---

### Tarea 1.6 — Variables de entorno y secrets

**Responsable:** Agus
**Días:** 1
**Prioridad:** 🟠 ALTA

**Qué hacer:**
1. Recopilar todas las API keys necesarias (ver lista arriba en "Variables de entorno")
2. Cargarlas en Railway → proyecto webbot → Variables
3. Copiar `.env.example` con los nombres (sin valores) al repo
4. Crear documento en Notion "WebBot — Secrets" con dónde encontrar cada key

**Done cuando:** Next.js levanta en Railway sin errores de variables faltantes.

---

### Tarea 1.7 — CI/CD básico

**Responsable:** Matías
**Días:** 5
**Prioridad:** 🟡 MEDIA

**Qué hacer:**
1. Railway ya hace auto-deploy desde `main` — verificar que está activado
2. Crear rama `develop` para trabajo en curso
3. Convención de ramas:
   - `feature/nombre-tarea` → merge a `develop`
   - `develop` → merge a `main` cuando la fase está completa
4. Agregar `.railwayignore` para excluir archivos innecesarios del deploy

**Done cuando:** Push a `main` dispara deploy automático visible en Railway en menos de 2 minutos.

---

### ✅ Checklist Fase 1

```
[ ] 1.1 — 3 servicios Railway en verde
[ ] 1.2 — *.sitios.devalpo.cl con HTTPS funcionando
[ ] 1.3 — Todas las tablas en PostgreSQL creadas
[ ] 1.4 — Webhook de pago activa/pausa cliente en BD
[ ] 1.5 — Middleware sirve rutas por subdominio
[ ] 1.6 — Todos los secrets cargados en Railway
[ ] 1.7 — CI/CD auto-deploy funcionando
```

**Criterio de paso a Fase 2:** Todos los ítems marcados. Sin excepciones.

---

## FASE 2 — Bot & IA (Sem 3–4, Días 8–14)

**Objetivo:** Bot conversacional completo que extrae datos correctos del cliente.
**Responsables:** Daniel (agentes Claude) · Matías (chat UI + API) · Agus (N8N + tests)

---

### Tarea 2.1 — Chat UI en Next.js

**Responsable:** Matías
**Días:** 8–9
**Prioridad:** 🔴 CRÍTICA

**Qué hacer:**
Crear la interfaz de chat en `app/chat/page.tsx`:

```typescript
// Componente principal — sin autenticación todavía
// Session ID por cookie para mantener historial
// Diseño: fondo navy (#080056), burbujas cyan para bot, gris para usuario
// Input en la parte inferior, botón enviar
// Mostrar indicador "escribiendo..." mientras espera Claude
```

Requisitos de diseño:
- Fondo `#080056` (navy Devalpo)
- Burbuja bot: fondo `#0D0080`, texto blanco
- Burbuja usuario: fondo `#5B46F8`, texto blanco
- Input: borde `#15DEFA`, fondo oscuro
- Fuente: Inter o similar (safe font)
- Responsive — funciona bien en móvil

**Done cuando:** UI visible en `/chat`, mensajes aparecen en burbujas, input funciona.

---

### Tarea 2.2 — Agente Claude: onboarding

**Responsable:** Daniel
**Días:** 8–10
**Prioridad:** 🔴 CRÍTICA

**Qué hacer:**
Crear `lib/claude/agente-onboarding.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `Eres el asistente de WebBot, un servicio de Devalpo que crea sitios web para negocios chilenos en minutos.

Tu trabajo es hacerle exactamente 8 preguntas al cliente para recopilar la información necesaria para crear su sitio web. Haz UNA pregunta a la vez y espera la respuesta antes de continuar.

PREGUNTAS EN ORDEN (no te saltes ninguna):
1. ¿Cómo se llama tu negocio?
2. ¿A qué se dedica? (describe brevemente qué hace o vende)
3. ¿Cuáles son tus principales productos o servicios? (menciona los 3 o 4 más importantes)
4. ¿En qué ciudad o zona opera tu negocio?
5. ¿Cuál es el teléfono de contacto y el email?
6. ¿Tienes redes sociales? (Instagram, Facebook — comparte los links o nombres de usuario)
7. ¿Qué estilo visual prefieres para tu sitio? (Elige: Moderno y minimalista / Cálido y cercano / Colorido y llamativo)
8. ¿Hay algo especial de tu negocio que quieras destacar? (un logro, diferenciador, frase especial)

TONO: amigable, directo, chileno. Nada de formalidades. Tutea al cliente.
Cuando hayas recibido las 8 respuestas, confirma con un mensaje de que ya tienes todo y que vas a crear su sitio.
NO hagas más de 8 preguntas. NO combines preguntas. NO des explicaciones largas.`

export async function procesarMensaje(
  historial: Array<{ role: 'user' | 'assistant'; content: string }>,
  mensajeUsuario: string
) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      ...historial,
      { role: 'user', content: mensajeUsuario }
    ]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
```

**Done cuando:** El bot hace las 8 preguntas en orden correcto, una por una, sin saltarse ninguna.

---

### Tarea 2.3 — Extracción JSON desde conversación

**Responsable:** Daniel
**Días:** 10–11
**Prioridad:** 🔴 CRÍTICA
**Depende de:** 2.2

**Qué hacer:**
Crear `lib/claude/agente-extractor.ts`:

```typescript
const EXTRACTION_PROMPT = `Analiza esta conversación y extrae los datos del negocio en formato JSON.
Devuelve SOLO el JSON, sin texto adicional, sin markdown, sin explicaciones.

FORMATO REQUERIDO:
{
  "nombre": "nombre exacto del negocio",
  "rubro": "categoría del negocio (panaderia|peluqueria|dentista|restaurante|consultora|taller|yoga|ferreteria|veterinaria|tienda|otro)",
  "descripcion": "descripción corta de 1-2 frases del negocio",
  "servicios": ["servicio 1", "servicio 2", "servicio 3"],
  "ciudad": "ciudad donde opera",
  "contacto": {
    "telefono": "número limpio sin espacios",
    "email": "email@ejemplo.cl"
  },
  "redes": {
    "instagram": "@usuario o null",
    "facebook": "url o nombre o null"
  },
  "estilo": "moderno|calido|colorido",
  "highlight": "frase o diferenciador especial del negocio"
}`

export async function extraerDatos(
  historialCompleto: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const conversacionTexto = historialCompleto
    .map(m => `${m.role === 'user' ? 'CLIENTE' : 'BOT'}: ${m.content}`)
    .join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `${EXTRACTION_PROMPT}\n\nCONVERSACIÓN:\n${conversacionTexto}`
    }]
  })

  const texto = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    return JSON.parse(texto)
  } catch {
    throw new Error('Error al parsear JSON extraído: ' + texto)
  }
}
```

**Tests obligatorios:** Probar extracción con estas 3 conversaciones simuladas:
- Panadería en Viña del Mar
- Peluquería en Santiago
- Dentista en Concepción

**Done cuando:** Los 3 tests generan JSON válido y completo sin campos nulos inesperados.

---

### Tarea 2.4 — API endpoint `/api/chat`

**Responsable:** Matías
**Días:** 9–10
**Prioridad:** 🟠 ALTA
**Depende de:** 2.2, 1.3

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { procesarMensaje } from '@/lib/claude/agente-onboarding'
import { extraerDatos } from '@/lib/claude/agente-extractor'
import { triggerGeneracion } from '@/lib/n8n'

export async function POST(req: NextRequest) {
  const { mensaje, sessionId } = await req.json()

  // Obtener o crear sesión
  let sesion = await prisma.sesion.findUnique({ where: { sessionId } })
  if (!sesion) {
    sesion = await prisma.sesion.create({
      data: { sessionId, historial: [] }
    })
  }

  const historial = sesion.historial as Array<{ role: 'user' | 'assistant'; content: string }>

  // Llamar al agente Claude
  const respuesta = await procesarMensaje(historial, mensaje)

  // Actualizar historial
  const nuevoHistorial = [
    ...historial,
    { role: 'user' as const, content: mensaje },
    { role: 'assistant' as const, content: respuesta }
  ]

  // Detectar si el bot confirmó que tiene las 8 preguntas
  // (Claude incluirá una frase clave al terminar)
  const conversacionCompleta = nuevoHistorial.length >= 16 // 8 pares pregunta-respuesta

  if (conversacionCompleta && !sesion.completada) {
    // Extraer datos estructurados
    const datosJson = await extraerDatos(nuevoHistorial)

    await prisma.sesion.update({
      where: { sessionId },
      data: {
        historial: nuevoHistorial,
        datosJson,
        completada: true
      }
    })

    // Disparar generación del sitio via N8N
    await triggerGeneracion(sessionId, datosJson)
  } else {
    await prisma.sesion.update({
      where: { sessionId },
      data: { historial: nuevoHistorial }
    })
  }

  return NextResponse.json({ respuesta, completada: conversacionCompleta })
}
```

**Done cuando:** Conversación completa de 8 preguntas se guarda correctamente en BD y dispara trigger.

---

### Tarea 2.5 — Workflow N8N orquestador

**Responsable:** Agus
**Días:** 9–12
**Prioridad:** 🟠 ALTA

**Qué hacer:**
Crear workflow en N8N con estos nodos:

```
Webhook (POST /webbot/generacion)
  → Recibe: { sessionId, datosJson }
  → Llama Python template engine (HTTP Request)
  → Si error: retry x3, luego notificar Slack
  → Si éxito: actualiza BD via API Next.js
  → Envía notificación al cliente (email + WhatsApp)
  → Registra en Google Sheets log de sitios generados
```

Variables en N8N:
- `NEXT_API_URL`: URL de la app en Railway
- `PYTHON_ENGINE_URL`: URL del servicio Python en Railway

**Done cuando:** Workflow ejecuta sin errores en 10 runs de prueba consecutivos.

---

### Tarea 2.6 — Tests con 10 rubros reales

**Responsable:** Agus
**Días:** 12–13
**Prioridad:** 🟠 ALTA

**Qué hacer:**
Simular conversaciones completas para estos 10 rubros y verificar que el JSON extraído es correcto:

```
1. Panadería artesanal — Viña del Mar
2. Peluquería — Santiago Centro
3. Dentista — Concepción
4. Restaurante de comida peruana — Las Condes
5. Consultora contable — Valparaíso
6. Taller mecánico — Quilpué
7. Centro de yoga — Providencia
8. Ferretería — San Antonio
9. Veterinaria — Ñuñoa
10. Tienda de ropa mujer — Mall online
```

Para cada uno, verificar:
- [ ] JSON completo sin campos nulos inesperados
- [ ] `rubro` clasificado correctamente
- [ ] `template` seleccionado corresponde al rubro
- [ ] `servicios` captura los mencionados por el cliente simulado

**Done cuando:** Los 10 rubros generan JSON válido. Documentar los 2-3 casos donde el bot tuvo problemas y ajustar el prompt.

---

### Tarea 2.7 — WhatsApp via N8N (opcional)

**Responsable:** Agus
**Días:** 13–14
**Prioridad:** 🟡 MEDIA
**Solo si hay tiempo al final de la semana 4**

**Qué hacer:**
Reutilizar la infraestructura del Robot Contador:
1. Agregar nodo WhatsApp en N8N que recibe mensajes entrantes
2. Enrutar al mismo endpoint `/api/chat` con el número de WhatsApp como `sessionId`
3. Devolver la respuesta de Claude al número del cliente

**Done cuando:** Conversación completa posible desde WhatsApp al mismo sistema backend.

---

### ✅ Checklist Fase 2

```
[ ] 2.1 — Chat UI funciona en /chat
[ ] 2.2 — Bot hace 8 preguntas en orden correcto
[ ] 2.3 — Extracción JSON válida para 10 rubros
[ ] 2.4 — API /api/chat guarda historial en BD
[ ] 2.5 — Workflow N8N orquesta el flujo completo
[ ] 2.6 — Tests con 10 rubros documentados
[ ] 2.7 — WhatsApp (opcional)
```

**Criterio de paso a Fase 3:** Tareas 2.1 a 2.6 completas. El bot extrae datos correctamente para al menos 8 de los 10 rubros.

---

## FASE 3 — Templates & Deploy (Sem 5–6, Días 15–21)

**Objetivo:** Primer sitio generado y deployado end-to-end sin intervención manual.
**Responsables:** Matías (templates + deploy) · Daniel (engine Python + assets) · Agus (test e2e)

---

### Tarea 3.1 — 5 templates Next.js base

**Responsable:** Matías
**Días:** 15–18
**Prioridad:** 🔴 CRÍTICA

**Qué hacer:**
Crear 5 templates en `components/templates/`. Cada template recibe el `configJson` y renderiza el sitio completo.

Estructura de cada template:
```
components/templates/
├── landing/          # PyMEs genéricas — cualquier negocio
│   └── index.tsx
├── servicios/        # Profesionales: dentistas, consultoras, yoga
│   └── index.tsx
├── portfolio/        # Creativos: diseño, fotografía, arquitectura
│   └── index.tsx
├── restaurante/      # Gastro: restoranes, cafeterías, deliveries
│   └── index.tsx
└── tienda/           # Retail: ropa, ferretería, tienda online
    └── index.tsx
```

Cada template debe incluir estas secciones:
- **Hero:** nombre del negocio + descripción corta + imagen de fondo
- **Quiénes somos / Sobre nosotros**
- **Servicios / Productos** (3-4 items con íconos)
- **Contacto:** teléfono, email, formulario simple
- **Footer:** redes sociales, dirección, copyright

Props que recibe cada template:
```typescript
interface SiteConfig {
  nombre: string
  descripcion: string
  servicios: string[]
  ciudad: string
  contacto: { telefono: string; email: string }
  redes: { instagram?: string; facebook?: string }
  estilo: 'moderno' | 'calido' | 'colorido'
  highlight: string
  imagenes: string[]   // URLs de Unsplash ya resueltas
}
```

**Done cuando:** Los 5 templates renderizan correctamente con datos hardcodeados de prueba. Se ven distintos entre sí.

---

### Tarea 3.2 — Template engine Python

**Responsable:** Daniel
**Días:** 15–17
**Prioridad:** 🔴 CRÍTICA
**Depende de:** 2.3, 3.1

**Qué hacer:**
Crear `python/template_engine.py`:

```python
import json
import requests
from typing import Literal

TEMPLATE_MAP = {
    'panaderia': 'restaurante',
    'restaurante': 'restaurante',
    'cafeteria': 'restaurante',
    'peluqueria': 'servicios',
    'dentista': 'servicios',
    'yoga': 'servicios',
    'consultora': 'servicios',
    'taller': 'servicios',
    'veterinaria': 'servicios',
    'ferreteria': 'tienda',
    'tienda': 'tienda',
    'portfolio': 'portfolio',
    'landing': 'landing',
}

def seleccionar_template(rubro: str) -> str:
    return TEMPLATE_MAP.get(rubro.lower(), 'landing')

def generar_subdominio(nombre: str) -> str:
    """Convierte 'Panadería El Trigal' → 'panaderiaeltrigal'"""
    import unicodedata, re
    nombre_norm = unicodedata.normalize('NFD', nombre)
    nombre_ascii = nombre_norm.encode('ascii', 'ignore').decode('ascii')
    subdominio = re.sub(r'[^a-z0-9]', '', nombre_ascii.lower())
    return subdominio[:30]  # máximo 30 chars

def procesar_sitio(datos_json: dict, imagenes: list[str]) -> dict:
    """
    Recibe el JSON del cliente y las imágenes de Unsplash.
    Devuelve la config final lista para guardar en BD y renderizar.
    """
    template = seleccionar_template(datos_json['rubro'])
    subdominio = generar_subdominio(datos_json['nombre'])

    config_sitio = {
        **datos_json,
        'template': template,
        'subdominio': subdominio,
        'imagenes': imagenes,
        'colores': obtener_colores(datos_json['estilo']),
    }

    return config_sitio

def obtener_colores(estilo: str) -> dict:
    paletas = {
        'moderno': { 'primario': '#1a1a2e', 'secundario': '#16213e', 'acento': '#0f3460', 'texto': '#ffffff' },
        'calido':  { 'primario': '#8B4513', 'secundario': '#D2691E', 'acento': '#FF8C00', 'texto': '#ffffff' },
        'colorido':{ 'primario': '#6C5CE7', 'secundario': '#a29bfe', 'acento': '#fd79a8', 'texto': '#ffffff' },
    }
    return paletas.get(estilo, paletas['moderno'])
```

**Done cuando:** Para cada uno de los 10 rubros del test 2.6, el engine devuelve un `config_sitio` válido y con el template correcto asignado.

---

### Tarea 3.3 — Asset builder: imágenes Unsplash

**Responsable:** Daniel
**Días:** 17–18
**Prioridad:** 🟠 ALTA

**Qué hacer:**
Crear `python/asset_builder.py`:

```python
import requests
import os

UNSPLASH_KEY = os.environ['UNSPLASH_ACCESS_KEY']

KEYWORDS_POR_RUBRO = {
    'panaderia':   'artisan bakery bread',
    'restaurante': 'restaurant food dining',
    'cafeteria':   'coffee cafe barista',
    'peluqueria':  'hair salon beauty',
    'dentista':    'dental clinic health',
    'yoga':        'yoga meditation wellness',
    'consultora':  'business office professional',
    'taller':      'mechanic workshop auto',
    'veterinaria': 'veterinary pets animals',
    'ferreteria':  'hardware tools construction',
    'tienda':      'retail store shopping',
    'portfolio':   'creative design studio',
}

def buscar_imagenes(rubro: str, cantidad: int = 4) -> list[str]:
    """
    Retorna lista de URLs de imágenes para el rubro.
    Cachear por rubro para no agotar el rate limit.
    """
    keywords = KEYWORDS_POR_RUBRO.get(rubro, 'business professional')

    resp = requests.get(
        'https://api.unsplash.com/search/photos',
        params={
            'query': keywords,
            'per_page': cantidad,
            'orientation': 'landscape',
            'content_filter': 'high'
        },
        headers={ 'Authorization': f'Client-ID {UNSPLASH_KEY}' }
    )

    if resp.status_code != 200:
        return []  # fallback: templates sin imágenes custom

    fotos = resp.json().get('results', [])
    return [f['urls']['regular'] for f in fotos]
```

**⚠️ Importante:** Cachear resultados por rubro en Redis o archivo JSON para no agotar el límite de 50 requests/hora del plan gratuito de Unsplash.

**Done cuando:** Para cada rubro de los 10 tests, se obtienen al menos 3 imágenes relevantes.

---

### Tarea 3.4 — Deploy automático Railway

**Responsable:** Matías
**Días:** 18–19
**Prioridad:** 🔴 CRÍTICA
**Depende de:** 1.2, 1.5, 3.2

**Qué hacer:**
La lógica de "deploy" en el modelo multitenant no es un deploy nuevo — es escribir en la BD y el sitio ya existe:

```typescript
// lib/deploy.ts
import { prisma } from '@/lib/db'

export async function deployarSitio(
  clienteId: string,
  configSitio: any
) {
  const { subdominio, template, ...resto } = configSitio

  // 1. Verificar que el subdominio no está tomado
  const existe = await prisma.sitio.findUnique({ where: { subdominio } })
  const subdominioFinal = existe
    ? `${subdominio}${Math.floor(Math.random() * 100)}`
    : subdominio

  // 2. Crear o actualizar el sitio en BD
  const sitio = await prisma.sitio.upsert({
    where: { subdominio: subdominioFinal },
    create: {
      clienteId,
      subdominio: subdominioFinal,
      template: template.toUpperCase(),
      configJson: configSitio,
      activo: true
    },
    update: {
      configJson: configSitio,
      activo: true
    }
  })

  // 3. El sitio ya está online — el middleware Next.js
  //    ya sabe cómo servirlo desde la BD
  const url = `https://${subdominioFinal}.sitios.devalpo.cl`

  return { sitio, url }
}
```

**Done cuando:** Después de crear un registro en BD, `subdominio.sitios.devalpo.cl` sirve el template correcto en menos de 30 segundos.

---

### Tarea 3.5 — CNAME + dominio propio (plan Pro)

**Responsable:** Matías
**Días:** 19–20
**Prioridad:** 🟠 ALTA

**Qué hacer:**
Crear endpoint de verificación de dominio propio:

```typescript
// app/api/dns/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { dominio, subdominioDevalpo } = await req.json()

  try {
    // Verificar que el CNAME apunta a sitios.devalpo.cl
    const { stdout } = await execAsync(`dig +short CNAME ${dominio}`)
    const cname = stdout.trim()

    if (cname.includes('sitios.devalpo.cl')) {
      // Activar el dominio propio en el sitio
      await prisma.sitio.update({
        where: { subdominio: subdominioDevalpo },
        data: { dominioPropio: dominio }
      })

      return NextResponse.json({ ok: true, mensaje: 'Dominio activado correctamente' })
    } else {
      return NextResponse.json({
        ok: false,
        mensaje: `El CNAME apunta a "${cname || 'ningún lugar'}". Debe apuntar a sitios.devalpo.cl`
      })
    }
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: 'Error verificando DNS' })
  }
}
```

**Instrucciones para el cliente (template WhatsApp/email):**
```
Para conectar tu dominio propio, sigue estos pasos:
1. Entra al panel donde compraste tu dominio
2. Busca la sección "DNS" o "Gestión de DNS"
3. Agrega este registro:
   Tipo: CNAME
   Host: www (o @)
   Valor: sitios.devalpo.cl
4. Guarda y espera hasta 24h para que propague
5. Avísanos cuando lo hayas hecho y verificamos
```

**Done cuando:** `www.dominiodeprueba.cl` con CNAME configurado sirve el sitio correcto.

---

### Tarea 3.6 — Panel básico de administración

**Responsable:** Matías
**Días:** 20–21
**Prioridad:** 🟠 ALTA

**Qué hacer:**
Crear `app/admin/page.tsx` protegido con password simple (no auth complejo todavía):

Columnas de la tabla:
| Cliente | Subdominio | Plan | Activo | Fecha creación | Pagos | Acciones |
|---------|-----------|------|--------|---------------|-------|---------|

Acciones por sitio:
- Ver sitio (link)
- Pausar / Activar
- Ver config JSON
- Regenerar sitio

**Done cuando:** Admin puede ver todos los sitios, su estado, y pausar/activar sin tocar la BD.

---

### Tarea 3.7 — Test end-to-end completo

**Responsable:** Agus + Daniel
**Días:** 21
**Prioridad:** 🔴 CRÍTICA

**Qué hacer:**
Recorrer el flujo completo para **3 rubros distintos**:

```
Flujo completo:
/chat → conversar con bot → completar 8 preguntas
→ Claude extrae JSON → N8N dispara engine Python
→ se asigna template → se buscan imágenes Unsplash
→ se escribe en BD → subdominio.sitios.devalpo.cl online
```

Para cada uno medir:
- [ ] Tiempo total desde última respuesta del cliente hasta sitio online
- [ ] Template asignado es el correcto para el rubro
- [ ] Imágenes son relevantes
- [ ] Todos los datos del JSON aparecen en el sitio

**Target:** Flujo completo < 3 minutos. Si supera ese tiempo, identificar el cuello de botella.

**Done cuando:** Los 3 rubros generan un sitio online correctamente en < 3 minutos.

---

### ✅ Checklist Fase 3

```
[ ] 3.1 — 5 templates renderizan correctamente
[ ] 3.2 — Template engine asigna template correcto para 10 rubros
[ ] 3.3 — Imágenes Unsplash relevantes por rubro
[ ] 3.4 — Sitio online en < 30 seg después de escribir en BD
[ ] 3.5 — CNAME + dominio propio verificado y funcionando
[ ] 3.6 — Panel admin muestra y gestiona todos los sitios
[ ] 3.7 — Test e2e completo < 3 min para 3 rubros
```

**Criterio de paso a Fase 4:** Tareas 3.1, 3.2, 3.4 y 3.7 completas. El flujo funciona de punta a punta sin intervención manual.

---

## FASE 4 — Integración & Lanzamiento (Sem 7–8, Días 22–28)

**Objetivo:** Producto live con primeros clientes pagando.
**Responsables:** Matías (admin + landing) · Daniel (pagos + fixes) · Agus (QA beta + lanzamiento)

---

### Tarea 4.1 — Panel admin completo

**Responsable:** Matías
**Días:** 22–24
**Prioridad:** 🟠 ALTA

**Funciones a agregar sobre 3.6:**
- Editar config JSON de un sitio (con preview)
- Cambiar plan de un cliente
- Ver historial de pagos por cliente
- Regenerar sitio desde panel (llama al engine Python)
- Buscar cliente por email o subdominio
- Exportar lista de clientes a CSV

**Done cuando:** Agus puede operar cualquier cliente desde el panel sin tocar la BD directamente.

---

### Tarea 4.2 — Integración pagos ↔ suscripción completa

**Responsable:** Daniel
**Días:** 22–24
**Prioridad:** 🔴 CRÍTICA
**Depende de:** 1.4

**Qué hacer:**
Completar el ciclo completo en producción (no solo sandbox):

```
Ciclos a probar:
1. Cliente nuevo paga → cuenta activada → accede al bot
2. Cliente paga mensual siguiente → sigue activo
3. Pago falla primer intento → reintento automático (Flow lo hace)
4. Pago falla definitivamente → sitio pausado + notificación
5. Cliente paga deuda → sitio reactivado automáticamente
6. Cliente cancela → sitio archivado en 30 días
```

**Done cuando:** Los 6 ciclos funcionan correctamente en ambiente de staging con tarjeta de prueba.

---

### Tarea 4.3 — Notificaciones al cliente

**Responsable:** Agus
**Días:** 23–25
**Prioridad:** 🟠 ALTA

**4 notificaciones en N8N:**

```
1. Bienvenida (cuando sitio generado):
   "¡Tu sitio ya está listo! Entra acá: [url]
   Si quieres cambiar algo, escríbeme aquí mismo."

2. Sitio listo (WhatsApp):
   "¡Hola [nombre]! Tu sitio [nombre negocio] ya está online 🎉
   Puedes verlo en: [url]
   ¿Quieres cambiar algo?"

3. Aviso vencimiento (3 días antes, email + WhatsApp):
   "Tu plan WebBot vence en 3 días.
   Para mantener tu sitio online, renueva aquí: [link pago]"

4. Pago fallido (email + WhatsApp):
   "Tuvimos un problema con tu pago.
   Tu sitio seguirá online por 48 horas más.
   Actualiza tu método de pago aquí: [link]"
```

**Done cuando:** Las 4 notificaciones llegan correctamente en pruebas reales (email propio + WhatsApp propio).

---

### Tarea 4.4 — Landing page WebBot

**Responsable:** Matías
**Días:** 24–25
**Prioridad:** 🟠 ALTA

**Qué hacer:**
Crear `app/page.tsx` (o subdominio `webbot.devalpo.cl`):

Secciones:
1. **Hero:** "Tu sitio web listo en 5 minutos" + botón "Crear mi sitio gratis"
2. **Cómo funciona:** 3 pasos (Conversa → Se genera → Queda online)
3. **Pricing:** 3 planes con los precios definidos
4. **FAQ:** 5 preguntas frecuentes (¿Puedo usar mi propio dominio? ¿Qué pasa si cancelo? etc.)
5. **CTA final:** botón grande → `/chat`

Botón "Crear mi sitio" → `/chat` (flujo de conversación)

**Done cuando:** Landing online, se ve bien en móvil y desktop, botón CTA lleva al chat.

---

### Tarea 4.5 — QA con 5 clientes beta

**Responsable:** Agus
**Días:** 25–26
**Prioridad:** 🔴 CRÍTICA

**Qué hacer:**
Reclutar 5 contactos reales. Perfiles sugeridos:
- 1 dueño de negocio gastro (café o restaurant)
- 1 profesional independiente (nutricionista, psicólogo, etc.)
- 1 comercio pequeño (tienda, peluquería)
- 1 artesano o emprendedor creativo
- 1 prestador de servicios (electricista, gasfiter)

**Instrucciones para el beta:**
"Entra a [URL], habla con el bot, y dime qué pasó. No te ayudo — quiero ver si funciona solo."

**Recopilar de cada uno:**
- [ ] ¿Completó el flujo sin ayuda? (sí/no)
- [ ] ¿El sitio se generó correctamente?
- [ ] ¿Qué preguntas del bot lo confundieron?
- [ ] ¿El sitio representa bien su negocio?
- [ ] ¿Pagaría por este servicio? ¿Cuánto?

**Done cuando:** Al menos 4 de 5 betas tienen su sitio online y responden "sí" a las primeras 4 preguntas.

---

### Tarea 4.6 — Fixes post-beta

**Responsable:** Matías + Daniel
**Días:** 26–27
**Prioridad:** 🔴 CRÍTICA

**Priorización de fixes:**
```
P0 (bloquea el flujo) → resolver antes de lanzar
P1 (degradan la experiencia) → resolver en semana 1 post-lanzamiento
P2 (mejoras menores) → backlog
```

**Regla:** No agregar features nuevas en esta etapa. Solo arreglar lo roto.

**Done cuando:** Cero bugs P0 abiertos.

---

### Tarea 4.7 — Lanzamiento público

**Responsable:** Agus
**Días:** 28
**Prioridad:** 🔴 CRÍTICA

**Checklist de lanzamiento:**

**Técnico (antes de publicar):**
- [ ] Landing online y funcionando
- [ ] Flujo de pago probado en producción (no sandbox)
- [ ] Monitoring básico activado (Railway metrics)
- [ ] Backup de BD configurado

**Comunicación:**
- [ ] Post LinkedIn: demo en video del bot generando un sitio en vivo (30-60 seg)
- [ ] Post Instagram: misma demo + precios
- [ ] Email a lista de contactos Devalpo (clientes anteriores, leads)
- [ ] Mensaje a red de Sercotec: "lanzamos WebBot, disponible para PyMEs de la región"

**Meta semana 1 post-lanzamiento:** 10 clientes activos pagando.

---

### ✅ Checklist Fase 4

```
[ ] 4.1 — Panel admin completo operativo
[ ] 4.2 — Ciclo de pagos completo funcionando en producción
[ ] 4.3 — Las 4 notificaciones llegan correctamente
[ ] 4.4 — Landing online y responsive
[ ] 4.5 — Al menos 4/5 betas completaron el flujo solos
[ ] 4.6 — Cero bugs P0 abiertos
[ ] 4.7 — Producto lanzado públicamente
```

---

## Reglas de trabajo con Claude Code

Cuando trabajas en una tarea, dile a Claude Code:

```
Estoy trabajando en la Tarea [X.X] del roadmap WebBot.
El objetivo es: [objetivo de la tarea]
El criterio de Done es: [criterio]
Stack: Next.js 14, TypeScript, Prisma, PostgreSQL, Railway
```

**Una tarea a la vez.** No abras otra hasta marcar el Done de la actual.

**Si algo bloquea**, escala este orden:
1. Googlear el error exacto (5 min)
2. Preguntar a Claude Code con el error completo
3. Avisar al equipo en WhatsApp

**Daily de 15 minutos todos los días:**
- ¿Qué completé ayer?
- ¿Qué hago hoy?
- ¿Algún bloqueante?

---

## Semáforo de estado

Actualiza este semáforo al terminar cada fase:

```
FASE 1 — Fundaciones      [ ] 🔴 pendiente
FASE 2 — Bot & IA          [ ] 🔴 pendiente
FASE 3 — Templates & Deploy [ ] 🔴 pendiente
FASE 4 — Lanzamiento       [ ] 🔴 pendiente
```

Cambia el emoji:
- 🔴 Pendiente
- 🟡 En progreso
- 🟢 Completa

---

*Última actualización: Agosto 2026 · Owner: Agustín Romero · Devalpo*
