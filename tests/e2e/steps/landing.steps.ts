import { Given, When, Then, DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { construirUrlPreview } from '@/app/admin/_lib/urlPreview'
import { SitioWorld } from './sitio-por-subdominio.steps'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'

// E2E de la landing pública (WB-42) — ver design D12: reutiliza el World y
// los hooks Before/After ya registrados en sitio-por-subdominio.steps.ts,
// así que este archivo NO declara su propio setWorldConstructor/Before/After
// (Cucumber solo admite un World por corrida). Estos escenarios son de solo
// lectura: no crean sitios ni clientes, no usan sitiosCreados/clientesCreados.

function heroSection(world: SitioWorld) {
  return world.page.locator('section').first()
}

function seccionPorTexto(world: SitioWorld, texto: string) {
  return world.page.locator('section', { hasText: texto }).first()
}

Given('visito la landing pública', async function (this: SitioWorld) {
  const response = await this.page.goto(`${BASE_URL}/`)
  if (!response) throw new Error('No hubo respuesta al navegar a la landing pública')
  this.response = response
})

Then('el título principal es {string}', async function (this: SitioWorld, titulo: string) {
  await expect(this.page.locator('h1')).toHaveText(titulo)
})

Then(
  'el llamado a la acción principal del hero dice {string} y apunta a {string}',
  async function (this: SitioWorld, texto: string, href: string) {
    const cta = heroSection(this).getByRole('link', { name: texto })
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', href)
  },
)

Then(
  'el llamado a la acción secundario del hero dice {string} y apunta a {string}',
  async function (this: SitioWorld, texto: string, href: string) {
    const cta = heroSection(this).getByRole('link', { name: texto })
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', href)
  },
)

Then('las secciones de la página aparecen en este orden:', async function (this: SitioWorld, tabla: DataTable) {
  const esperado = tabla.raw().map((fila) => fila[0])
  const real = await this.page.evaluate(() => {
    const nodos = Array.from(document.querySelectorAll('body section, body footer'))
    return nodos.map((nodo) => {
      if (nodo.tagName === 'FOOTER') return 'footer'
      if (nodo.id) return nodo.id
      const texto = nodo.textContent || ''
      if (texto.includes('Tu sitio web listo en 1 día')) return 'hero'
      if (texto.includes('Por qué trabajar con nosotros')) return 'por-que-devalpo'
      if (texto.includes('Tu sitio puede estar publicado mañana')) return 'cta-final'
      return 'desconocido'
    })
  })
  expect(real).toEqual(esperado)
})

Then('hay exactamente 3 tarjetas de ejemplos reales', async function (this: SitioWorld) {
  const tarjetas = this.page.locator('#ejemplos a[target="_blank"]')
  await expect(tarjetas).toHaveCount(3)
})

Then('cada tarjeta de ejemplo abre en una pestaña nueva', async function (this: SitioWorld) {
  const tarjetas = this.page.locator('#ejemplos a[target="_blank"]')
  const total = await tarjetas.count()
  for (let i = 0; i < total; i++) {
    const tarjeta = tarjetas.nth(i)
    await expect(tarjeta).toHaveAttribute('target', '_blank')
    const rel = await tarjeta.getAttribute('rel')
    expect(rel).toContain('noopener')
  }
})

Then(
  'las tarjetas de ejemplos enlazan a {string}, {string} y {string}',
  async function (this: SitioWorld, uno: string, dos: string, tres: string) {
    for (const subdominio of [uno, dos, tres]) {
      const urlEsperada = construirUrlPreview(subdominio, APP_URL, BASE_DOMAIN)
      const enlace = this.page.locator(`#ejemplos a[href="${urlEsperada}"]`)
      await expect(enlace).toHaveCount(1)
    }
  },
)

Then('la imagen del poster del hero tiene ancho y alto definidos', async function (this: SitioWorld) {
  const poster = heroSection(this).locator('img').first()
  await expect(poster).toBeVisible()
  const ancho = await poster.getAttribute('width')
  const alto = await poster.getAttribute('height')
  expect(Number(ancho)).toBeGreaterThan(0)
  expect(Number(alto)).toBeGreaterThan(0)
})

Then('no hay ningún iframe en la página antes de interactuar', async function (this: SitioWorld) {
  await expect(this.page.locator('iframe')).toHaveCount(0)
})

Then('el enlace {string} del hero es visible', async function (this: SitioWorld, texto: string) {
  const enlace = heroSection(this).getByRole('link', { name: texto })
  await expect(enlace).toBeVisible()
  const href = await enlace.getAttribute('href')
  expect(href).not.toBe('')
})

When('hago clic en {string}', async function (this: SitioWorld, texto: string) {
  await this.page.getByRole('button', { name: texto }).click()
})

Then('aparece un iframe en la página', async function (this: SitioWorld) {
  await expect(this.page.locator('iframe')).toHaveCount(1)
})

Then('el precio {string} es visible', async function (this: SitioWorld, precio: string) {
  await expect(this.page.locator('#precio').getByText(precio).first()).toBeVisible()
})

Then(
  'el estado de cupos promocionales muestra cupos disponibles o cupos agotados',
  async function (this: SitioWorld) {
    const texto = (await this.page.locator('#precio').innerText()).toLowerCase()
    const activa = /quedan\s+\d+\s+cupos/.test(texto)
    const agotada = texto.includes('cupos agotados')
    expect(activa || agotada).toBe(true)
  },
)

Then('la letra chica del precio menciona {string} y {string}', async function (this: SitioWorld, a: string, b: string) {
  const texto = await this.page.locator('#precio').innerText()
  expect(texto).toContain(a)
  expect(texto).toContain(b)
})

Then('la sección {string} menciona {string}', async function (this: SitioWorld, seccion: string, frase: string) {
  const texto = await seccionPorTexto(this, seccion).innerText()
  expect(texto.toLowerCase()).toContain(frase.toLowerCase())
})

Then('la sección {string} tiene exactamente 6 preguntas', async function (this: SitioWorld, seccion: string) {
  const preguntas = seccionPorTexto(this, seccion).locator('button')
  await expect(preguntas).toHaveCount(6)
})

Then(
  'las preguntas frecuentes cubren qué incluye, cuánto tarda, dominio propio, cambios, tecnología y el segundo año',
  async function (this: SitioWorld) {
    const preguntas = this.page.locator('#faq button')
    const textos = (await preguntas.allInnerTexts()).map((t) => t.toLowerCase())
    const temas = ['incluye', 'tarda', 'dominio', 'cambios', 'tecnología', 'segundo año']
    for (const tema of temas) {
      const coincidencias = textos.filter((t) => t.includes(tema))
      expect(coincidencias.length).toBe(1)
    }
  },
)

Then('el texto de la página no contiene {string}', async function (this: SitioWorld, frase: string) {
  const texto = (await this.page.locator('body').innerText()).toLowerCase()
  expect(texto).not.toContain(frase.toLowerCase())
})
