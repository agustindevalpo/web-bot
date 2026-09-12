# WebBot

**Devalpo 2026 · fábrica interna de sitios web**

Herramienta de producción de Devalpo: un visitante conversa con un bot, deja su nombre y
correo, y ve su sitio de ejemplo al instante. Si paga, Devalpo lo publica en producción
con su propio dominio en un día hábil. Pago único, sin mensualidades.

No es un SaaS que se vende solo: es la fábrica que hace rentable una promesa que Devalpo
ya vendía a mano.

---

## Dónde está cada cosa

Este README es solo la puerta de entrada. No duplica contenido, porque el contenido
duplicado se desactualiza.

| Pregunta | Documento |
|---|---|
| ¿Qué **es** WebBot hoy? Stack, arquitectura, qué está en producción, cómo correrlo | [`docs/ESTADO.md`](docs/ESTADO.md) |
| ¿**Por qué** está construido así? Decisiones vigentes con su evidencia | [`docs/DECISIONES.md`](docs/DECISIONES.md) |
| ¿Qué **pasó**? Registro cronológico del desarrollo | [`docs/BITACORA.md`](docs/BITACORA.md) |
| Comandos de uso diario | [`docs/COMANDOS.md`](docs/COMANDOS.md) |
| Dominios propios · Panel interno | [`docs/DOMINIO_PROPIO.md`](docs/DOMINIO_PROPIO.md) · [`docs/PANEL_INTERNO.md`](docs/PANEL_INTERNO.md) |

La **fuente de verdad** son los artefactos SDD en Engram (proyecto `web-bot`). Los
archivos `.md` de `docs/` son un reflejo: si contradicen a Engram, gana Engram.

En [`docs/historico/`](docs/historico/) están el roadmap y el documento de arquitectura
originales de agosto de 2026. Describen un producto que ya no existe (suscripciones por
plan, N8N, Python, equipo de tres). Se conservan como registro de la intención inicial,
no como referencia.

## Arranque rápido

```bash
docker run -d --name webbot-pg -e POSTGRES_PASSWORD=webbot -e POSTGRES_USER=webbot \
  -e POSTGRES_DB=webbot -p 5433:5432 postgres:16-alpine

export DATABASE_URL="postgresql://webbot:webbot@localhost:5433/webbot"
npx prisma migrate deploy
npm run db:seed-demo   # obligatorio: sin el cliente demo, la captura de lead falla
npm run dev
```

Detalle completo y trampas conocidas en [`docs/ESTADO.md`](docs/ESTADO.md).

## Tests

```bash
npm run test:unit    # Jest
npm run test:e2e     # Cucumber + Playwright (requiere la app corriendo)
npm run test:all
```
