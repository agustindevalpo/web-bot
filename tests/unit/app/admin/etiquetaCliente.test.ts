import { etiquetaCliente } from '@/app/admin/sitios/[id]/etiquetaCliente'
import { ResultadoConfirmarPago } from '@/application/use-cases/ConfirmarPagoSitio.usecase'

function resultado(sobreescritura: Partial<ResultadoConfirmarPago>): ResultadoConfirmarPago {
  return { modo: 'sin_cambio', clienteId: 'cliente-1', email: '', nombre: '', ...sobreescritura }
}

describe('etiquetaCliente (WB-43)', () => {
  it('modo creado muestra "Cliente creado: <email>"', () => {
    expect(etiquetaCliente(resultado({ modo: 'creado', email: 'nueva@correo.cl' }))).toBe(
      'Cliente creado: nueva@correo.cl',
    )
  })

  it('modo existente muestra "Cliente vinculado: <email>"', () => {
    expect(etiquetaCliente(resultado({ modo: 'existente', email: 'ya@correo.cl' }))).toBe(
      'Cliente vinculado: ya@correo.cl',
    )
  })

  it('modo sin_cambio muestra "Cliente activado" sin email', () => {
    expect(etiquetaCliente(resultado({ modo: 'sin_cambio' }))).toBe('Cliente activado')
  })
})
