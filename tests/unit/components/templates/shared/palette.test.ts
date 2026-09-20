import { buildPaletteStyle } from '@/components/templates/shared/palette'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

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
//
// Los valores esperados de abajo son literales fijos (hex), no una llamada a
// `derivarPaletaDesdeAcento` dentro del propio test: comparar contra la misma
// función que el código bajo prueba invoca autoconfirma el resultado — un
// cambio futuro de `L_PRIMARIO`/`L_SECUNDARIO` o de la regla de derivación no
// rompería ninguna de estas aserciones (R3-test-acoplado-a-implementacion).
// Los literales salen de correr `derivarPaletaDesdeAcento` una sola vez, no
// se inventan.
describe('buildPaletteStyle', () => {
  it('con solo colores.acento, deriva las otras tres y las cuatro variables quedan pobladas', () => {
    const style = buildPaletteStyle(baseConfig({ colores: { acento: '#333333' } }))

    expect(style).toEqual({
      '--primario': '#1b1b1b',
      '--secundario': '#555555',
      '--acento': '#333333',
      '--texto': '#ffffff',
    })
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

    expect(style).toEqual({
      '--primario': '#1b1b1b',
      '--secundario': '#555555',
      '--acento': '#333333',
      '--texto': '#ffffff',
    })
  })

  it('sin config.colores, cae al acento por defecto y deriva desde ahí', () => {
    const style = buildPaletteStyle(baseConfig())

    expect(style).toEqual({
      '--primario': '#001f25',
      '--secundario': '#00606e',
      '--acento': '#15defa',
      '--texto': '#ffffff',
    })
  })

  // R3-acento-no-normalizado: un acento de cliente que no es un hex válido
  // degradaba, antes de este fix, a un `primario`/`secundario`/`texto` de
  // reserva mientras `--acento` conservaba el valor roto tal cual — las
  // cuatro variables CSS podían quedar incoherentes entre sí en el mismo
  // render. Ahora `--acento` se emite con el MISMO acento de reserva que ya
  // usaron las otras tres, así las cuatro coinciden siempre.
  it('con un acento inválido, las cuatro variables quedan coherentes con el acento de reserva', () => {
    const style = buildPaletteStyle(baseConfig({ colores: { acento: 'no-es-un-color' } }))

    expect(style).toEqual({
      '--primario': '#001f25',
      '--secundario': '#00606e',
      '--acento': '#15defa',
      '--texto': '#ffffff',
    })
  })

  // R3-colores-sin-acento-sin-cobertura: la fila legacy que describe el
  // comentario del DTO (`config.colores` presente, pero sin `acento` —
  // posible en JSON crudo de producción de antes de D-31) no tenía cobertura
  // a nivel de componente. El cast pasa por `unknown`, igual que la fila
  // vieja de más arriba: representa el dato tal como puede llegar sin tipar,
  // no un literal que el código nuevo escribiría.
  it('con config.colores presente pero sin acento, cae al acento por defecto y deriva desde ahí', () => {
    const filaSinAcento = { colores: {} } as unknown as Partial<SiteConfigDTO>
    const style = buildPaletteStyle(baseConfig(filaSinAcento))

    expect(style).toEqual({
      '--primario': '#001f25',
      '--secundario': '#00606e',
      '--acento': '#15defa',
      '--texto': '#ffffff',
    })
  })

  // `config.colores?.acento ?? ACENTO_DEFAULT` NO intercepta un string
  // vacío — `??` solo cubre `null`/`undefined`. Este caso sobrevive igual
  // porque `derivarPaletaDesdeAcento` trata '' como hex inválido y degrada
  // al acento por defecto internamente (probado en
  // tests/unit/domain/color/paletaDerivada.test.ts); acá se fija el mismo
  // comportamiento en el límite del componente.
  it('con acento como string vacío, cae al acento por defecto y deriva desde ahí', () => {
    const style = buildPaletteStyle(baseConfig({ colores: { acento: '' } }))

    expect(style).toEqual({
      '--primario': '#001f25',
      '--secundario': '#00606e',
      '--acento': '#15defa',
      '--texto': '#ffffff',
    })
  })
})
