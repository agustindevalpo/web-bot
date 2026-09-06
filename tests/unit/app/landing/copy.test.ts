import {
  COMO_FUNCIONA,
  CTA_FINAL,
  EJEMPLOS_INTRO,
  FAQ,
  FRASES_PROHIBIDAS,
  HERO,
  NAV,
  POR_QUE_DEVALPO,
  PRECIO,
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

describe('PRECIO', () => {
  it('expone nombre de tarjeta, qué incluye, etiqueta de pago único y CTA hacia /chat', () => {
    expect(PRECIO.nombreTarjeta.length).toBeGreaterThan(0)
    expect(PRECIO.incluye.length).toBeGreaterThan(0)
    expect(PRECIO.etiquetaPagoUnico.length).toBeGreaterThan(0)
    expect(PRECIO.cta).toEqual({ label: 'Ver mi sitio gratis', href: '/chat' })
  })

  it('la letra chica menciona el sitio multipágina ($249.990) y la renovación anual ($39.990)', () => {
    expect(PRECIO.letraChica).toContain('$249.990')
    expect(PRECIO.letraChica).toContain('$39.990')
  })

  it('expone la etiqueta de lanzamiento "primeros 10" y el texto dinámico de cupos restantes', () => {
    expect(PRECIO.lanzamiento.primeros).toContain('primeros 10')
    expect(PRECIO.lanzamiento.cupos(3)).toBe('quedan 3 cupos')
  })

  it('expone el estado de cupos agotados', () => {
    expect(PRECIO.agotado.etiqueta).toBe('Cupos agotados')
    expect(PRECIO.agotado.nota('$149.990')).toContain('$149.990')
  })
})

describe('POR_QUE_DEVALPO', () => {
  it('define al menos 3 puntos, cada uno con título y descripción', () => {
    expect(POR_QUE_DEVALPO.puntos.length).toBeGreaterThanOrEqual(3)
    for (const punto of POR_QUE_DEVALPO.puntos) {
      expect(punto.titulo.length).toBeGreaterThan(0)
      expect(punto.desc.length).toBeGreaterThan(0)
    }
  })

  it('incluye el gancho legal exacto exigido por R8/design (mínimos legales SERNAC)', () => {
    const conGancho = POR_QUE_DEVALPO.puntos.filter((p) => p.desc.includes('términos y condiciones'))
    expect(conGancho).toHaveLength(1)
    expect(conGancho[0].desc).toContain('datos del negocio')
    expect(conGancho[0].desc).toContain('contacto')
    expect(conGancho[0].desc).toContain('descripción y precios')
  })
})

describe('FAQ', () => {
  it('define exactamente 6 preguntas, cada una con q y a no vacíos', () => {
    expect(FAQ.items).toHaveLength(6)
    for (const item of FAQ.items) {
      expect(item.q.length).toBeGreaterThan(0)
      expect(item.a.length).toBeGreaterThan(0)
    }
  })

  it('no repite ninguna pregunta', () => {
    const preguntas = FAQ.items.map((item) => item.q)
    expect(new Set(preguntas).size).toBe(preguntas.length)
  })

  it('cubre exactamente los 6 temas exigidos por R9, cada uno una sola vez', () => {
    const TEMAS_REQUERIDOS = [
      /incluye el precio/i,
      /cu[aá]nto tarda/i,
      /ya tengo dominio/i,
      /pedir cambios/i,
      /saber de tecnolog[ií]a/i,
      /segundo a[ñn]o/i,
    ]
    for (const tema of TEMAS_REQUERIDOS) {
      const coincidencias = FAQ.items.filter((item) => tema.test(item.q))
      expect(coincidencias).toHaveLength(1)
    }
  })
})

describe('CTA_FINAL', () => {
  it('expone título, subtítulo y botón hacia /chat', () => {
    expect(CTA_FINAL.titulo.length).toBeGreaterThan(0)
    expect(CTA_FINAL.subtitulo.length).toBeGreaterThan(0)
    expect(CTA_FINAL.cta).toEqual({ label: 'Ver mi sitio gratis', href: '/chat' })
  })
})

describe('copy completo (todos los módulos) — sin frases prohibidas ni voseo', () => {
  const TODOS_LOS_TEXTOS = () => [
    ...recolectarStrings(NAV),
    ...recolectarStrings(HERO),
    ...recolectarStrings(EJEMPLOS_INTRO),
    ...recolectarStrings(COMO_FUNCIONA),
    ...recolectarStrings(PRECIO),
    ...recolectarStrings(POR_QUE_DEVALPO),
    ...recolectarStrings(FAQ),
    ...recolectarStrings(CTA_FINAL),
  ]

  it('ningún string exportado por copy.ts contiene una frase prohibida (guarda total, R8)', () => {
    const textos = TODOS_LOS_TEXTOS()
    expect(textos.length).toBeGreaterThan(0)
    for (const texto of textos) {
      expect(contieneFraseProhibida(texto)).toBe(false)
    }
  })

  it('ningún string exportado usa formas de voseo (R9)', () => {
    const PATRONES_VOSEO = [
      /\bvos\b/i,
      /\bsos\b/i,
      /\btenés\b/i,
      /\bpodés\b/i,
      /\bquerés\b/i,
      /\bsabés\b/i,
      /\bhablái\b/i,
      /\bestái\b/i,
      /\btenís\b/i,
    ]
    const textos = TODOS_LOS_TEXTOS()
    for (const texto of textos) {
      for (const patron of PATRONES_VOSEO) {
        expect(patron.test(texto)).toBe(false)
      }
    }
  })
})
