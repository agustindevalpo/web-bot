import { PRECIO_MULTIPAGINA, PRECIO_PROMO, PRECIO_SITIO, RENOVACION_ANUAL, CUPOS_PROMO, estadoPromo, formatCLP } from '@/app/_landing/precios'
import { vistaPrecio } from '@/app/_landing/vistaPrecio'

describe('vistaPrecio', () => {
  it('con cupos: monto de lanzamiento, normal tachado, etiqueta naranja y línea con el total de cupos', () => {
    const vista = vistaPrecio(estadoPromo(0))
    expect(vista.monto).toBe(formatCLP(PRECIO_PROMO))
    expect(vista.montoTachado).toBe(formatCLP(PRECIO_SITIO))
    expect(vista.etiquetaPromo).toBe(`Precio de lanzamiento · quedan ${CUPOS_PROMO} cupos`)
    expect(vista.lineaPagoUnico).toBe(`Pago único, para los primeros ${CUPOS_PROMO}`)
    expect(vista.notaAgotado).toBeNull()
  })

  it('refleja los cupos restantes', () => {
    expect(vistaPrecio(estadoPromo(CUPOS_PROMO - 3)).etiquetaPromo).toBe(
      'Precio de lanzamiento · quedan 3 cupos',
    )
  })

  it('agotada: precio normal, sin etiqueta naranja ni tachado, con aviso de cupos agotados', () => {
    const vista = vistaPrecio(estadoPromo(CUPOS_PROMO))
    expect(vista.monto).toBe(formatCLP(PRECIO_SITIO))
    expect(vista.montoTachado).toBeNull()
    expect(vista.etiquetaPromo).toBeNull()
    expect(vista.lineaPagoUnico).toBe('Pago único')
    expect(vista.notaAgotado).toBe(`Cupos agotados — precio normal ${formatCLP(PRECIO_SITIO)}`)
  })

  it('las tarjetas extra salen de precios.ts en ambos estados', () => {
    for (const vendidos of [0, CUPOS_PROMO]) {
      const vista = vistaPrecio(estadoPromo(vendidos))
      expect(vista.multipagina).toBe(formatCLP(PRECIO_MULTIPAGINA))
      expect(vista.renovacion).toBe(formatCLP(RENOVACION_ANUAL))
    }
  })
})
