import { esSitioDemo, parsearFormularioPago } from '@/app/admin/sitios/[id]/formularioPago'

describe('parsearFormularioPago (WB-43, R3/S3.1/S3.2)', () => {
  it('acepta monto positivo entero y recorta la referencia (S3.1)', () => {
    const resultado = parsearFormularioPago({ monto: '15000', referencia: '  op-123  ', nombre: 'Ana', email: 'a@b.cl' })

    expect(resultado).toEqual({ ok: true, monto: 15000, referencia: 'op-123', nombre: 'Ana', email: 'a@b.cl' })
  })

  it('omite la referencia si queda vacía tras recortar espacios', () => {
    const resultado = parsearFormularioPago({ monto: '1000', referencia: '   ' })

    expect(resultado).toEqual({ ok: true, monto: 1000, referencia: undefined, nombre: undefined, email: undefined })
  })

  it.each([
    ['faltante', null],
    ['cero', '0'],
    ['negativo', '-500'],
    ['no entero', '15000.5'],
  ])('rechaza monto %s sin registrar el pago (S3.2)', (_caso, monto) => {
    expect(parsearFormularioPago({ monto })).toEqual({
      ok: false,
      error: 'El monto debe ser un número entero de pesos mayor que cero.',
    })
  })

  it('rechaza y cae al mismo límite (100) que valida hoy la acción', () => {
    expect(parsearFormularioPago({ monto: '1000', referencia: 'x'.repeat(101) })).toEqual({
      ok: false,
      error: 'La referencia no puede superar los 100 caracteres.',
    })
    expect(parsearFormularioPago({ monto: '1000', referencia: 'x'.repeat(100) }).ok).toBe(true)
  })
})

describe('esSitioDemo (WB-43, R5/S5.1, R10/S10.1)', () => {
  it('devuelve true solo cuando el clienteId del sitio es el cliente demo compartido', () => {
    expect(esSitioDemo('cliente-demo', 'cliente-demo')).toBe(true)
    expect(esSitioDemo('cliente-real-1', 'cliente-demo')).toBe(false)
  })
})
