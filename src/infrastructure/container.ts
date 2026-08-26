// Composición de todas las dependencias — un solo lugar para cambiar implementaciones

import { PrismaClienteRepository } from './db/repositories/PrismaClienteRepository'
import { PrismaSitioRepository } from './db/repositories/PrismaSitioRepository'
import { PrismaPagoRepository } from './db/repositories/PrismaPagoRepository'
import { PrismaSesionRepository } from './db/repositories/PrismaSesionRepository'
import { PrismaTokenAccesoRepository } from './db/repositories/PrismaTokenAccesoRepository'
import { ClaudeChatService } from './claude/ClaudeChatService'
import { IChatService } from '@/application/services/IChatService'
import { RailwayDeployService } from './railway/RailwayDeployService'
import { PaymentEngineService } from './payments/PaymentEngineService'
import { WhatsAppNotificacionService } from './notifications/WhatsAppNotificacionService'
import { DevEmailService } from './email/DevEmailService'
import { GmailSmtpEmailService } from './email/GmailSmtpEmailService'
import { ResendEmailService } from './email/ResendEmailService'

import { GenerarSitioUseCase } from '@/application/use-cases/GenerarSitio.usecase'
import { ActivarClienteUseCase } from '@/application/use-cases/ActivarCliente.usecase'
import { PausarSitioUseCase } from '@/application/use-cases/PausarSitio.usecase'
import { ReactivarSitioUseCase } from '@/application/use-cases/ReactivarSitio.usecase'
import { VerificarDominioUseCase } from '@/application/use-cases/VerificarDominio.usecase'
import { SolicitarAccesoUseCase } from '@/application/use-cases/SolicitarAcceso.usecase'
import { VerificarAccesoUseCase } from '@/application/use-cases/VerificarAcceso.usecase'

// Repositorios
const clienteRepo = new PrismaClienteRepository()
const sitioRepo = new PrismaSitioRepository()
const pagoRepo = new PrismaPagoRepository()
const sesionRepo = new PrismaSesionRepository()
const tokenAccesoRepo = new PrismaTokenAccesoRepository()

// Servicios externos (stubs hasta que sus fases correspondientes los implementen)
const deployService = new RailwayDeployService()
const pagoService = new PaymentEngineService()
const notificacionService = new WhatsAppNotificacionService()
// Resend (HTTP) es el envío real en producción — el SMTP de Gmail está
// bloqueado en el egress de Railway (ver docs/BITACORA.md). Gmail SMTP queda
// como opción para dev local, donde sí funciona. Sin ninguna credencial, cae
// a loguear el link a consola.
const emailService = process.env.RESEND_API_KEY
  ? new ResendEmailService()
  : process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? new GmailSmtpEmailService()
    : new DevEmailService()

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Use Cases (exportar para usar en API routes)
export const generarSitioUC = new GenerarSitioUseCase(sesionRepo, sitioRepo, clienteRepo, deployService, notificacionService)
export const activarClienteUC = new ActivarClienteUseCase(clienteRepo, pagoRepo, notificacionService)
export const pausarSitioUC = new PausarSitioUseCase(clienteRepo, sitioRepo, notificacionService)
export const reactivarSitioUC = new ReactivarSitioUseCase(clienteRepo, sitioRepo, notificacionService)
export const verificarDominioUC = new VerificarDominioUseCase(sitioRepo, deployService)
export const solicitarAccesoUC = new SolicitarAccesoUseCase(tokenAccesoRepo, emailService, APP_URL)
export const verificarAccesoUC = new VerificarAccesoUseCase(tokenAccesoRepo, clienteRepo)

// Repos y servicios sueltos para controllers
export { clienteRepo, sitioRepo, pagoRepo, sesionRepo, tokenAccesoRepo, deployService, pagoService, notificacionService, emailService }

// ClaudeChatService real — construcción perezosa y memoizada (mismo patrón
// que emailService, pero como getter en vez de ternario eager) porque su
// constructor valida ANTHROPIC_API_KEY y tira si falta; instanciarlo eager
// rompería el boot cuando solo se usa el modo demo (que no requiere la key).
// route.ts y container.ts comparten esta única instancia — un solo lugar de
// composición para el servicio real, ver Decisión D2 en design.md.
let chatServiceReal: IChatService | null | undefined

export function getChatServiceReal(): IChatService | null {
  if (chatServiceReal !== undefined) return chatServiceReal

  chatServiceReal = process.env.ANTHROPIC_API_KEY ? new ClaudeChatService() : null
  return chatServiceReal
}
