import { buildPaletteStyle } from '@/components/templates/shared/palette'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'
import { derivarPaletaDesdeAcento } from '@/domain/color/paletaDerivada'
import { razonContraste, OBJETIVO_TEXTO } from '@/domain/color/contraste'

function baseConfig(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Negocio',
    rubro: 'panaderia',
    descripcion: '',
    servicios: [],
    ciudad: '',
    contacto: { telefono: '', email: '' },
    redes: {},
    estilo: Estilo.MODERNO,
    highlight: '',
    ...overrides,
  }
}

// D-31 (camino 3): --acento es el único color persistido; --primario,
// --secundario y --texto se derivan siempre de él con `paletaDerivada.ts`.
describe('buildPaletteStyle', () => {
  it('con solo colores.acento, deriva las otras tres y las cuatro variables quedan pobladas', () => {
    const style = buildPaletteStyle(baseConfig({ colores: { acento: '#333333' } }))
    const derivado = derivarPaletaDesdeAcento('#333333')

    expect(style).toEqual({
      '--primario': derivado.primario,
      '--secundario': derivado.secundario,
      '--acento': '#333333',
      '--texto': derivado.texto,
    })
    expect(Object.values(style as Record<string, string>).every((valor) => typeof valor === 'string' && valor.length > 0)).toBe(true)
    expect(razonContraste(derivado.texto, derivado.primario)).toBeGreaterThanOrEqual(OBJETIVO_TEXTO)
  })

  it('con los cuatro colores viejos guardados, ignora primario/secundario/texto y deriva del acento', () => {
    // Simula una fila ya existente en producción: el JSON crudo en la BD
    // sigue trayendo los cuatro campos (D-31, camino 3 — sin migración de
    // datos), pero `SiteConfigDTO.colores` ya solo tipa `acento`. El cast
    // pasa por `unknown` a propósito: representa el dato tal como sale de
    // `configJson` (sin tipar), no un literal que el código nuevo podría
    // escribir.
    const filaVieja = {
      colores: { primario: '#111111', secundario: '#222222', acento: '#333333', texto: '#444444' },
    } as unknown as Partial<SiteConfigDTO>
    const style = buildPaletteStyle(baseConfig(filaVieja))
    const derivado = derivarPaletaDesdeAcento('#333333')

    expect(style).toEqual({
      '--primario': derivado.primario,
      '--secundario': derivado.secundario,
      '--acento': '#333333',
      '--texto': derivado.texto,
    })
    // Los tres valores viejos quedan ignorados por completo, no reutilizados.
    expect(style).not.toMatchObject({ '--primario': '#111111' })
    expect(style).not.toMatchObject({ '--secundario': '#222222' })
    expect(style).not.toMatchObject({ '--texto': '#444444' })
  })

  it('sin config.colores, cae al acento por defecto y deriva desde ahí', () => {
    const style = buildPaletteStyle(baseConfig())
    const derivado = derivarPaletaDesdeAcento('#15DEFA')

    expect(style).toEqual({
      '--primario': derivado.primario,
      '--secundario': derivado.secundario,
      '--acento': '#15DEFA',
      '--texto': derivado.texto,
    })
  })
})
