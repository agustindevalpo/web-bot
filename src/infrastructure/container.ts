// Composición de todas las dependencias — un solo lugar para cambiar implementaciones

import { PrismaClienteRepository } from './db/repositories/PrismaClienteRepository'
import { PrismaSitioRepository } from './db/repositories/PrismaSitioRepository'
import { PrismaPagoRepository } from './db/repositories/PrismaPagoRepository'
import { PrismaSesionRepository } from './db/repositories/PrismaSesionRepository'
import { PrismaTokenAccesoRepository } from './db/repositories/PrismaTokenAccesoRepository'
import { ClaudeChatService } from './claude/ClaudeChatService'
import { RailwayDeployService } from './railway/RailwayDeployService'
import { PaymentEngineService } from './payments/PaymentEngineService'
import { WhatsAppNotificacionService } from './notifications/WhatsAppNotificacionService'
import { DevEmailService } from './email/DevEmailService'

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
const chatService = new ClaudeChatService()
const deployService = new RailwayDeployService()
const pagoService = new PaymentEngineService()
const notificacionService = new WhatsAppNotificacionService()
const emailService = new DevEmailService()

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
export { clienteRepo, sitioRepo, pagoRepo, sesionRepo, tokenAccesoRepo, chatService, deployService, pagoService, notificacionService, emailService }
