# WebBot

**Devalpo 2026 · SaaS de sitios web generados por IA**

WebBot genera sitios web para PyMEs chilenas a través de una conversación con un bot de IA. El cliente responde unas preguntas por chat y en minutos tiene su sitio online en un subdominio de Devalpo (o su propio dominio en el plan Pro), con cobro recurrente mensual gestionado automáticamente.

> La fuente de verdad del desarrollo (fases, tareas, responsables, criterios de "Done") está en [`docs/WEBBOT_ROADMAP.md`](docs/WEBBOT_ROADMAP.md). Este README es un resumen de alto nivel.

---

## Cómo funciona

```
Cliente entra a /chat
  → Bot (Claude) hace 8 preguntas, una a la vez
  → Al terminar, un segundo agente Claude extrae los datos a JSON estructurado
  → N8N dispara el template engine (Python)
  → Se elige uno de 5 templates según el rubro del negocio
  → Se buscan imágenes relevantes en Unsplash
  → Se escribe el sitio en PostgreSQL
  → subdominio.sitios.devalpo.cl queda online (sin build/deploy nuevo:
    el middleware de Next.js renderiza el sitio dinámicamente desde la BD)
```

Target de flujo completo: **menos de 3 minutos** desde la última respuesta del cliente hasta el sitio online.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend / Chat UI | Next.js 14 (App Router) |
| Backend API | Next.js API Routes + Python (FastAPI) |
| Base de datos | PostgreSQL (Railway) + Prisma |
| Orquestación | N8N |
| IA | Claude Sonnet API (2 agentes encadenados: onboarding + extractor) |
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
│   │   ├── sites/               # CRUD de sitios
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
│   └── schema.prisma            # Esquema de BD
└── .env.example                 # Variables de entorno requeridas
```

---

## Variables de entorno

Ver `.env.example`. Se necesitan keys para: Claude API, PostgreSQL, motor de pagos (Flow, MercadoPago, PayPal), Unsplash, Railway API y N8N.

---

## Roadmap de desarrollo (4 fases, 28 días)

| Fase | Objetivo | Días |
|------|----------|------|
| 1 — Fundaciones | Infraestructura lista: Railway, DNS wildcard, schema Postgres, webhook de pagos, middleware multitenant, secrets, CI/CD | 1–10 |
| 2 — Bot & IA | Chat UI, agentes Claude (onboarding + extracción), endpoint `/api/chat`, workflow N8N, tests con 10 rubros reales | 8–14 |
| 3 — Templates & Deploy | 5 templates de sitio, template engine Python, asset builder, deploy automático, dominio propio, panel admin básico, test end-to-end | 15–21 |
| 4 — Integración & Lanzamiento | Panel admin completo, ciclo de pagos en producción, notificaciones, landing pública, QA con 5 clientes beta, lanzamiento | 22–28 |

Cada tarea del roadmap tiene responsable, prioridad y un criterio de **Done** explícito. Regla de trabajo: una tarea a la vez, sin avanzar a la siguiente sin cerrar el Done de la actual.

### Equipo

- **Matías** — infraestructura, Next.js, templates, deploy
- **Daniel** — base de datos, pagos, agentes Claude, template engine
- **Agus** — secrets, N8N, tests, QA, lanzamiento

---

## Planes

| Plan | Precio | Incluye |
|------|--------|---------|
| Starter | $19.990 CLP/mes | Subdominio devalpo |
| Pro | $39.990 CLP/mes | Dominio propio |
| Agencia | $99.990 CLP/mes | Hasta 10 sitios |

---

*Owner: Agustín Romero · Devalpo*
