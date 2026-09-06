import { Given, When } from '@cucumber/cucumber'
import { Cliente } from '@/domain/entities/Cliente'
import { Sitio } from '@/domain/entities/Sitio'
import { Plan } from '@/domain/value-objects/Plan'
import { Template } from '@/domain/value-objects/Template'
import { clienteRepo, sitioRepo } from '@/infrastructure/container'
import { SitioWorld } from './sitio-por-subdominio.steps'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

// WB-26 — sitio servido por dominio propio. Reutiliza el World y los hooks
// Before/After ya registrados en sitio-por-subdominio.steps.ts (limpieza vía
// prisma.sitio.deleteMany por subdominio + borrado de cliente en After) —
// Cucumber solo admite un World por corrida, así que este archivo NO declara
// su propio setWorldConstructor/Before/After.
//
// En producción la cabecera X-WebBot-Forwarded-Host la agrega el Worker de
// Cloudflare junto con X-WebBot-Worker-Secret. En dev local y en el e2e se
// espera que WORKER_SHARED_SECRET esté vacío, por lo que src/proxy.ts confía
// en la cabecera sin secreto (ver resolverDestino, regla (a)). Si el entorno
// tuviera el secreto configurado, estos escenarios responderían 404.

Given(
  'un sitio activo con subdominio {string} y dominio propio {string}',
  async function (this: SitioWorld, subdominio: string, dominioPropio: string) {
    const cliente = Cliente.crear(`${subdominio}@e2e.webbot.test`, 'Cliente E2E', Plan.STARTER)
    await clienteRepo.save(cliente)
    this.clientesCreados.push(cliente.id)

    // El nombre coincide con el subdominio para reutilizar el step "la página
    // muestra el subdominio" (verifica el h1 con config.nombre).
    const sitio = new Sitio(
      crypto.randomUUID(),
      cliente.id,
      subdominio,
      Template.LANDING,
      { nombre: subdominio },
      true,
      dominioPropio,
    )
    await sitioRepo.save(sitio)
    this.sitiosCreados.push(subdominio)
  },
)

When(
  'visito la raíz con la cabecera X-WebBot-Forwarded-Host {string}',
  async function (this: SitioWorld, dominio: string) {
    await this.page.setExtraHTTPHeaders({ 'X-WebBot-Forwarded-Host': dominio })
    const response = await this.page.goto(`${BASE_URL}/`)
    if (!response) throw new Error(`No hubo respuesta al navegar a / con X-WebBot-Forwarded-Host ${dominio}`)
    this.response = response
  },
)
