import { derivarPaletaDesdeAcento, L_PRIMARIO, L_SECUNDARIO } from '@/domain/color/paletaDerivada'
import { hexALineal, linealAOklch, razonContraste, OBJETIVO_TEXTO } from '@/domain/color/contraste'
import { RUBRO_DEFAULTS } from '@/infrastructure/demo/rubroDefaults'

const HEX_VALIDO = /^#[0-9a-f]{6}$/i

// Los 11 acentos reales de RUBRO_DEFAULTS (10 rubros + "otro"), tal cual están
// en la tabla — no se inventan valores nuevos.
const ACENTOS_RUBRO = Object.entries(RUBRO_DEFAULTS).map(([rubro, valores]) => [rubro, valores.colores.acento] as const)

describe('derivarPaletaDesdeAcento — contraste de texto', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): el texto derivado cumple 4.5:1 contra el primario derivado', (_rubro, acento) => {
    const { primario, texto } = derivarPaletaDesdeAcento(acento)

    expect(razonContraste(texto, primario)).toBeGreaterThanOrEqual(OBJETIVO_TEXTO)
  })

  it('texto es siempre blanco o negro', () => {
    for (const [, acento] of ACENTOS_RUBRO) {
      const { texto } = derivarPaletaDesdeAcento(acento)
      expect(['#ffffff', '#000000']).toContain(texto)
    }
  })
})

describe('derivarPaletaDesdeAcento — determinismo', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): misma entrada da siempre la misma salida', (_rubro, acento) => {
    expect(derivarPaletaDesdeAcento(acento)).toEqual(derivarPaletaDesdeAcento(acento))
  })
})

describe('derivarPaletaDesdeAcento — degrada sin lanzar', () => {
  it.each([
    ['texto que no es color', 'no-es-color'],
    ['hex con letras inválidas', '#zzz'],
    ['string vacío', ''],
    ['hex de largo inválido', '#12345'],
    ['nombre CSS, que no se soporta', 'rebeccapurple'],
    ['valor nulo colado desde configJson', null as unknown as string],
    ['valor undefined colado desde configJson', undefined as unknown as string],
  ])('%s → no lanza y devuelve una paleta válida', (_descripcion, acento) => {
    expect(() => derivarPaletaDesdeAcento(acento as string)).not.toThrow()

    const paleta = derivarPaletaDesdeAcento(acento as string)
    expect(paleta.primario).toMatch(HEX_VALIDO)
    expect(paleta.secundario).toMatch(HEX_VALIDO)
    expect(['#ffffff', '#000000']).toContain(paleta.texto)
  })

  it('un acento inválido no devuelve undefined en ningún campo', () => {
    const paleta = derivarPaletaDesdeAcento('no-es-color')

    expect(paleta.primario).toBeDefined()
    expect(paleta.secundario).toBeDefined()
    expect(paleta.texto).toBeDefined()
  })
})

describe('derivarPaletaDesdeAcento — salida siempre en sRGB válido', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): primario y secundario son hex de 6 dígitos', (_rubro, acento) => {
    const { primario, secundario } = derivarPaletaDesdeAcento(acento)

    expect(primario).toMatch(HEX_VALIDO)
    expect(secundario).toMatch(HEX_VALIDO)
  })
})

describe('derivarPaletaDesdeAcento — orden de luminosidad', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): primario es más oscuro que secundario', (_rubro, acento) => {
    const { primario, secundario } = derivarPaletaDesdeAcento(acento)

    const lPrimario = linealAOklch(hexALineal(primario)!).l
    const lSecundario = linealAOklch(hexALineal(secundario)!).l

    expect(lPrimario).toBeLessThan(lSecundario)
  })

  // Todos los acentos de RUBRO_DEFAULTS son claros (ver la tabla): con L de
  // origen mayor que L_SECUNDARIO, `secundario` (L_SECUNDARIO) queda más
  // oscuro o igual que el acento de partida.
  it.each(ACENTOS_RUBRO)('%s (%s): secundario es más oscuro o igual que el acento original', (_rubro, acento) => {
    const { secundario } = derivarPaletaDesdeAcento(acento)

    const lAcento = linealAOklch(hexALineal(acento)!).l
    const lSecundario = linealAOklch(hexALineal(secundario)!).l

    expect(lSecundario).toBeLessThanOrEqual(lAcento)
  })

  it('primario y secundario preservan la L nominal pedida (cuando el gamut no obliga a recortar croma)', () => {
    // #15defa (cian, acento por defecto) no está pegado al borde de sRGB en
    // L=0.22/0.45, así que el mapeo de gamut no debería moverle la L.
    const { primario, secundario } = derivarPaletaDesdeAcento('#15defa')

    expect(linealAOklch(hexALineal(primario)!).l).toBeCloseTo(L_PRIMARIO, 2)
    expect(linealAOklch(hexALineal(secundario)!).l).toBeCloseTo(L_SECUNDARIO, 2)
  })
})

describe('derivarPaletaDesdeAcento — preserva tono y croma entre primario y secundario', () => {
  it('primario y secundario comparten tono (solo cambia L)', () => {
    const { primario, secundario } = derivarPaletaDesdeAcento('#15defa')

    const hPrimario = linealAOklch(hexALineal(primario)!).h
    const hSecundario = linealAOklch(hexALineal(secundario)!).h

    expect(Math.abs(hPrimario - hSecundario)).toBeLessThan(1)
  })
})
