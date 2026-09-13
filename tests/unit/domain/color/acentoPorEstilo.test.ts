import { derivarAcento, derivarColores } from '@/domain/color/acentoPorEstilo'
import { linealAOklch, hexALineal } from '@/domain/color/contraste'
import { Estilo } from '@/domain/value-objects/Estilo'
import { resolverColores, OVERRIDES_ACENTO } from '@/infrastructure/demo/rubroDefaults'

const HEX_VALIDO = /^#[0-9a-f]{6}$/i

// Distancia circular a 70° (ámbar) — sirve para comprobar que `calido`
// efectivamente acerca el tono, sin acoplar el test a un valor de grados
// exacto que dependería de redondeos de cuantización a 8 bits.
function distanciaAAmbar(h: number): number {
  const diff = Math.abs(h - 70) % 360
  return diff > 180 ? 360 - diff : diff
}

describe('derivarAcento — dirección de cada estilo', () => {
  it('moderno reduce el croma sin tocar la luminosidad', () => {
    const acento = '#0891B2'
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.MODERNO))!)

    expect(derivado.c).toBeLessThan(original.c)
    expect(derivado.l).toBeCloseTo(original.l, 2)
  })

  it('calido acerca el tono a 70° (ámbar) por el arco más corto', () => {
    const acento = '#0891B2'
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.CALIDO))!)

    expect(distanciaAAmbar(derivado.h)).toBeLessThan(distanciaAAmbar(original.h))
  })

  it('colorido aumenta el croma', () => {
    const acento = '#8B4513'
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.COLORIDO))!)

    expect(derivado.c).toBeGreaterThan(original.c)
  })
})

describe('derivarAcento — salida siempre en sRGB válido', () => {
  const ACENTOS = ['#FF8C00', '#e94560', '#0891B2', '#f0c040', '#15defa', '#fd79a8']
  const ESTILOS = [Estilo.MODERNO, Estilo.CALIDO, Estilo.COLORIDO]

  it.each(ACENTOS.flatMap((acento) => ESTILOS.map((estilo) => [acento, estilo] as const)))(
    '%s con estilo %s da un hex de 6 dígitos válido',
    (acento, estilo) => {
      expect(derivarAcento(acento, estilo)).toMatch(HEX_VALIDO)
    },
  )
})

describe('derivarAcento — degrada sin lanzar', () => {
  it.each([
    ['texto que no es color', 'no-es-color'],
    ['hex con letras inválidas', '#zzz'],
    ['string vacío', ''],
    ['valor nulo colado desde configJson', null as unknown as string],
  ])('%s → devuelve el mismo valor de entrada', (_descripcion, entrada) => {
    expect(() => derivarAcento(entrada as string, Estilo.CALIDO)).not.toThrow()
    expect(derivarAcento(entrada as string, Estilo.CALIDO)).toBe(entrada)
  })
})

describe('derivarColores', () => {
  const colores = { primario: '#8B4513', secundario: '#D2691E', acento: '#FF8C00', texto: '#ffffff' }

  it('deja primario, secundario y texto intactos y solo transforma el acento', () => {
    const resultado = derivarColores(colores, Estilo.COLORIDO)

    expect(resultado.primario).toBe(colores.primario)
    expect(resultado.secundario).toBe(colores.secundario)
    expect(resultado.texto).toBe(colores.texto)
    expect(resultado.acento).toBe(derivarAcento(colores.acento, Estilo.COLORIDO))
    expect(resultado.acento).not.toBe(colores.acento)
  })
})

describe('resolverColores — el override manual gana sobre la derivación', () => {
  const RUBRO_DE_PRUEBA = 'rubro-de-prueba-acento-estilo'

  afterEach(() => {
    delete OVERRIDES_ACENTO[RUBRO_DE_PRUEBA]
  })

  it('usa el hex de OVERRIDES_ACENTO en vez del derivado cuando hay entrada', () => {
    const colores = { primario: '#000000', secundario: '#111111', acento: '#15defa', texto: '#ffffff' }
    OVERRIDES_ACENTO[RUBRO_DE_PRUEBA] = { [Estilo.MODERNO]: '#abcdef' }

    const resultado = resolverColores(RUBRO_DE_PRUEBA, colores, Estilo.MODERNO)

    expect(resultado).toEqual({ ...colores, acento: '#abcdef' })
  })

  it('sin override cae en la derivación automática', () => {
    const colores = { primario: '#000000', secundario: '#111111', acento: '#15defa', texto: '#ffffff' }

    const resultado = resolverColores(RUBRO_DE_PRUEBA, colores, Estilo.MODERNO)

    expect(resultado).toEqual(derivarColores(colores, Estilo.MODERNO))
  })
})
