import { Given, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { Cliente } from '@/domain/entities/Cliente'
import { Sitio } from '@/domain/entities/Sitio'
import { Plan } from '@/domain/value-objects/Plan'
import { Template } from '@/domain/value-objects/Template'
import { clienteRepo, sitioRepo } from '@/infrastructure/container'
import { SitioWorld } from './sitio-por-subdominio.steps'

// WB-22 Slice 5, tarea 6.3 — un escenario por cada Template (Requirement
// "Visual Distinctness" + "Mandatory Sections and Labels"). Reutiliza el
// World, y los hooks Before/After ya registrados en
// sitio-por-subdominio.steps.ts (limpieza vía prisma.sitio.deleteMany +
// borrado de cliente en After) — Cucumber solo admite un World por corrida,
// así que este archivo NO declara su propio setWorldConstructor/Before/After.

// Config completa: nombre, descripción, 3 servicios, teléfono, email y 2
// imágenes, suficiente para que las 5 secciones obligatorias rendericen con
// datos reales en cualquier template (ver Requirement "Mandatory Sections
// and Labels" en spec.md).
function construirConfigDePrueba(subdominio: string) {
  return {
    nombre: `Sitio E2E ${subdominio}`,
    rubro: 'demo-e2e',
    descripcion: 'Descripción de prueba generada para el e2e por template.',
    servicios: ['Servicio de prueba uno', 'Servicio de prueba dos', 'Servicio de prueba tres'],
    ciudad: 'Santiago',
    contacto: { telefono: '+56 9 1111 2222', email: 'contacto@e2e.webbot.test' },
    redes: { instagram: '@e2e_webbot', facebook: 'E2E WebBot' },
    estilo: 'moderno',
    highlight: 'Highlight de prueba para el e2e de templates.',
    imagenes: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
      'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800',
    ],
    colores: { primario: '#123456', secundario: '#654321', acento: '#abcdef', texto: '#ffffff' },
  }
}

Given(
  'un sitio con template {string} y subdominio {string}',
  async function (this: SitioWorld, template: string, subdominio: string) {
    const cliente = Cliente.crear(`${subdominio}@e2e.webbot.test`, 'Cliente E2E Templates', Plan.STARTER)
    await clienteRepo.save(cliente)
    this.clientesCreados.push(cliente.id)

    const sitio = new Sitio(
      crypto.randomUUID(),
      cliente.id,
      subdominio,
      template as Template,
      construirConfigDePrueba(subdominio),
      true,
    )
    await sitioRepo.save(sitio)
    this.sitiosCreados.push(subdominio)
  },
)

Then('la página muestra la sección {string}', async function (this: SitioWorld, seccion: string) {
  const encontrada = await this.page.locator('h2', { hasText: seccion }).count()
  expect(encontrada).toBeGreaterThan(0)
})

Then('la página tiene el atributo data-template {string}', async function (this: SitioWorld, valor: string) {
  const atributo = await this.page.getAttribute('[data-template]', 'data-template')
  expect(atributo).toBe(valor)
})
