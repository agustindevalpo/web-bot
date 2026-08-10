import { Given, When, Then, Before, After, setWorldConstructor, World } from '@cucumber/cucumber'
import { chromium, Browser, Page, Response } from '@playwright/test'
import { expect } from '@playwright/test'
import { Cliente } from '@/domain/entities/Cliente'
import { Sitio } from '@/domain/entities/Sitio'
import { Plan } from '@/domain/value-objects/Plan'
import { Template } from '@/domain/value-objects/Template'
import { clienteRepo, sitioRepo } from '@/infrastructure/container'
import { prisma } from '@/infrastructure/db'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

class SitioWorld extends World {
  browser!: Browser
  page!: Page
  response!: Response
  subdominioVisitado = ''
  sitiosCreados: string[] = []
  clientesCreados: string[] = []
}

setWorldConstructor(SitioWorld)

Before(async function (this: SitioWorld) {
  this.browser = await chromium.launch({ headless: true })
  this.page = await this.browser.newPage()
  this.sitiosCreados = []
  this.clientesCreados = []
})

After(async function (this: SitioWorld) {
  // Limpieza real — no hay delete() en ISitioRepository/IClienteRepository
  // para Sitio, así que se borra directo por Prisma para no dejar filas
  // huérfanas en la BD compartida (no hay staging, ver docs/BITACORA.md).
  for (const subdominio of this.sitiosCreados) {
    await prisma.sitio.deleteMany({ where: { subdominio } })
  }
  for (const clienteId of this.clientesCreados) {
    await prisma.cliente.delete({ where: { id: clienteId } })
  }
  await this.page.close()
  await this.browser.close()
})

async function crearSitioDePrueba(world: SitioWorld, subdominio: string, activo: boolean) {
  const cliente = Cliente.crear(`${subdominio}@e2e.webbot.test`, 'Cliente E2E', Plan.STARTER)
  await clienteRepo.save(cliente)
  world.clientesCreados.push(cliente.id)

  const sitio = new Sitio(
    crypto.randomUUID(),
    cliente.id,
    subdominio,
    Template.LANDING,
    { nombre: 'Sitio E2E' },
    activo,
  )
  await sitioRepo.save(sitio)
  world.sitiosCreados.push(subdominio)
}

Given('un sitio activo con subdominio {string}', async function (this: SitioWorld, subdominio: string) {
  await crearSitioDePrueba(this, subdominio, true)
})

Given('un sitio inactivo con subdominio {string}', async function (this: SitioWorld, subdominio: string) {
  await crearSitioDePrueba(this, subdominio, false)
})

When('visito la página de ese sitio', async function (this: SitioWorld) {
  const subdominio = this.sitiosCreados[this.sitiosCreados.length - 1]
  this.subdominioVisitado = subdominio
  const response = await this.page.goto(`${BASE_URL}/sites/${subdominio}`)
  if (!response) throw new Error(`No hubo respuesta al navegar a /sites/${subdominio}`)
  this.response = response
})

When('visito la página del subdominio {string}', async function (this: SitioWorld, subdominio: string) {
  this.subdominioVisitado = subdominio
  const response = await this.page.goto(`${BASE_URL}/sites/${subdominio}`)
  if (!response) throw new Error(`No hubo respuesta al navegar a /sites/${subdominio}`)
  this.response = response
})

Then('la respuesta HTTP es {int}', async function (this: SitioWorld, status: number) {
  expect(this.response.status()).toBe(status)
})

Then('la página muestra el subdominio {string}', async function (this: SitioWorld, subdominio: string) {
  const texto = await this.page.textContent('h1')
  expect(texto).toContain(subdominio)
})
