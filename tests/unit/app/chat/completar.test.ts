import {
  HORARIO_VACIO,
  agregarHorario,
  cargaDeTarea,
  estadoDeGuardado,
  formularioInicial,
  puedeAgregarHorario,
} from '@/app/chat/completar/formulario'
import {
  accionDeTarea,
  avisoGuardado,
  ayudaDeTarea,
  detalleDeTarea,
  lineaFaltante,
  pantallaInicial,
  textoAntesala,
  tituloResumen,
  zonasAntesala,
} from '@/app/chat/completar/textos'
import { construirVistaMomento2, valoresIniciales } from '@/application/shared/momento2'

const CONFIG_SERVICIOS = {
  template: 'SERVICIOS',
  servicios: ['Corte', { nombre: 'Color', descripcion: 'Color completo', precioDesde: '$30.000' }, 'Peinado'],
}

describe('formulario del momento 2', () => {
  it('parte de lo ya guardado y siempre ofrece una fila de horario', () => {
    const formulario = formularioInicial(valoresIniciales(CONFIG_SERVICIOS))
    expect(formulario.servicios).toEqual([
      { descripcion: '', precioDesde: '' },
      { descripcion: 'Color completo', precioDesde: '$30.000' },
      { descripcion: '', precioDesde: '' },
    ])
    expect(formulario.horarios).toEqual([HORARIO_VACIO])
  })

  it('agrega horarios hasta tres y después ya no', () => {
    let horarios = [{ ...HORARIO_VACIO }]
    horarios = agregarHorario(horarios)
    horarios = agregarHorario(horarios)
    expect(horarios).toHaveLength(3)
    expect(puedeAgregarHorario(horarios)).toBe(false)
    expect(agregarHorario(horarios)).toHaveLength(3)
  })

  it('"Guardar" está deshabilitado sin respuestas y se habilita con una', () => {
    const formulario = formularioInicial(valoresIniciales({ template: 'LANDING', servicios: ['Corte'] }))
    expect(estadoDeGuardado('servicios', formulario, 'LANDING')).toEqual({ puede: false, error: 'vacia' })

    formulario.servicios[0].descripcion = 'Corte de pelo'
    expect(estadoDeGuardado('servicios', formulario, 'LANDING')).toEqual({ puede: true })
  })

  it('un horario a medias no se puede guardar', () => {
    const formulario = formularioInicial(valoresIniciales({ template: 'SERVICIOS', servicios: [] }))
    formulario.horarios[0].dia = 'Lunes'
    expect(estadoDeGuardado('horarios', formulario, 'SERVICIOS')).toEqual({ puede: false, error: 'horario_incompleto' })
    formulario.horarios[0].rango = '9 a 18'
    expect(estadoDeGuardado('horarios', formulario, 'SERVICIOS')).toEqual({ puede: true })
  })

  it('la carga que viaja a la acción es la de la tarea', () => {
    const formulario = formularioInicial(valoresIniciales({ servicios: ['a'] }))
    expect(cargaDeTarea('servicios', formulario)).toEqual({ filas: [{ descripcion: '', precioDesde: '' }] })
    expect(cargaDeTarea('horarios', formulario)).toEqual({ filas: [HORARIO_VACIO] })
    expect(cargaDeTarea('nosotros', formulario)).toEqual({ desde: '', quien: '', distinto: '' })
    expect(cargaDeTarea('frase', formulario)).toEqual({ frase: '', autor: '', relacion: '' })
  })
})

describe('microcopy del momento 2', () => {
  it('la ayuda de servicios cambia según la plantilla', () => {
    expect(ayudaDeTarea('servicios', 'SERVICIOS')).toBe(
      'Una línea por servicio y, si quieres, el precio desde. Lo que dejes vacío no aparece en tu sitio.',
    )
    expect(ayudaDeTarea('servicios', 'LANDING')).toBe('Una línea por servicio. Lo que dejes vacío no aparece en tu sitio.')
  })

  it('el aviso de guardado distingue cuando el porcentaje subió', () => {
    expect(avisoGuardado(50, true)).toBe('Guardado · tu sitio subió a 50 %')
    expect(avisoGuardado(50, false)).toBe('Guardado · tu sitio está al 50 %')
  })

  it('la línea de lo que falta usa singular y plural, y solo en servicios', () => {
    const una = construirVistaMomento2({ template: 'SERVICIOS', servicios: [{ nombre: 'Corte', descripcion: 'x' }, 'Color'] }, 'SERVICIOS')
    expect(lineaFaltante('servicios', una)).toBe(
      'Color sigue sin descripción, y en tu sitio solo se ve su nombre. Puedes volver a este paso cuando quieras.',
    )
    expect(lineaFaltante('horarios', una)).toBeNull()

    const varias = construirVistaMomento2(CONFIG_SERVICIOS, 'SERVICIOS')
    expect(lineaFaltante('servicios', varias)).toBe(
      '2 servicios siguen sin descripción, y en tu sitio solo se ven sus nombres. Puedes volver a este paso cuando quieras.',
    )

    const ninguna = construirVistaMomento2({ servicios: [{ nombre: 'Corte', descripcion: 'x' }] }, 'LANDING')
    expect(lineaFaltante('servicios', ninguna)).toBeNull()
  })

  it('el titular del resumen cambia al 80 %', () => {
    expect(tituloResumen(50)).toBe('Tu sitio está al 50 %')
    expect(tituloResumen(80)).toBe('Completaste todo lo que se puede antes del pago')
  })

  it('las líneas de detalle del resumen', () => {
    const vista = construirVistaMomento2(
      { ...CONFIG_SERVICIOS, horarios: [{ dia: 'L', rango: '9' }], momento2Omitidas: ['frase'] },
      'SERVICIOS',
    )
    const [servicios, horarios, nosotros, frase] = vista.tareas
    expect(detalleDeTarea(servicios, vista)).toBe('1 de 3 descritos')
    expect(detalleDeTarea(horarios, vista)).toBe('1 horario')
    expect(detalleDeTarea(nosotros, vista)).toBe('Pendiente · suma 10 %')
    expect(detalleDeTarea(frase, vista)).toBe('Lo omitiste · suma 10 %')
    expect(accionDeTarea(servicios)).toBe('Editar')
    expect(accionDeTarea(nosotros)).toBe('Responder')
    expect(accionDeTarea(frase)).toBe('Responder')
  })

  it('la antesala depende de la plantilla y del avance', () => {
    expect(zonasAntesala('LANDING')).toEqual(['Logo', 'Foto principal', 'Una foto por servicio'])
    expect(zonasAntesala('SERVICIOS')).toEqual(['Logo', 'Foto principal', 'El lugar', '3 fotos'])
    expect(textoAntesala('SERVICIOS', 35)).toContain('no muestra fotos del lugar')
    expect(textoAntesala('LANDING', 35)).toContain('muestra tus servicios con números grandes')
    expect(textoAntesala('LANDING', 80)).toBe('Nos los mandas por WhatsApp cuando pagues, y los agregamos antes de publicar.')
  })
})

describe('pantallaInicial', () => {
  it('abre en la primera tarea pendiente y cae en el resumen si no queda ninguna', () => {
    const vacia = construirVistaMomento2({ servicios: ['a'] }, 'LANDING')
    expect(pantallaInicial(vacia.tareas)).toEqual({ tipo: 'tarea', indice: 0 })

    const conServicios = construirVistaMomento2({ servicios: [{ nombre: 'a', descripcion: 'x' }] }, 'LANDING')
    expect(pantallaInicial(conServicios.tareas)).toEqual({ tipo: 'tarea', indice: 1 })

    const sinPendientes = construirVistaMomento2(
      { servicios: [{ nombre: 'a', descripcion: 'x' }], momento2Omitidas: ['nosotros', 'frase'] },
      'LANDING',
    )
    expect(pantallaInicial(sinPendientes.tareas)).toEqual({ tipo: 'resumen' })
  })
})
