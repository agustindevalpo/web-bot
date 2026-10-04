import {
  buildHorariosBanda,
  buildListaServicios,
  columnasLista,
  nombresDeServicios,
  ROTULO_HORARIOS,
} from '@/components/templates/servicios/sections'
import { filtrarSecciones } from '@/components/templates/shared/navegacion'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

function config(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Clínica Dental Sonrisas',
    contacto: { telefono: '+56 9 8765 4321' },
    ...overrides,
  } as SiteConfigDTO
}

describe('servicios/sections — columnasLista', () => {
  it.each([
    [true, true, '72px 1fr 1.15fr 200px'],
    [true, false, '72px 1fr 200px'],
    [false, true, '1fr 1.15fr 200px'],
    [false, false, '1fr 200px'],
  ])('conNumero=%s, hayDescripciones=%s → %s', (conNumero, hayDescripciones, esperado) => {
    expect(columnasLista(conNumero, hayDescripciones)).toBe(esperado)
  })
})

describe('servicios/sections — buildListaServicios', () => {
  it('retorna null sin servicios utilizables', () => {
    expect(buildListaServicios(config())).toBeNull()
    expect(buildListaServicios(config({ servicios: [] }))).toBeNull()
    expect(buildListaServicios(config({ servicios: ['   ', { nombre: '' }] as never }))).toBeNull()
  })

  it('H2 "Servicios y precios" si algún servicio trae precioDesde', () => {
    const lista = buildListaServicios(config({ servicios: ['Corte', { nombre: 'Tinte', precioDesde: '$35.000' }] as never }))
    expect(lista?.titulo).toBe('Servicios y precios')
    expect(lista?.eyebrow).toBe('Servicios')
  })

  it('H2 "Nuestros servicios" si ninguno trae precio', () => {
    const lista = buildListaServicios(config({ servicios: ['Corte', 'Tinte'] as never }))
    expect(lista?.titulo).toBe('Nuestros servicios')
  })

  it('numera 01, 02… y arma columnas con descripción cuando alguna existe', () => {
    const lista = buildListaServicios(
      config({ servicios: [{ nombre: 'Corte', descripcion: 'Con lavado.' }, 'Tinte'] as never }),
    )
    expect(lista?.filas.map((fila) => fila.numero)).toEqual(['01', '02'])
    expect(lista?.hayDescripciones).toBe(true)
    expect(lista?.columnas).toBe('72px 1fr 1.15fr 200px')
  })

  it('sin descripciones usa tres columnas', () => {
    const lista = buildListaServicios(config({ servicios: ['Corte', 'Tinte'] as never }))
    expect(lista?.hayDescripciones).toBe(false)
    expect(lista?.columnas).toBe('72px 1fr 200px')
  })

  it('un solo servicio: fila sin número y sin celda de número en las columnas', () => {
    const conDescripcion = buildListaServicios(config({ servicios: [{ nombre: 'Consulta', descripcion: 'Evaluación.' }] as never }))
    expect(conDescripcion?.filas).toHaveLength(1)
    expect(conDescripcion?.filas[0].numero).toBeNull()
    expect(conDescripcion?.columnas).toBe('1fr 1.15fr 200px')

    const sinDescripcion = buildListaServicios(config({ servicios: ['Consulta'] as never }))
    expect(sinDescripcion?.columnas).toBe('1fr 200px')
    expect(sinDescripcion?.titulo).toBe('Nuestros servicios')
  })

  it('imprime el precio tal cual; sin precio queda null (el componente pinta "Agendar →")', () => {
    const lista = buildListaServicios(config({ servicios: [{ nombre: 'Tinte', precioDesde: '$35.000' }, 'Corte'] as never }))
    expect(lista?.filas[0].precio).toBe('$35.000')
    expect(lista?.filas[1].precio).toBeNull()
  })

  it('el WhatsApp de cada fila precarga el servicio', () => {
    const lista = buildListaServicios(config({ servicios: ['Corte de pelo'] as never }))
    expect(lista?.filas[0].whatsappUrl).toBe(
      `https://wa.me/56987654321?text=${encodeURIComponent('Hola, quiero agendar Corte de pelo')}`,
    )
  })

  it('sin teléfono no hay enlace de WhatsApp', () => {
    const lista = buildListaServicios({ nombre: 'X', servicios: ['Corte'] } as never)
    expect(lista?.filas[0].whatsappUrl).toBeNull()
  })

  it('nombresDeServicios alimenta el select del formulario', () => {
    const lista = buildListaServicios(config({ servicios: ['Corte', { nombre: 'Tinte' }] as never }))
    expect(nombresDeServicios(lista)).toEqual(['Corte', 'Tinte'])
    expect(nombresDeServicios(null)).toEqual([])
  })
})

describe('servicios/sections — buildHorariosBanda', () => {
  const horario = (dia: string) => ({ dia, rango: '09:00 – 18:00' })

  it('rótulo fijo "Horarios"', () => {
    expect(ROTULO_HORARIOS).toBe('Horarios')
  })

  it.each([1, 2, 3])('con %i entradas arma la banda (valor = rango, etiqueta = día)', (cantidad) => {
    const horarios = ['Lun – Vie', 'Sábado', 'Domingo'].slice(0, cantidad).map(horario)
    const banda = buildHorariosBanda(config({ horarios } as never))
    expect(banda).toHaveLength(cantidad)
    expect(banda[0]).toEqual({ valor: '09:00 – 18:00', etiqueta: 'Lun – Vie' })
  })

  it('con más de 3 entradas no hay banda', () => {
    const horarios = ['Lun', 'Mar', 'Mié', 'Jue'].map(horario)
    expect(buildHorariosBanda(config({ horarios } as never))).toEqual([])
  })

  it('sin horarios no hay banda', () => {
    expect(buildHorariosBanda(config())).toEqual([])
  })
})

describe('servicios — navegación', () => {
  const nav = (cfg: SiteConfigDTO) =>
    filtrarSecciones([
      { id: 'inicio', etiqueta: 'Inicio', contenido: 'x' },
      { id: 'servicios', etiqueta: 'Servicios', contenido: buildListaServicios(cfg) && 'x' },
      { id: 'nosotros', etiqueta: 'Nosotros', contenido: 'x' },
      { id: 'contacto', etiqueta: 'Contacto', contenido: 'x' },
    ]).map((seccion) => seccion.etiqueta)

  it('con servicios: Inicio · Servicios · Nosotros · Contacto', () => {
    expect(nav(config({ servicios: ['Corte'] as never }))).toEqual(['Inicio', 'Servicios', 'Nosotros', 'Contacto'])
  })

  it('sin servicios: la etiqueta "Servicios" sale del nav', () => {
    expect(nav(config())).toEqual(['Inicio', 'Nosotros', 'Contacto'])
  })
})
