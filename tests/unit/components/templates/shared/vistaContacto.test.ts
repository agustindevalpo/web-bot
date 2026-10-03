import { datosContactoVista } from '@/components/templates/shared/vistaContacto'

describe('datosContactoVista', () => {
  it('con todo: horarios, teléfono (tel:) y correo (mailto:)', () => {
    const vista = datosContactoVista({
      horarios: [{ dia: 'Lun a Vie', rango: '9:00 - 18:00' }],
      telefono: '+56 9 1234 5678',
      email: 'hola@negocio.cl',
    })
    expect(vista.horarios).toEqual([{ dia: 'Lun a Vie', rango: '9:00 - 18:00' }])
    expect(vista.tarjetas.map((t) => t.clave)).toEqual(['telefono', 'correo'])
    expect(vista.tarjetas[0].href).toBe('tel:+56 9 1234 5678')
    expect(vista.tarjetas[1].href).toBe('mailto:hola%40negocio.cl')
  })

  it('sin horarios válidos no hay tarjeta de horarios', () => {
    expect(datosContactoVista({ horarios: [{ dia: '', rango: '' }], telefono: '123' }).horarios).toEqual([])
    expect(datosContactoVista({ horarios: 'lunes' }).horarios).toEqual([])
    expect(datosContactoVista({}).horarios).toEqual([])
  })

  it('cada tarjeta existe solo si el dato existe', () => {
    expect(datosContactoVista({ telefono: '123' }).tarjetas.map((t) => t.clave)).toEqual(['telefono'])
    expect(datosContactoVista({ email: 'a@b.cl' }).tarjetas.map((t) => t.clave)).toEqual(['correo'])
    expect(datosContactoVista({ telefono: '  ', email: null }).tarjetas).toEqual([])
  })

  it('un correo inseguro para mailto: se muestra sin enlace', () => {
    const [tarjeta] = datosContactoVista({ email: 'a@b.cl?cc=x@y.cl' }).tarjetas
    expect(tarjeta.valor).toBe('a@b.cl?cc=x@y.cl')
    expect(tarjeta.href).toBeNull()
  })
})
