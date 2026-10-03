import { altosLogoPie, glosaPie, lineaLegal, construirPie } from '@/components/templates/shared/pieBloques'
import type { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

const base = { nombre: 'Panadería El Trigal' } as unknown as SiteConfigDTO
const con = (extra: Record<string, unknown>) => ({ ...base, ...extra }) as unknown as SiteConfigDTO

describe('pieBloques — altosLogoPie', () => {
  it('un logo 3:1 mide 35px en escritorio (80% de 44)', () => {
    expect(altosLogoPie({ ancho: 300, alto: 100 }).escritorio).toBe(35)
  })

  it('movil es el 80% del alto movil de la cabecera (34 -> 27)', () => {
    expect(altosLogoPie({ ancho: 300, alto: 100 }).movil).toBe(27)
  })

  it('sin dimensiones cae a 35px', () => {
    expect(altosLogoPie(null)).toEqual({ escritorio: 35, movil: 35 })
  })
})

describe('pieBloques — glosaPie', () => {
  it('rubro y ciudad', () => {
    expect(glosaPie('panaderia', 'Viña del Mar', [])).toBe('Panadería en Viña del Mar.')
  })

  it('omite la parte que falta', () => {
    expect(glosaPie('panaderia', null, [])).toBe('Panadería.')
    expect(glosaPie(null, 'Viña del Mar', [])).toBe('Viña del Mar.')
    expect(glosaPie(null, null, [])).toBeNull()
  })

  it('agrega los horarios como texto', () => {
    expect(glosaPie('yoga', 'Reñaca', [{ dia: 'Lunes a viernes', rango: 'de 9:00 a 18:00' }, { dia: 'Sábado', rango: '10:00' }])).toBe(
      'Yoga en Reñaca. Lunes a viernes de 9:00 a 18:00, Sábado 10:00.',
    )
  })
})

describe('pieBloques — lineaLegal', () => {
  it('con razón social y RUT', () => {
    expect(lineaLegal({ razonSocial: 'Trigal SpA', rut: '76.123.456-7' }, 'El Trigal', 2026)).toBe('© 2026 Trigal SpA · RUT 76.123.456-7')
  })

  it('sin datos legales usa el nombre', () => {
    expect(lineaLegal(null, 'El Trigal', 2026)).toBe('© 2026 El Trigal')
  })
})

describe('pieBloques — construirPie', () => {
  it('degrada con solo { nombre }', () => {
    const pie = construirPie(base, 2026)
    expect(pie.logo).toBeNull()
    expect(pie.glosa).toBeNull()
    expect(pie.contacto).toEqual([])
    expect(pie.legal).toBe('© 2026 Panadería El Trigal')
    expect(pie.mostrarNombre).toBe(true)
    expect(pie.iniciales).not.toBe('')
  })

  it('un logotipo (r >= 1.6) oculta el nombre; un isotipo lo muestra', () => {
    expect(construirPie(con({ logo: 'https://x/l.png', logoDimensiones: { ancho: 300, alto: 100 } }), 2026).mostrarNombre).toBe(false)
    expect(construirPie(con({ logo: 'https://x/l.png', logoDimensiones: { ancho: 100, alto: 100 } }), 2026).mostrarNombre).toBe(true)
  })

  it('un logo sin dimensiones mantiene el nombre y usa 35px', () => {
    const pie = construirPie(con({ logo: 'https://x/l.png' }), 2026)
    expect(pie.logo?.conDimensiones).toBe(false)
    expect(pie.mostrarNombre).toBe(true)
    expect(pie.altosLogo.escritorio).toBe(35)
  })

  it('arma teléfono, email e Instagram saneado', () => {
    const pie = construirPie(
      con({ contacto: { telefono: '+56 9 1234 5678', email: 'a@b.cl' }, redes: { instagram: '@el_trigal/../x' } }),
      2026,
    )
    expect(pie.contacto.map((c) => c.href)).toEqual(['tel:+56 9 1234 5678', 'mailto:a%40b.cl', 'https://instagram.com/el_trigal..x'])
    expect(pie.contacto[2].texto).toBe('@el_trigal..x')
  })

  it('rechaza un email inseguro y omite lo que no existe', () => {
    const pie = construirPie(con({ contacto: { telefono: '', email: 'a@b.cl?cc=x' } }), 2026)
    expect(pie.contacto).toEqual([])
  })
})
