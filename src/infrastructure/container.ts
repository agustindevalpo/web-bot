// Composición de todas las dependencias — un solo lugar para cambiar implementaciones

import { PrismaClienteRepository } from './db/repositories/PrismaClienteRepository'
import { PrismaSitioRepository } from './db/repositories/PrismaSitioRepository'
import { PrismaPagoRepository } from './db/repositories/PrismaPagoRepository'
import { PrismaSesionRepository } from './db/repositories/PrismaSesionRepository'
import { ClaudeChatService } from './claude/ClaudeChatService'
import { RailwayDeployService } from './railway/RailwayDeployService'
import { PaymentEngineService } from './payments/PaymentEngineService'
import { WhatsAppNotificacionService } from './notifications/WhatsAppNotificacionService'

import { GenerarSitioUseCase } from '@/application/use-cases/GenerarSitio.usecase'
import { ActivarClienteUseCase } from '@/application/use-cases/ActivarCliente.usecase'
import { PausarSitioUseCase } from '@/application/use-cases/PausarSitio.usecase'
import { ReactivarSitioUseCase } from '@/application/use-cases/ReactivarSitio.usecase'
import { VerificarDominioUseCase } from '@/application/use-cases/VerificarDominio.usecase'

// Repositorios
const clienteRepo = new PrismaClienteRepository()
const sitioRepo = new PrismaSitioRepository()
const pagoRepo = new PrismaPagoRepository()
const sesionRepo = new PrismaSesionRepository()

// Servicios externos (stubs hasta que sus fases correspondientes los implementen)
const chatService = new ClaudeChatService()
const deployService = new RailwayDeployService()
const pagoService = new PaymentEngineService()
const notificacionService = new WhatsAppNotificacionService()

// Use Cases (exportar para usar en API routes)
export const generarSitioUC = new GenerarSitioUseCase(sesionRepo, sitioRepo, clienteRepo, deployService, notificacionService)
export const activarClienteUC = new ActivarClienteUseCase(clienteRepo, pagoRepo, notificacionService)
export const pausarSitioUC = new PausarSitioUseCase(clienteRepo, sitioRepo, notificacionService)
export const reactivarSitioUC = new ReactivarSitioUseCase(clienteRepo, sitioRepo, notificacionService)
export const verificarDominioUC = new VerificarDominioUseCase(sitioRepo, deployService)

// Repos y servicios sueltos para controllers
export { clienteRepo, sitioRepo, pagoRepo, sesionRepo, chatService, deployService, pagoService, notificacionService }
