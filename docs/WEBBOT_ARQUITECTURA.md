# WebBot — Arquitectura Base y Estrategia de Testing
**Devalpo 2026 · Documento para Claude Code**

> Pega este documento completo al inicio de una sesión de Claude Code.
> Claude Code debe leerlo entero antes de escribir una sola línea de código.
> Toda decisión técnica del proyecto debe respetar lo definido aquí.

---

## Contexto del producto

WebBot es un SaaS de Devalpo que genera sitios web completos mediante conversación con un bot de IA. El cliente responde 8 preguntas, Claude Sonnet analiza las respuestas, un motor Python selecciona el template correcto, y el sitio queda deployado en Railway en menos de 3 minutos.

**Stack:**
- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- Claude Sonnet API (Anthropic)
- N8N (orquestador de workflows, ya en Railway)
- Railway (deploy + hosting multitenant)
- Python 3.11 (template engine + asset builder)
- Motor de pagos Devalpo (Flow + MercadoPago + PayPal)

---

## Principio rector: Clean Architecture

El proyecto se organiza en 4 capas con una regla de dependencia estricta:

```
DOMINIO ← APLICACIÓN ← INFRAESTRUCTURA ← PRESENTACIÓN
```

**La regla:** cada capa solo puede importar desde capas más internas. El dominio no importa nada externo. La infraestructura implementa contratos definidos en el dominio.

```
src/
├── domain/           # Capa 1 — núcleo puro, sin dependencias externas
├── application/      # Capa 2 — orquesta use cases, depende solo de domain/
├── infrastructure/   # Capa 3 — implementaciones concretas de los contratos
└── presentation/     # Capa 4 — Next.js UI y API routes
```

---

## Estructura completa de carpetas

```
webbot/
│
├── src/
│   │
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Cliente.ts
│   │   │   ├── Sitio.ts
│   │   │   ├── Pago.ts
│   │   │   └── Sesion.ts
│   │   ├── value-objects/
│   │   │   ├── Plan.ts          # STARTER | PRO | AGENCIA
│   │   │   ├── Template.ts      # LANDING | SERVICIOS | PORTFOLIO | RESTAURANTE | TIENDA
│   │   │   ├── EstadoPago.ts    # PENDIENTE | CONFIRMADO | FALLIDO | REEMBOLSADO
│   │   │   ├── Proveedor.ts     # FLOW | MERCADOPAGO | PAYPAL | TRANSFERENCIA
│   │   │   └── Estilo.ts        # moderno | calido | colorido
│   │   ├── repositories/        # interfaces (contratos) — NO implementaciones
│   │   │   ├── IClienteRepository.ts
│   │   │   ├── ISitioRepository.ts
│   │   │   ├── IPagoRepository.ts
│   │   │   └── ISesionRepository.ts
│   │   └── exceptions/
│   │       ├── ClienteNoEncontradoException.ts
│   │       ├── SitioNoActivoException.ts
│   │       └── PagoInvalidoException.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── GenerarSitio.usecase.ts
│   │   │   ├── ActivarCliente.usecase.ts
│   │   │   ├── PausarSitio.usecase.ts
│   │   │   ├── ReactivarSitio.usecase.ts
│   │   │   └── VerificarDominio.usecase.ts
│   │   ├── services/            # interfaces de servicios externos
│   │   │   ├── IChatService.ts
│   │   │   ├── IDeployService.ts
│   │   │   ├── IPagoService.ts
│   │   │   ├── ITemplateService.ts
│   │   │   └── INotificacionService.ts
│   │   ├── dtos/
│   │   │   ├── SiteConfigDTO.ts
│   │   │   ├── ClienteDTO.ts
│   │   │   ├── PagoDTO.ts
│   │   │   └── MensajeDTO.ts
│   │   └── mappers/
│   │       ├── ClienteMapper.ts
│   │       └── SitioMapper.ts
│   │
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma
│   │   │   ├── repositories/    # implementaciones concretas con Prisma
│   │   │   │   ├── PrismaClienteRepository.ts
│   │   │   │   ├── PrismaSitioRepository.ts
│   │   │   │   ├── PrismaPagoRepository.ts
│   │   │   │   └── PrismaSesionRepository.ts
│   │   │   └── index.ts         # cliente Prisma singleton
│   │   ├── claude/
│   │   │   ├── ClaudeChatService.ts      # implements IChatService
│   │   │   ├── ClaudeExtractorService.ts
│   │   │   └── prompts/
│   │   │       ├── onboarding.prompt.ts
│   │   │       └── extractor.prompt.ts
│   │   ├── railway/
│   │   │   └── RailwayDeployService.ts   # implements IDeployService
│   │   ├── payments/
│   │   │   ├── FlowPagoService.ts        # implements IPagoService
│   │   │   ├── MercadoPagoPagoService.ts
│   │   │   └── PaypalPagoService.ts
│   │   ├── n8n/
│   │   │   └── N8NTriggerService.ts
│   │   ├── unsplash/
│   │   │   └── UnsplashAssetService.ts
│   │   ├── notifications/
│   │   │   └── WhatsAppNotificacionService.ts # implements INotificacionService
│   │   └── container.ts         # inyección de dependencias (DI manual o tsyringe)
│   │
│   └── presentation/
│       ├── app/                 # Next.js App Router
│       │   ├── chat/
│       │   │   └── page.tsx
│       │   ├── admin/
│       │   │   ├── page.tsx
│       │   │   └── layout.tsx
│       │   ├── api/
│       │   │   ├── chat/
│       │   │   │   └── route.ts
│       │   │   ├── webhooks/
│       │   │   │   └── pagos/
│       │   │   │       └── route.ts
│       │   │   ├── sites/
│       │   │   │   └── [subdominio]/
│       │   │   │       └── route.ts
│       │   │   └── dns/
│       │   │       └── verify/
│       │   │           └── route.ts
│       │   └── sites/
│       │       ├── [subdominio]/
│       │       │   └── page.tsx  # renderiza sitio por subdominio
│       │       └── custom/
│       │           └── [host]/
│       │               └── page.tsx # dominio propio (plan Pro)
│       ├── components/
│       │   ├── chat/
│       │   │   ├── ChatWindow.tsx
│       │   │   ├── MessageBubble.tsx
│       │   │   └── ChatInput.tsx
│       │   ├── admin/
│       │   │   ├── SitiosTable.tsx
│       │   │   └── ClienteCard.tsx
│       │   └── templates/
│       │       ├── index.ts           # renderTemplate(template, config)
│       │       ├── Landing.tsx
│       │       ├── Servicios.tsx
│       │       ├── Portfolio.tsx
│       │       ├── Restaurante.tsx
│       │       └── Tienda.tsx
│       └── middleware.ts              # routing multitenant por host
│
├── python/
│   ├── template_engine.py    # JSON → selecciona template + genera config
│   ├── asset_builder.py      # busca imágenes en Unsplash por rubro
│   └── deploy_trigger.py     # notifica a Next.js cuando el sitio está listo
│
└── tests/
    ├── unit/                 # Jest — domain + application, aislados
    │   ├── domain/
    │   │   ├── entities/
    │   │   └── value-objects/
    │   └── application/
    │       └── use-cases/
    ├── integration/          # Jest + mocks — comunicación entre capas
    │   ├── mocks/            # implementaciones mock de todas las interfaces
    │   │   ├── MockClienteRepository.ts
    │   │   ├── MockSitioRepository.ts
    │   │   ├── MockClaudeService.ts
    │   │   ├── MockDeployService.ts
    │   │   └── MockPagoService.ts
    │   └── api/              # Supertest contra los API routes
    │       ├── chat.test.ts
    │       ├── webhooks.test.ts
    │       └── sites.test.ts
    └── e2e/                  # Playwright + Cucumber BDD
        ├── features/         # archivos Gherkin .feature
        │   ├── generar_sitio.feature
        │   ├── suscripcion.feature
        │   └── pausa_sitio.feature
        └── steps/            # step definitions TypeScript
            ├── generar-sitio.steps.ts
            ├── suscripcion.steps.ts
            └── pausa-sitio.steps.ts
```

---

## Capa 1 — Dominio

### Entidades

Las entidades son clases TypeScript puras. No importan Prisma, Express, ni ninguna librería externa. Solo TypeScript nativo.

```typescript
// src/domain/entities/Cliente.ts
export class Cliente {
  constructor(
    public readonly id: string,
    public email: string,
    public nombre: string,
    public plan: Plan,
    public activo: boolean = false,
    public fechaPago: Date | null = null,
    public telefono?: string,
  ) {}

  activar(): void {
    this.activo = true
    this.fechaPago = new Date()
  }

  pausar(): void {
    this.activo = false
  }

  cambiarPlan(nuevoPlan: Plan): void {
    this.plan = nuevoPlan
  }

  estaActivo(): boolean {
    return this.activo
  }

  static crear(email: string, nombre: string, plan: Plan): Cliente {
    return new Cliente(crypto.randomUUID(), email, nombre, plan)
  }
}
```

```typescript
// src/domain/entities/Sitio.ts
export class Sitio {
  constructor(
    public readonly id: string,
    public clienteId: string,
    public subdominio: string,
    public template: Template,
    public configJson: SiteConfigDTO,
    public activo: boolean = true,
    public dominioPropio: string | null = null,
    public readonly fechaCreacion: Date = new Date(),
  ) {}

  pausar(): void {
    this.activo = false
  }

  reactivar(): void {
    this.activo = true
  }

  conectarDominio(dominio: string): void {
    this.dominioPropio = dominio
  }

  estaActivo(): boolean {
    return this.activo
  }
}
```

```typescript
// src/domain/entities/Sesion.ts
export class Sesion {
  public historial: MensajeDTO[] = []
  public datosJson: SiteConfigDTO | null = null
  public completada: boolean = false

  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly fechaCreacion: Date = new Date(),
  ) {}

  agregarMensaje(rol: 'user' | 'assistant', contenido: string): void {
    this.historial.push({ rol, contenido, timestamp: new Date() })
  }

  marcarCompletada(datos: SiteConfigDTO): void {
    this.datosJson = datos
    this.completada = true
  }

  cantidadIntercambios(): number {
    return Math.floor(this.historial.length / 2)
  }
}
```

### Interfaces de repositorios (contratos)

```typescript
// src/domain/repositories/IClienteRepository.ts
export interface IClienteRepository {
  findById(id: string): Promise<Cliente | null>
  findByEmail(email: string): Promise<Cliente | null>
  save(cliente: Cliente): Promise<Cliente>
  update(id: string, data: Partial<Cliente>): Promise<Cliente>
  delete(id: string): Promise<void>
  findAll(): Promise<Cliente[]>
}
```

```typescript
// src/domain/repositories/ISitioRepository.ts
export interface ISitioRepository {
  findBySubdominio(subdominio: string): Promise<Sitio | null>
  findByDominioPropio(dominio: string): Promise<Sitio | null>
  findByClienteId(clienteId: string): Promise<Sitio[]>
  save(sitio: Sitio): Promise<Sitio>
  update(id: string, data: Partial<Sitio>): Promise<Sitio>
  findAll(): Promise<Sitio[]>
}
```

```typescript
// src/domain/repositories/ISesionRepository.ts
export interface ISesionRepository {
  findBySessionId(sessionId: string): Promise<Sesion | null>
  save(sesion: Sesion): Promise<Sesion>
  update(sessionId: string, data: Partial<Sesion>): Promise<Sesion>
}
```

### Exceptions

```typescript
// src/domain/exceptions/ClienteNoEncontradoException.ts
export class ClienteNoEncontradoException extends Error {
  constructor(id: string) {
    super(`Cliente no encontrado: ${id}`)
    this.name = 'ClienteNoEncontradoException'
  }
}

// src/domain/exceptions/SitioNoActivoException.ts
export class SitioNoActivoException extends Error {
  constructor(subdominio: string) {
    super(`Sitio inactivo o no encontrado: ${subdominio}`)
    this.name = 'SitioNoActivoException'
  }
}
```

---

## Capa 2 — Aplicación

### Interfaces de servicios

La capa de aplicación define contratos para los servicios externos. Las implementaciones viven en infraestructura.

```typescript
// src/application/services/IChatService.ts
export interface IChatService {
  procesarMensaje(
    historial: MensajeDTO[],
    mensajeUsuario: string
  ): Promise<string>

  extraerDatos(
    historial: MensajeDTO[]
  ): Promise<SiteConfigDTO>

  conversacionCompleta(historial: MensajeDTO[]): boolean
}
```

```typescript
// src/application/services/IDeployService.ts
export interface IDeployService {
  deployarSitio(clienteId: string, config: SiteConfigDTO): Promise<{ url: string; sitioId: string }>
  pausarSitio(subdominio: string): Promise<void>
  reactivarSitio(subdominio: string): Promise<void>
  verificarDNS(dominio: string): Promise<boolean>
}
```

```typescript
// src/application/services/IPagoService.ts
export interface IPagoService {
  crearSuscripcion(clienteId: string, plan: Plan): Promise<{ url: string; suscripcionId: string }>
  procesarWebhook(payload: unknown): Promise<PagoDTO>
  cancelarSuscripcion(suscripcionId: string): Promise<void>
}
```

```typescript
// src/application/services/INotificacionService.ts
export interface INotificacionService {
  enviarBienvenida(cliente: Cliente, urlSitio: string): Promise<void>
  enviarSitioListo(cliente: Cliente, urlSitio: string): Promise<void>
  enviarAvisoVencimiento(cliente: Cliente, diasRestantes: number): Promise<void>
  enviarPagoFallido(cliente: Cliente, linkPago: string): Promise<void>
}
```

### DTOs

```typescript
// src/application/dtos/SiteConfigDTO.ts
export interface SiteConfigDTO {
  nombre: string
  rubro: string
  descripcion: string
  servicios: string[]
  ciudad: string
  contacto: {
    telefono: string
    email: string
  }
  redes: {
    instagram?: string
    facebook?: string
  }
  estilo: 'moderno' | 'calido' | 'colorido'
  highlight: string
  template?: string
  subdominio?: string
  imagenes?: string[]
  colores?: {
    primario: string
    secundario: string
    acento: string
    texto: string
  }
}
```

### Use Cases

```typescript
// src/application/use-cases/GenerarSitio.usecase.ts
export class GenerarSitioUseCase {
  constructor(
    private sesionRepo: ISesionRepository,
    private sitioRepo: ISitioRepository,
    private clienteRepo: IClienteRepository,
    private deployService: IDeployService,
    private notificacionService: INotificacionService,
  ) {}

  async execute(sessionId: string, clienteId: string): Promise<{ url: string }> {
    // 1. Obtener sesión completada
    const sesion = await this.sesionRepo.findBySessionId(sessionId)
    if (!sesion || !sesion.completada || !sesion.datosJson) {
      throw new Error('Sesión incompleta o datos no extraídos')
    }

    // 2. Deploy del sitio
    const { url } = await this.deployService.deployarSitio(clienteId, sesion.datosJson)

    // 3. Notificar al cliente
    const cliente = await this.clienteRepo.findById(clienteId)
    if (cliente) {
      await this.notificacionService.enviarSitioListo(cliente, url)
    }

    return { url }
  }
}
```

```typescript
// src/application/use-cases/ActivarCliente.usecase.ts
export class ActivarClienteUseCase {
  constructor(
    private clienteRepo: IClienteRepository,
    private pagoRepo: IPagoRepository,
    private notificacionService: INotificacionService,
  ) {}

  async execute(clienteId: string, monto: number, proveedor: Proveedor): Promise<void> {
    // 1. Obtener cliente
    const cliente = await this.clienteRepo.findById(clienteId)
    if (!cliente) throw new ClienteNoEncontradoException(clienteId)

    // 2. Activar
    cliente.activar()
    await this.clienteRepo.update(clienteId, {
      activo: true,
      fechaPago: cliente.fechaPago
    })

    // 3. Registrar pago
    await this.pagoRepo.save(
      new Pago(crypto.randomUUID(), clienteId, monto, EstadoPago.CONFIRMADO, proveedor)
    )
  }
}
```

```typescript
// src/application/use-cases/PausarSitio.usecase.ts
export class PausarSitioUseCase {
  constructor(
    private clienteRepo: IClienteRepository,
    private sitioRepo: ISitioRepository,
    private pagoRepo: IPagoRepository,
    private notificacionService: INotificacionService,
  ) {}

  async execute(clienteId: string): Promise<void> {
    // 1. Pausar cliente
    const cliente = await this.clienteRepo.findById(clienteId)
    if (!cliente) throw new ClienteNoEncontradoException(clienteId)
    cliente.pausar()
    await this.clienteRepo.update(clienteId, { activo: false })

    // 2. Pausar sus sitios
    const sitios = await this.sitioRepo.findByClienteId(clienteId)
    for (const sitio of sitios) {
      sitio.pausar()
      await this.sitioRepo.update(sitio.id, { activo: false })
    }

    // 3. Notificar
    const linkPago = `https://webbot.devalpo.cl/pagar/${clienteId}`
    await this.notificacionService.enviarPagoFallido(cliente, linkPago)
  }
}
```

---

## Capa 3 — Infraestructura

### Schema Prisma

```prisma
// src/infrastructure/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Cliente {
  id            String    @id @default(cuid())
  email         String    @unique
  nombre        String
  telefono      String?
  plan          Plan      @default(STARTER)
  activo        Boolean   @default(false)
  fechaCreacion DateTime  @default(now())
  fechaPago     DateTime?
  sitios        Sitio[]
  pagos         Pago[]
}

model Sitio {
  id            String    @id @default(cuid())
  clienteId     String
  cliente       Cliente   @relation(fields: [clienteId], references: [id])
  subdominio    String    @unique
  dominioPropio String?   @unique
  template      Template
  configJson    Json
  activo        Boolean   @default(true)
  fechaCreacion DateTime  @default(now())
  fechaUpdate   DateTime  @updatedAt
}

model Pago {
  id         String     @id @default(cuid())
  clienteId  String
  cliente    Cliente    @relation(fields: [clienteId], references: [id])
  monto      Int
  estado     EstadoPago
  proveedor  Proveedor
  referencia String?
  fecha      DateTime   @default(now())
}

model Sesion {
  id            String   @id @default(cuid())
  sessionId     String   @unique
  historial     Json     @default("[]")
  datosJson     Json?
  completada    Boolean  @default(false)
  fechaCreacion DateTime @default(now())
}

enum Plan {
  STARTER
  PRO
  AGENCIA
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

### Repositorios Prisma

```typescript
// src/infrastructure/db/repositories/PrismaClienteRepository.ts
import { prisma } from '../index'
import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { Cliente } from '@/domain/entities/Cliente'
import { ClienteMapper } from '@/application/mappers/ClienteMapper'

export class PrismaClienteRepository implements IClienteRepository {
  async findById(id: string): Promise<Cliente | null> {
    const raw = await prisma.cliente.findUnique({ where: { id } })
    return raw ? ClienteMapper.toDomain(raw) : null
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    const raw = await prisma.cliente.findUnique({ where: { email } })
    return raw ? ClienteMapper.toDomain(raw) : null
  }

  async save(cliente: Cliente): Promise<Cliente> {
    const raw = await prisma.cliente.create({
      data: ClienteMapper.toPrisma(cliente)
    })
    return ClienteMapper.toDomain(raw)
  }

  async update(id: string, data: Partial<Cliente>): Promise<Cliente> {
    const raw = await prisma.cliente.update({ where: { id }, data })
    return ClienteMapper.toDomain(raw)
  }

  async delete(id: string): Promise<void> {
    await prisma.cliente.delete({ where: { id } })
  }

  async findAll(): Promise<Cliente[]> {
    const raws = await prisma.cliente.findMany()
    return raws.map(ClienteMapper.toDomain)
  }
}
```

### Implementación Claude

```typescript
// src/infrastructure/claude/ClaudeChatService.ts
import Anthropic from '@anthropic-ai/sdk'
import { IChatService } from '@/application/services/IChatService'
import { ONBOARDING_PROMPT } from './prompts/onboarding.prompt'
import { EXTRACTOR_PROMPT } from './prompts/extractor.prompt'

export class ClaudeChatService implements IChatService {
  private client = new Anthropic()

  async procesarMensaje(historial: MensajeDTO[], mensajeUsuario: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: ONBOARDING_PROMPT,
      messages: [
        ...historial.map(m => ({ role: m.rol, content: m.contenido })),
        { role: 'user', content: mensajeUsuario }
      ]
    })
    return response.content[0].type === 'text' ? response.content[0].text : ''
  }

  async extraerDatos(historial: MensajeDTO[]): Promise<SiteConfigDTO> {
    const conversacion = historial
      .map(m => `${m.rol === 'user' ? 'CLIENTE' : 'BOT'}: ${m.contenido}`)
      .join('\n')

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `${EXTRACTOR_PROMPT}\n\nCONVERSACIÓN:\n${conversacion}`
      }]
    })

    const texto = response.content[0].type === 'text' ? response.content[0].text : '{}'
    return JSON.parse(texto) as SiteConfigDTO
  }

  conversacionCompleta(historial: MensajeDTO[]): boolean {
    return historial.filter(m => m.rol === 'user').length >= 8
  }
}
```

### Prompts Claude

```typescript
// src/infrastructure/claude/prompts/onboarding.prompt.ts
export const ONBOARDING_PROMPT = `
Eres el asistente de WebBot, servicio de Devalpo que crea sitios web para negocios chilenos.

Haz exactamente 8 preguntas al cliente, UNA a la vez, en este orden:
1. ¿Cómo se llama tu negocio?
2. ¿A qué se dedica? Descríbelo brevemente.
3. ¿Cuáles son tus 3 o 4 principales productos o servicios?
4. ¿En qué ciudad o zona opera tu negocio?
5. ¿Cuál es el teléfono de contacto y el email?
6. ¿Tienes redes sociales? (Instagram, Facebook)
7. ¿Qué estilo visual prefieres? Elige: Moderno y minimalista / Cálido y cercano / Colorido y llamativo
8. ¿Hay algo especial de tu negocio que quieras destacar?

REGLAS:
- Una sola pregunta por mensaje
- Tono amigable, directo, tutea al cliente
- No combines preguntas
- Al terminar las 8, di exactamente: "¡Perfecto! Ya tengo todo lo que necesito para crear tu sitio. En unos minutos estará listo."
`.trim()
```

```typescript
// src/infrastructure/claude/prompts/extractor.prompt.ts
export const EXTRACTOR_PROMPT = `
Analiza la conversación y extrae los datos del negocio.
Devuelve SOLO JSON válido, sin texto adicional, sin markdown, sin backticks.

FORMATO EXACTO:
{
  "nombre": "nombre del negocio",
  "rubro": "panaderia|peluqueria|dentista|restaurante|consultora|taller|yoga|ferreteria|veterinaria|tienda|portfolio|landing",
  "descripcion": "descripción de 1-2 frases",
  "servicios": ["servicio 1", "servicio 2", "servicio 3"],
  "ciudad": "ciudad",
  "contacto": { "telefono": "56912345678", "email": "email@ejemplo.cl" },
  "redes": { "instagram": "@usuario o null", "facebook": "url o null" },
  "estilo": "moderno|calido|colorido",
  "highlight": "diferenciador o frase especial"
}
`.trim()
```

### Inyección de dependencias

```typescript
// src/infrastructure/container.ts
// Composición de todas las dependencias — un solo lugar para cambiar implementaciones

import { PrismaClienteRepository } from './db/repositories/PrismaClienteRepository'
import { PrismaSitioRepository }   from './db/repositories/PrismaSitioRepository'
import { PrismaPagoRepository }    from './db/repositories/PrismaPagoRepository'
import { PrismaSesionRepository }  from './db/repositories/PrismaSesionRepository'
import { ClaudeChatService }       from './claude/ClaudeChatService'
import { RailwayDeployService }    from './railway/RailwayDeployService'
import { FlowPagoService }         from './payments/FlowPagoService'
import { WhatsAppNotificacionService } from './notifications/WhatsAppNotificacionService'

import { GenerarSitioUseCase }    from '@/application/use-cases/GenerarSitio.usecase'
import { ActivarClienteUseCase }  from '@/application/use-cases/ActivarCliente.usecase'
import { PausarSitioUseCase }     from '@/application/use-cases/PausarSitio.usecase'

// Repositorios
const clienteRepo      = new PrismaClienteRepository()
const sitioRepo        = new PrismaSitioRepository()
const pagoRepo         = new PrismaPagoRepository()
const sesionRepo       = new PrismaSesionRepository()

// Servicios externos
const chatService         = new ClaudeChatService()
const deployService       = new RailwayDeployService()
const pagoService         = new FlowPagoService()
const notificacionService = new WhatsAppNotificacionService()

// Use Cases (exportar para usar en API routes)
export const generarSitioUC   = new GenerarSitioUseCase(sesionRepo, sitioRepo, clienteRepo, deployService, notificacionService)
export const activarClienteUC = new ActivarClienteUseCase(clienteRepo, pagoRepo, notificacionService)
export const pausarSitioUC    = new PausarSitioUseCase(clienteRepo, sitioRepo, pagoRepo, notificacionService)

// Repos y servicios sueltos para controllers
export { clienteRepo, sitioRepo, sesionRepo, chatService }
```

---

## Capa 4 — Presentación

### Middleware multitenant

```typescript
// src/presentation/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
const APP_DOMAIN  = 'webbot.devalpo.cl'

export function middleware(req: NextRequest) {
  const host     = req.headers.get('host') || ''
  const pathname = req.nextUrl.pathname

  // Dominio principal de la app → pasar sin cambios
  if (host === APP_DOMAIN || host.includes('localhost') || host.includes('railway.app')) {
    return NextResponse.next()
  }

  // Subdominio de cliente: cliente.sitios.devalpo.cl
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const subdominio = host.replace(`.${BASE_DOMAIN}`, '')
    const url = req.nextUrl.clone()
    url.pathname = `/sites/${subdominio}${pathname}`
    return NextResponse.rewrite(url)
  }

  // Dominio propio (plan Pro): www.minegocio.cl
  const url = req.nextUrl.clone()
  url.pathname = `/sites/custom/${host}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

### API Route: chat

```typescript
// src/presentation/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatService, sesionRepo } from '@/infrastructure/container'
import { generarSitioUC } from '@/infrastructure/container'
import { Sesion } from '@/domain/entities/Sesion'

export async function POST(req: NextRequest) {
  try {
    const { mensaje, sessionId, clienteId } = await req.json()

    // Obtener o crear sesión
    let sesion = await sesionRepo.findBySessionId(sessionId)
    if (!sesion) {
      sesion = new Sesion(crypto.randomUUID(), sessionId)
      await sesionRepo.save(sesion)
    }

    // Si ya está completada, no procesar más
    if (sesion.completada) {
      return NextResponse.json({ respuesta: null, completada: true })
    }

    // Procesar mensaje con Claude
    const respuesta = await chatService.procesarMensaje(sesion.historial, mensaje)

    // Agregar al historial
    sesion.agregarMensaje('user', mensaje)
    sesion.agregarMensaje('assistant', respuesta)

    // Verificar si la conversación terminó
    if (chatService.conversacionCompleta(sesion.historial)) {
      const datosJson = await chatService.extraerDatos(sesion.historial)
      sesion.marcarCompletada(datosJson)
      await sesionRepo.update(sessionId, {
        historial: sesion.historial,
        datosJson,
        completada: true
      })

      // Disparar generación del sitio (async, no bloqueante)
      if (clienteId) {
        generarSitioUC.execute(sessionId, clienteId).catch(console.error)
      }

      return NextResponse.json({ respuesta, completada: true })
    }

    await sesionRepo.update(sessionId, { historial: sesion.historial })
    return NextResponse.json({ respuesta, completada: false })

  } catch (error) {
    console.error('Error en /api/chat:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

### API Route: webhook pagos

```typescript
// src/presentation/app/api/webhooks/pagos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { activarClienteUC, pausarSitioUC } from '@/infrastructure/container'

export async function POST(req: NextRequest) {
  try {
    const { clienteId, monto, estado, proveedor } = await req.json()

    if (estado === 'CONFIRMADO') {
      await activarClienteUC.execute(clienteId, monto, proveedor)
    }

    if (estado === 'FALLIDO') {
      await pausarSitioUC.execute(clienteId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error en webhook pagos:', error)
    return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
  }
}
```

---

## Estrategia de Testing

### Pirámide de tests

```
         /\
        /e2e\          ← Playwright + Cucumber (BDD) — pocos, lentos, reales
       /------\
      / integ  \       ← Jest + Supertest + Mocks — medios
     /----------\
    / unit tests  \    ← Jest — muchos, rápidos, aislados
   /--------------\
```

**Objetivo de cobertura:**
- `domain/` → 90%
- `application/use-cases/` → 85%
- `infrastructure/` → 60% (el resto lo cubren los e2e)
- `presentation/` → cubierto por e2e

---

### Tests unitarios — Jest

Testean entidades y use cases de forma completamente aislada. Sin BD, sin APIs, sin filesystem.

```typescript
// tests/unit/domain/entities/Cliente.test.ts
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'

describe('Cliente entity', () => {
  let cliente: Cliente

  beforeEach(() => {
    cliente = Cliente.crear('test@test.cl', 'Test Negocio', Plan.STARTER)
  })

  it('debe estar inactivo al crearse', () => {
    expect(cliente.activo).toBe(false)
    expect(cliente.fechaPago).toBeNull()
  })

  it('activar() pone activo=true y registra fechaPago', () => {
    cliente.activar()
    expect(cliente.activo).toBe(true)
    expect(cliente.fechaPago).toBeInstanceOf(Date)
  })

  it('pausar() pone activo=false', () => {
    cliente.activar()
    cliente.pausar()
    expect(cliente.activo).toBe(false)
  })

  it('estaActivo() refleja el estado correctamente', () => {
    expect(cliente.estaActivo()).toBe(false)
    cliente.activar()
    expect(cliente.estaActivo()).toBe(true)
  })
})
```

```typescript
// tests/unit/application/use-cases/ActivarCliente.test.ts
import { ActivarClienteUseCase } from '@/application/use-cases/ActivarCliente.usecase'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'
import { Proveedor } from '@/domain/value-objects/Proveedor'
import { ClienteNoEncontradoException } from '@/domain/exceptions/ClienteNoEncontradoException'

describe('ActivarCliente UseCase', () => {
  const clienteMock = Cliente.crear('a@b.cl', 'Test', Plan.PRO)

  const mockClienteRepo = {
    findById: jest.fn().mockResolvedValue(clienteMock),
    update:   jest.fn().mockResolvedValue(clienteMock),
    findByEmail: jest.fn(), save: jest.fn(), delete: jest.fn(), findAll: jest.fn()
  }

  const mockPagoRepo = {
    save: jest.fn().mockResolvedValue({}),
    findById: jest.fn(), findByClienteId: jest.fn(), update: jest.fn()
  }

  const mockNotifService = {
    enviarBienvenida:      jest.fn().mockResolvedValue(undefined),
    enviarSitioListo:      jest.fn().mockResolvedValue(undefined),
    enviarAvisoVencimiento: jest.fn().mockResolvedValue(undefined),
    enviarPagoFallido:     jest.fn().mockResolvedValue(undefined),
  }

  const useCase = new ActivarClienteUseCase(
    mockClienteRepo, mockPagoRepo, mockNotifService
  )

  beforeEach(() => jest.clearAllMocks())

  it('activa el cliente y registra el pago', async () => {
    await useCase.execute('cli-123', 39990, Proveedor.FLOW)

    expect(mockClienteRepo.findById).toHaveBeenCalledWith('cli-123')
    expect(mockClienteRepo.update).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ activo: true })
    )
    expect(mockPagoRepo.save).toHaveBeenCalledOnce()
  })

  it('lanza excepción si el cliente no existe', async () => {
    mockClienteRepo.findById.mockResolvedValueOnce(null)
    await expect(useCase.execute('no-existe', 0, Proveedor.FLOW))
      .rejects.toThrow(ClienteNoEncontradoException)
  })
})
```

---

### Tests de integración — Jest + Mocks + Supertest

Testean la comunicación entre capas con mocks de las implementaciones concretas.

```typescript
// tests/integration/mocks/MockClienteRepository.ts
import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'

export class MockClienteRepository implements IClienteRepository {
  private store: Map<string, Cliente> = new Map()

  constructor(seedData: Cliente[] = []) {
    seedData.forEach(c => this.store.set(c.id, c))
  }

  async findById(id: string) { return this.store.get(id) ?? null }
  async findByEmail(email: string) {
    return [...this.store.values()].find(c => c.email === email) ?? null
  }
  async save(cliente: Cliente) { this.store.set(cliente.id, cliente); return cliente }
  async update(id: string, data: Partial<Cliente>) {
    const c = this.store.get(id)
    if (!c) throw new Error('Not found')
    Object.assign(c, data)
    return c
  }
  async delete(id: string) { this.store.delete(id) }
  async findAll() { return [...this.store.values()] }
}
```

```typescript
// tests/integration/api/chat.test.ts
import request from 'supertest'
import { createServer } from '@/presentation/server' // helper que crea la app Next.js para tests

jest.mock('@/infrastructure/container', () => ({
  chatService: {
    procesarMensaje: jest.fn().mockResolvedValue('¿Cómo se llama tu negocio?'),
    extraerDatos:    jest.fn(),
    conversacionCompleta: jest.fn().mockReturnValue(false),
  },
  sesionRepo: {
    findBySessionId: jest.fn().mockResolvedValue(null),
    save:   jest.fn().mockImplementation(s => s),
    update: jest.fn().mockImplementation((_, d) => d),
  },
  generarSitioUC: { execute: jest.fn() }
}))

describe('POST /api/chat', () => {
  it('devuelve la respuesta del bot', async () => {
    const app = await createServer()
    const res = await request(app)
      .post('/api/chat')
      .send({ mensaje: 'Hola', sessionId: 'test-session-001' })

    expect(res.status).toBe(200)
    expect(res.body.respuesta).toBe('¿Cómo se llama tu negocio?')
    expect(res.body.completada).toBe(false)
  })

  it('retorna 500 si Claude falla', async () => {
    const { chatService } = require('@/infrastructure/container')
    chatService.procesarMensaje.mockRejectedValueOnce(new Error('API down'))

    const app = await createServer()
    const res = await request(app)
      .post('/api/chat')
      .send({ mensaje: 'Hola', sessionId: 'test-session-002' })

    expect(res.status).toBe(500)
  })
})
```

---

### Tests BDD e2e — Playwright + Cucumber

Testean flujos completos desde el navegador. Lentos, se corren contra staging.

#### Features Gherkin

```gherkin
# tests/e2e/features/generar_sitio.feature
Feature: Generación de sitio web
  Como cliente de WebBot
  Quiero completar el chat con el bot
  Para obtener mi sitio web listo automáticamente

  Scenario: Cliente completa el chat y recibe su sitio
    Given el cliente abre la página de chat
    When responde "Panadería El Trigal" a la primera pregunta
    And completa las 7 preguntas restantes del bot
    And elige el estilo "Cálido y cercano"
    Then ve el mensaje de confirmación del bot
    And el sistema genera el sitio en menos de 3 minutos
    And el sitio es accesible en la URL entregada
```

```gherkin
# tests/e2e/features/suscripcion.feature
Feature: Suscripción y activación de cuenta

  Scenario: Pago exitoso activa el acceso al bot
    Given el cliente está en la landing de WebBot
    When selecciona el plan "Pro" por $39.990 CLP
    And completa el pago con tarjeta de prueba de Flow
    Then es redirigido a la página de chat
    And puede comenzar la conversación con el bot

  Scenario: Pago fallido no activa la cuenta
    Given el cliente intenta pagar con tarjeta rechazada
    When el sistema recibe el webhook de pago fallido
    Then el cliente recibe un mensaje de error
    And no puede acceder al chat
```

```gherkin
# tests/e2e/features/pausa_sitio.feature
Feature: Pausa automática por pago fallido

  Scenario: Sitio se pausa cuando falla el cobro mensual
    Given el cliente tiene un sitio activo en "testpyme.sitios.devalpo.cl"
    When el sistema recibe un webhook de pago fallido para ese cliente
    Then el sitio muestra la página de pausa de WebBot
    And el cliente recibe una notificación de pago fallido
```

#### Step Definitions con Playwright

```typescript
// tests/e2e/steps/generar-sitio.steps.ts
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { chromium, Browser, Page } from '@playwright/test'
import { expect } from '@playwright/test'

let browser: Browser
let page: Page

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

const RESPUESTAS_BOT = [
  'Panadería El Trigal',
  'Hacemos pan artesanal y tortas para eventos especiales',
  'Pan de molde, marraqueta, hallullas, tortas personalizadas',
  'Viña del Mar, Quinta Región',
  'Teléfono: 56912345678, email: contacto@eltrigal.cl',
  'Instagram: @panaderiaeltrigal',
  'Cálido y cercano',
  'Más de 20 años de tradición familiar en Viña del Mar',
]

Before(async () => {
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage()
})

After(async () => {
  await browser.close()
})

Given('el cliente abre la página de chat', async () => {
  await page.goto(`${BASE_URL}/chat`)
  await page.waitForSelector('[data-testid="chat-window"]')
})

When('responde {string} a la primera pregunta', async (respuesta: string) => {
  await page.waitForSelector('[data-testid="bot-message"]')
  await page.fill('[data-testid="chat-input"]', respuesta)
  await page.click('[data-testid="send-button"]')
  await page.waitForTimeout(1500)
})

When('completa las 7 preguntas restantes del bot', async () => {
  // Responde preguntas 2-7 (la 8 es el estilo, manejado aparte)
  for (let i = 1; i <= 6; i++) {
    await page.waitForSelector('[data-testid="bot-message"]:last-child')
    await page.fill('[data-testid="chat-input"]', RESPUESTAS_BOT[i])
    await page.click('[data-testid="send-button"]')
    await page.waitForTimeout(1500)
  }
})

When('elige el estilo {string}', async (estilo: string) => {
  await page.waitForSelector('[data-testid="bot-message"]:last-child')
  await page.fill('[data-testid="chat-input"]', estilo)
  await page.click('[data-testid="send-button"]')
  await page.waitForTimeout(1500)
  // Última respuesta (highlight)
  await page.fill('[data-testid="chat-input"]', RESPUESTAS_BOT[7])
  await page.click('[data-testid="send-button"]')
  await page.waitForTimeout(2000)
})

Then('ve el mensaje de confirmación del bot', async () => {
  const confirmacion = await page.waitForSelector(
    '[data-testid="bot-message"]:last-child',
    { timeout: 10000 }
  )
  const texto = await confirmacion.textContent()
  expect(texto).toContain('listo')
})

Then('el sistema genera el sitio en menos de 3 minutos', async () => {
  // Esperar el indicador de sitio generado (máx 3 min)
  await page.waitForSelector('[data-testid="site-ready"]', { timeout: 180000 })
})

Then('el sitio es accesible en la URL entregada', async () => {
  const urlElement = await page.waitForSelector('[data-testid="site-url"]')
  const url = await urlElement.textContent()
  expect(url).toContain('sitios.devalpo.cl')

  // Verificar que la URL responde
  const response = await page.request.get(url!)
  expect(response.status()).toBe(200)
})
```

---

### Configuración de testing

```typescript
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/application/**/*.ts',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches:   70,
      functions:  80,
      lines:      80,
      statements: 80,
    },
  },
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    },
  ],
}

export default config
```

```javascript
// cucumber.js
module.exports = {
  default: {
    paths: ['tests/e2e/features/**/*.feature'],
    require: ['tests/e2e/steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'json:reports/cucumber.json'],
    worldParameters: {
      baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
    },
  },
}
```

```json
// package.json — scripts relevantes
{
  "scripts": {
    "test:unit":        "jest --selectProjects unit",
    "test:integration": "jest --selectProjects integration",
    "test:e2e":         "cucumber-js",
    "test:all":         "jest && cucumber-js",
    "test:coverage":    "jest --coverage",
    "test:watch":       "jest --watch --selectProjects unit"
  }
}
```

**Dependencias de testing:**
```bash
npm install -D \
  jest ts-jest @types/jest \
  supertest @types/supertest \
  @cucumber/cucumber \
  @playwright/test \
  playwright
```

---

## Variables de entorno

```bash
# .env.local (nunca commitear al repo)

# IA
ANTHROPIC_API_KEY=sk-ant-...

# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/webbot

# Pagos
FLOW_API_KEY=
FLOW_SECRET_KEY=
MP_ACCESS_TOKEN=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Imágenes
UNSPLASH_ACCESS_KEY=

# Railway
RAILWAY_API_TOKEN=
RAILWAY_PROJECT_ID=

# App
NEXT_PUBLIC_BASE_DOMAIN=sitios.devalpo.cl
ADMIN_PASSWORD=
N8N_WEBHOOK_URL=https://n8n.tudominio.com/webhook/webbot

# Testing
E2E_BASE_URL=http://localhost:3000
```

---

## Reglas para Claude Code

Cuando implementes cualquier archivo de este proyecto, respeta estas reglas sin excepción:

**1. Orden de implementación obligatorio:**
```
domain/entities + domain/repositories
  → application/dtos + application/services (interfaces)
    → application/use-cases
      → infrastructure/db + infrastructure/claude
        → infrastructure/container
          → presentation/api routes + presentation/components
```

**2. Una tarea a la vez.** Cuando te pida "Tarea X.X", implementa solo eso y sus tests. No anticipes tareas siguientes.

**3. Tests siempre.** Cada archivo de dominio o use case debe tener su archivo `.test.ts` correspondiente. No hay código sin test en `domain/` ni `application/`.

**4. Sin imports cruzados incorrectos:**
- `domain/` → no importa nada de fuera de `domain/`
- `application/` → solo importa de `domain/`
- `infrastructure/` → implementa interfaces de `domain/` y `application/`
- `presentation/` → importa de `infrastructure/container.ts` solamente

**5. Siempre mostrar cómo correr el test** al terminar una tarea:
```bash
npm run test:unit -- --testPathPattern=NombreArchivo
```

**6. Si algo no está en este documento**, pregunta antes de inventar. La arquitectura es la fuente de verdad.

---

*Versión: 1.0 · Agosto 2026 · Devalpo · Owner: Agustín Romero*
