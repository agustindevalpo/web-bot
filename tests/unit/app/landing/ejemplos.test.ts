// Aislado con jest.resetModules() + require() dinámico porque EJEMPLOS
// calcula sus URLs a nivel de módulo a partir de variables de entorno —
// mismo patrón que tests/unit/infrastructure/container.test.ts.
import type { EjemploReal } from '@/app/_landing/ejemplos'

// `export {}` fuerza scope de módulo: con solo `import type` TypeScript trata
// el archivo como script global y ORIGINAL_ENV choca con el de
// tests/unit/infrastructure/container.test.ts.
export {}

const ORIGINAL_ENV = process.env

afterEach(() => {
  process.env = ORIGINAL_ENV
  jest.resetModules()
})

describe('EJEMPLOS', () => {
  it('contiene exactamente los tres subdominios de demo, en orden', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { EJEMPLOS } = require('@/app/_landing/ejemplos') as { EJEMPLOS: EjemploReal[] }

    expect(EJEMPLOS.map((ejemplo) => ejemplo.subdominio)).toEqual([
      'demo-restaurante',
      'demo-tienda',
      'demo-dentista',
    ])
  })

  it('cada ejemplo trae rubro y descripción propios (no genéricos ni vacíos)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { EJEMPLOS } = require('@/app/_landing/ejemplos') as { EJEMPLOS: EjemploReal[] }

    const rubros = EJEMPLOS.map((ejemplo) => ejemplo.rubro)
    const descripciones = EJEMPLOS.map((ejemplo) => ejemplo.descripcion)

    expect(new Set(rubros).size).toBe(3)
    expect(new Set(descripciones).size).toBe(3)
    for (const texto of [...rubros, ...descripciones]) {
      expect(texto.length).toBeGreaterThan(0)
    }
  })
})

describe('EJEMPLOS — construcción de URL vía construirUrlPreview', () => {
  it('en local apunta a /sites/<subdominio> de la app', () => {
    jest.resetModules()
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_BASE_DOMAIN: 'sitios.devalpo.cl',
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { EJEMPLOS } = require('@/app/_landing/ejemplos') as { EJEMPLOS: EjemploReal[] }

    const restaurante = EJEMPLOS.find((ejemplo) => ejemplo.subdominio === 'demo-restaurante')
    expect(restaurante?.url).toBe('http://localhost:3000/sites/demo-restaurante')
  })

  it('fuera de local usa el subdominio real sobre el base domain', () => {
    jest.resetModules()
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_APP_URL: 'https://webbot.devalpo.cl',
      NEXT_PUBLIC_BASE_DOMAIN: 'sitios.devalpo.cl',
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { EJEMPLOS } = require('@/app/_landing/ejemplos') as { EJEMPLOS: EjemploReal[] }

    const tienda = EJEMPLOS.find((ejemplo) => ejemplo.subdominio === 'demo-tienda')
    expect(tienda?.url).toBe('https://demo-tienda.sitios.devalpo.cl')
  })
})
