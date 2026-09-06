import {
  COMO_FUNCIONA,
  EJEMPLOS_INTRO,
  FRASES_PROHIBIDAS,
  HERO,
  NAV,
  contieneFraseProhibida,
} from '@/app/_landing/copy'

export {}

// Únicas cuatro frases exigidas explícitamente por R8 (spec obs #299), ya
// normalizadas sin tildes: la lista completa (`FRASES_PROHIBIDAS`) es una
// unión más amplia definida en el diseño (obs #300, Interfaces/Contracts).
const FRASES_REQUERIDAS_R8 = [
  'te aprueban',
  'garantizamos la aprobacion',
  'las paginas que te piden para aprobarte',
  'integracion con webpay',
]

function recolectarStrings(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor]
  if (Array.isArray(valor)) return valor.flatMap(recolectarStrings)
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(recolectarStrings)
  return []
}

describe('FRASES_PROHIBIDAS', () => {
  it('define exactamente 10 entradas (unión de diseño D-copy)', () => {
    expect(FRASES_PROHIBIDAS).toHaveLength(10)
  })

  it('incluye las 4 frases exigidas por R8, ya normalizadas', () => {
    for (const frase of FRASES_REQUERIDAS_R8) {
      expect(FRASES_PROHIBIDAS).toContain(frase)
    }
  })
})

describe('contieneFraseProhibida', () => {
  it('detecta una frase prohibida sin distinguir mayúsculas', () => {
    expect(contieneFraseProhibida('Nosotros te aprueban el sitio')).toBe(true)
  })

  it('detecta una frase prohibida sin distinguir tildes', () => {
    expect(contieneFraseProhibida('Garantizamos la aprobación total')).toBe(true)
  })

  it('no marca texto legítimo como prohibido', () => {
    expect(contieneFraseProhibida('Tu sitio web listo en 1 día. Con tu dominio. Pago único.')).toBe(false)
  })
})

describe('copy de nav, hero, ejemplos y cómo funciona — sin frases prohibidas', () => {
  it('ningún string exportado por estos módulos contiene una frase de la lista prohibida', () => {
    const textos = [
      ...recolectarStrings(NAV),
      ...recolectarStrings(HERO),
      ...recolectarStrings(EJEMPLOS_INTRO),
      ...recolectarStrings(COMO_FUNCIONA),
    ]

    expect(textos.length).toBeGreaterThan(0)
    for (const texto of textos) {
      expect(contieneFraseProhibida(texto)).toBe(false)
    }
  })
})

describe('NAV', () => {
  it('expone el CTA principal hacia /chat', () => {
    expect(NAV.cta).toEqual({ label: 'Ver mi sitio gratis', href: '/chat' })
  })
})

describe('HERO', () => {
  it('expone el H1 exacto exigido por R4', () => {
    expect(HERO.titulo).toBe('Tu sitio web listo en 1 día. Con tu dominio. Pago único.')
  })

  it('expone el CTA primario "Ver mi sitio gratis" hacia /chat', () => {
    expect(HERO.ctaPrimario).toEqual({ label: 'Ver mi sitio gratis', href: '/chat' })
  })

  it('expone el CTA secundario "Ver ejemplos reales" hacia #ejemplos', () => {
    expect(HERO.ctaSecundario).toEqual({ label: 'Ver ejemplos reales', href: '#ejemplos' })
  })

  it('expone al menos una línea de confianza', () => {
    expect(HERO.confianza.length).toBeGreaterThan(0)
  })
})

describe('EJEMPLOS_INTRO', () => {
  it('expone título, subtítulo y la etiqueta de enlace de cada tarjeta', () => {
    expect(EJEMPLOS_INTRO.titulo.length).toBeGreaterThan(0)
    expect(EJEMPLOS_INTRO.subtitulo.length).toBeGreaterThan(0)
    expect(EJEMPLOS_INTRO.linkTarjeta.length).toBeGreaterThan(0)
  })
})

describe('COMO_FUNCIONA', () => {
  it('define exactamente 3 pasos, cada uno con título y descripción', () => {
    expect(COMO_FUNCIONA.pasos).toHaveLength(3)
    for (const paso of COMO_FUNCIONA.pasos) {
      expect(paso.titulo.length).toBeGreaterThan(0)
      expect(paso.desc.length).toBeGreaterThan(0)
    }
  })
})
