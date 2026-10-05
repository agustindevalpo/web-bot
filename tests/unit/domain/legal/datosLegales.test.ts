import { normalizarRazonSocial, normalizarRut, RAZON_SOCIAL_MAX } from '@/domain/legal/datosLegales'

describe('normalizarRut', () => {
  it.each([
    ['77119936-4', '77.119.936-4'],
    ['77.119.936-4', '77.119.936-4'],
    [' 77 119 936 - 4 ', '77.119.936-4'],
    ['12.345.678-5', '12.345.678-5'],
    ['11111111-1', '11.111.111-1'],
    ['7.000.000-8', '7.000.000-8'],
    ['10000013-k', '10.000.013-K'],
    ['1.000.013-0', '1.000.013-0'],
  ])('%s', (entrada, esperado) => {
    const r = normalizarRut(entrada)
    if (esperado === null) expect(r.ok).toBe(false)
    else expect(r).toEqual({ ok: true, valor: esperado })
  })

  it.each(['', '77119936-5', '1234', 'abc', '77.119.936-44', '123456789012-3'])('rechaza %j', (entrada) => {
    expect(normalizarRut(entrada)).toEqual({ ok: false, error: expect.stringContaining('RUT no es válido') })
  })
})

describe('normalizarRazonSocial', () => {
  it('recorta y colapsa espacios', () => {
    expect(normalizarRazonSocial('  Devalpo   SpA ')).toEqual({ ok: true, valor: 'Devalpo SpA' })
  })
  it('rechaza vacío', () => {
    expect(normalizarRazonSocial('   ').ok).toBe(false)
  })
  it('respeta el máximo', () => {
    expect(normalizarRazonSocial('a'.repeat(RAZON_SOCIAL_MAX)).ok).toBe(true)
    expect(normalizarRazonSocial('a'.repeat(RAZON_SOCIAL_MAX + 1)).ok).toBe(false)
  })
})
