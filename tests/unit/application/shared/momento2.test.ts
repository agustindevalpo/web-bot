import {
  HORARIOS_MAX,
  LIMITES_MOMENTO2,
  aplicarTarea,
  construirVistaMomento2,
  omitirTarea,
  tareaPerteneceAPlantilla,
  validarTarea,
  valoresIniciales,
  type DatosTarea,
} from '@/application/shared/momento2'
import { calcularAvance } from '@/application/shared/avanceSitio'

function datosValidos(tarea: string, valores: unknown, plantilla = 'SERVICIOS'): DatosTarea {
  const resultado = validarTarea(tarea, valores, plantilla)
  if (!resultado.ok) throw new Error(`esperaba válido: ${resultado.error}`)
  return resultado.datos
}

const largo = (n: number) => 'a'.repeat(n)

describe('validarTarea', () => {
  it('rechaza tareas desconocidas y las que la plantilla no pide', () => {
    expect(validarTarea('destacados', {}, 'SERVICIOS')).toEqual({ ok: false, error: 'tarea_invalida' })
    expect(validarTarea('horarios', { filas: [{ dia: 'Lunes', rango: '9' }] }, 'LANDING')).toEqual({
      ok: false,
      error: 'tarea_invalida',
    })
    expect(tareaPerteneceAPlantilla('horarios', 'LANDING')).toBe(false)
    expect(tareaPerteneceAPlantilla('horarios', 'SERVICIOS')).toBe(true)
    // Plantillas sin tabla propia usan la de LANDING.
    expect(tareaPerteneceAPlantilla('horarios', 'TIENDA')).toBe(false)
  })

  it('rechaza valores que no son un objeto', () => {
    for (const valores of [null, undefined, 'x', 3, ['a']]) {
      expect(validarTarea('frase', valores, 'LANDING')).toEqual({ ok: false, error: 'valores_invalidos' })
    }
  })

  it('servicios: recorta, colapsa espacios y quita caracteres de control', () => {
    const datos = datosValidos('servicios', {
      filas: [{ descripcion: '  Corte \n  y   peinado\u0000 ', precioDesde: ' Desde $25.000 ' }],
    })
    expect(datos).toEqual({ tarea: 'servicios', filas: [{ descripcion: 'Corte y peinado', precioDesde: 'Desde $25.000' }] })
  })

  it('servicios en LANDING ignora el precio (null: no se toca la clave)', () => {
    const datos = datosValidos('servicios', { filas: [{ descripcion: 'Algo', precioDesde: '$1' }] }, 'LANDING')
    expect(datos).toEqual({ tarea: 'servicios', filas: [{ descripcion: 'Algo', precioDesde: null }] })
  })

  it('servicios: un precio sin descripción cuenta como respuesta en SERVICIOS pero no en LANDING', () => {
    expect(validarTarea('servicios', { filas: [{ precioDesde: '$1' }] }, 'SERVICIOS').ok).toBe(true)
    expect(validarTarea('servicios', { filas: [{ precioDesde: '$1' }] }, 'LANDING')).toEqual({ ok: false, error: 'vacia' })
  })

  it('servicios: aplica los largos máximos de la spec (90 y 20) y el límite se acepta justo', () => {
    expect(validarTarea('servicios', { filas: [{ descripcion: largo(LIMITES_MOMENTO2.descripcion) }] }, 'SERVICIOS').ok).toBe(true)
    expect(validarTarea('servicios', { filas: [{ descripcion: largo(91) }] }, 'SERVICIOS')).toEqual({
      ok: false,
      error: 'demasiado_largo',
    })
    expect(validarTarea('servicios', { filas: [{ descripcion: 'x', precioDesde: largo(21) }] }, 'SERVICIOS')).toEqual({
      ok: false,
      error: 'demasiado_largo',
    })
  })

  it('servicios: filas mal formadas o campos que no son texto son inválidos', () => {
    expect(validarTarea('servicios', { filas: 'x' }, 'SERVICIOS')).toEqual({ ok: false, error: 'valores_invalidos' })
    expect(validarTarea('servicios', { filas: [null] }, 'SERVICIOS')).toEqual({ ok: false, error: 'valores_invalidos' })
    expect(validarTarea('servicios', { filas: [{ descripcion: 5 }] }, 'SERVICIOS')).toEqual({
      ok: false,
      error: 'valores_invalidos',
    })
  })

  it('una tarea sin ninguna respuesta es vacía (la única salida es omitir)', () => {
    expect(validarTarea('servicios', { filas: [{ descripcion: '  ' }, {}] }, 'SERVICIOS')).toEqual({ ok: false, error: 'vacia' })
    expect(validarTarea('nosotros', { desde: '', quien: ' ' }, 'LANDING')).toEqual({ ok: false, error: 'vacia' })
    expect(validarTarea('frase', { autor: 'Ana' }, 'LANDING')).toEqual({ ok: false, error: 'vacia' })
    expect(validarTarea('horarios', { filas: [{ dia: '', rango: '' }] }, 'SERVICIOS')).toEqual({ ok: false, error: 'vacia' })
  })

  it('horarios: descarta filas vacías, guarda el texto tal cual y exige días y horario juntos', () => {
    const datos = datosValidos('horarios', {
      filas: [
        { dia: 'Lunes a viernes', rango: '9:00 a 18:00' },
        { dia: '', rango: '' },
        { dia: 'Sábado', rango: 'Con hora' },
      ],
    })
    expect(datos).toEqual({
      tarea: 'horarios',
      filas: [
        { dia: 'Lunes a viernes', rango: '9:00 a 18:00' },
        { dia: 'Sábado', rango: 'Con hora' },
      ],
    })
    expect(validarTarea('horarios', { filas: [{ dia: 'Lunes', rango: '' }] }, 'SERVICIOS')).toEqual({
      ok: false,
      error: 'horario_incompleto',
    })
  })

  it('horarios: máximo tres filas y 30 caracteres por campo', () => {
    const fila = { dia: 'Lunes', rango: '9 a 18' }
    expect(HORARIOS_MAX).toBe(3)
    expect(validarTarea('horarios', { filas: [fila, fila, fila] }, 'SERVICIOS').ok).toBe(true)
    expect(validarTarea('horarios', { filas: [fila, fila, fila, fila] }, 'SERVICIOS')).toEqual({
      ok: false,
      error: 'valores_invalidos',
    })
    expect(validarTarea('horarios', { filas: [{ dia: largo(31), rango: 'x' }] }, 'SERVICIOS')).toEqual({
      ok: false,
      error: 'demasiado_largo',
    })
    expect(validarTarea('horarios', { filas: [{ dia: 'x', rango: largo(31) }] }, 'SERVICIOS')).toEqual({
      ok: false,
      error: 'demasiado_largo',
    })
  })

  it('nosotros: basta una parte y cada una admite 80 caracteres', () => {
    expect(datosValidos('nosotros', { quien: ' Ana ' }, 'LANDING')).toEqual({
      tarea: 'nosotros',
      desde: '',
      quien: 'Ana',
      distinto: '',
    })
    expect(validarTarea('nosotros', { desde: largo(80) }, 'LANDING').ok).toBe(true)
    expect(validarTarea('nosotros', { distinto: largo(81) }, 'LANDING')).toEqual({ ok: false, error: 'demasiado_largo' })
  })

  it('frase: 160 caracteres, autor 40 y relación 40; para sumar basta la frase', () => {
    expect(datosValidos('frase', { frase: largo(160) }, 'LANDING')).toMatchObject({ autor: '', relacion: '' })
    expect(validarTarea('frase', { frase: largo(161) }, 'LANDING')).toEqual({ ok: false, error: 'demasiado_largo' })
    expect(validarTarea('frase', { frase: 'x', autor: largo(41) }, 'LANDING')).toEqual({ ok: false, error: 'demasiado_largo' })
    expect(validarTarea('frase', { frase: 'x', relacion: largo(41) }, 'LANDING')).toEqual({
      ok: false,
      error: 'demasiado_largo',
    })
  })
})

describe('aplicarTarea: merge defensivo', () => {
  const base = (): Record<string, unknown> => ({
    nombre: 'Peluquería Ana',
    template: 'SERVICIOS',
    servicios: ['Corte', { nombre: 'Color', foto: 'https://x/foto.jpg', descripcion: 'vieja', precioDesde: '$1' }],
    contacto: { telefono: '+56912345678', email: 'a@b.cl', formulario: { habilitado: true } },
    destacados: [{ valor: '10', etiqueta: 'años' }],
    logo: 'https://x/logo.png',
  })

  it('servicios: escribe descripción y precio por posición sin tocar nombres, fotos ni claves ajenas', () => {
    const config = base()
    const resultado = aplicarTarea(
      config,
      datosValidos('servicios', {
        filas: [
          { descripcion: 'Corte de pelo', precioDesde: '$15.000' },
          { descripcion: 'Color completo', precioDesde: '' },
        ],
      }),
    )

    expect(resultado.servicios).toEqual([
      { nombre: 'Corte', descripcion: 'Corte de pelo', precioDesde: '$15.000' },
      { nombre: 'Color', foto: 'https://x/foto.jpg', descripcion: 'Color completo' },
    ])
    expect(resultado.contacto).toEqual(config.contacto)
    expect(resultado.destacados).toEqual(config.destacados)
    expect(resultado.logo).toBe('https://x/logo.png')
    // No muta la entrada.
    expect(config.servicios).toEqual(base().servicios)
  })

  it('servicios: un campo vacío quita solo esa clave, y un nombre sin datos vuelve a su forma de texto', () => {
    const config = { ...base(), servicios: [{ nombre: 'Corte', descripcion: 'x' }, 'Color'] }
    const resultado = aplicarTarea(
      config,
      datosValidos('servicios', { filas: [{ descripcion: '', precioDesde: '$1' }, { descripcion: '' }] }),
    )
    expect(resultado.servicios).toEqual([{ nombre: 'Corte', precioDesde: '$1' }, 'Color'])
  })

  it('servicios en LANDING no toca precioDesde', () => {
    const config = { ...base(), template: 'LANDING' }
    const resultado = aplicarTarea(
      config,
      datosValidos('servicios', { filas: [{ descripcion: 'a' }, { descripcion: 'b', precioDesde: '$999' }] }, 'LANDING'),
    )
    expect((resultado.servicios as Record<string, unknown>[])[1]).toMatchObject({ precioDesde: '$1', descripcion: 'b' })
  })

  it('servicios: filas de más se ignoran, filas de menos dejan el resto como está, entradas raras se respetan', () => {
    const config = { ...base(), servicios: ['Corte', 42, null, 'Color'] }
    const resultado = aplicarTarea(
      config,
      datosValidos('servicios', { filas: [{ descripcion: 'a' }, { descripcion: 'b' }, { descripcion: 'c' }] }),
    )
    expect(resultado.servicios).toEqual([{ nombre: 'Corte', descripcion: 'a' }, 42, null, 'Color'])
  })

  it('servicios sin lista de servicios en la config no inventa nada', () => {
    const config = { nombre: 'X' }
    expect(aplicarTarea(config, datosValidos('servicios', { filas: [{ descripcion: 'a' }] }))).toEqual({ nombre: 'X' })
  })

  it('horarios: reemplaza la lista completa', () => {
    const config: Record<string, unknown> = { ...base(), horarios: [{ dia: 'viejo', rango: 'viejo' }] }
    const resultado = aplicarTarea(config, datosValidos('horarios', { filas: [{ dia: 'Sábado', rango: '10 a 14' }] }))
    expect(resultado.horarios).toEqual([{ dia: 'Sábado', rango: '10 a 14' }])
    expect(resultado.contacto).toEqual(config.contacto)
  })

  it('nosotros: las partes vacías se quitan y una clave ajena dentro del objeto se conserva', () => {
    const config = { ...base(), sobreNosotrosPartes: { desde: '2010', quien: 'Ana', extra: 'x' } }
    const resultado = aplicarTarea(
      config,
      datosValidos('nosotros', { desde: '', quien: 'Ana y Luis', distinto: 'Atención sin hora' }),
    )
    expect(resultado.sobreNosotrosPartes).toEqual({ quien: 'Ana y Luis', distinto: 'Atención sin hora', extra: 'x' })
  })

  it('frase: escribe highlight y el autor con su relación como cargo', () => {
    const resultado = aplicarTarea(
      base(),
      datosValidos('frase', { frase: 'Me atendieron excelente', autor: 'Carla', relacion: 'clienta desde 2020' }),
    )
    expect(resultado.highlight).toBe('Me atendieron excelente')
    expect(resultado.highlightAutor).toEqual({ nombre: 'Carla', cargo: 'clienta desde 2020' })
  })

  it('frase: sin autor quita la atribución anterior; sin relación quita el cargo', () => {
    const config = { ...base(), highlight: 'vieja', highlightAutor: { nombre: 'Carla', cargo: 'x' } }
    expect(aplicarTarea(config, datosValidos('frase', { frase: 'nueva' })).highlightAutor).toBeUndefined()
    expect('highlightAutor' in aplicarTarea(config, datosValidos('frase', { frase: 'nueva' }))).toBe(false)
    expect(aplicarTarea(config, datosValidos('frase', { frase: 'nueva', autor: 'Luis' })).highlightAutor).toEqual({
      nombre: 'Luis',
    })
  })

  it('el avance sube con cada tarea guardada y no pasa de 80', () => {
    let config: Record<string, unknown> = { ...base(), servicios: ['Corte', 'Color'] }
    expect(calcularAvance(config, 'SERVICIOS')).toBe(35)
    config = aplicarTarea(config, datosValidos('servicios', { filas: [{ descripcion: 'a' }] }))
    expect(calcularAvance(config, 'SERVICIOS')).toBe(50)
    config = aplicarTarea(config, datosValidos('horarios', { filas: [{ dia: 'L', rango: '9' }] }))
    config = aplicarTarea(config, datosValidos('nosotros', { quien: 'Ana' }))
    config = aplicarTarea(config, datosValidos('frase', { frase: 'Bien' }))
    expect(calcularAvance(config, 'SERVICIOS')).toBe(80)
  })
})

describe('omitirTarea', () => {
  it('registra el id sin tocar nada más y es idempotente', () => {
    const config = { nombre: 'X', servicios: ['a'] }
    const una = omitirTarea(config, 'horarios')
    expect(una).toEqual({ nombre: 'X', servicios: ['a'], momento2Omitidas: ['horarios'] })
    const dos = omitirTarea(una, 'horarios')
    expect(dos).toBe(una)
    expect(omitirTarea(una, 'frase').momento2Omitidas).toEqual(['horarios', 'frase'])
  })

  it('descarta valores que no son texto en una lista existente', () => {
    expect(omitirTarea({ momento2Omitidas: ['frase', 3, null] }, 'nosotros').momento2Omitidas).toEqual(['frase', 'nosotros'])
    expect(omitirTarea({ momento2Omitidas: 'roto' }, 'nosotros').momento2Omitidas).toEqual(['nosotros'])
  })
})

describe('valoresIniciales y construirVistaMomento2', () => {
  const config = {
    template: 'SERVICIOS',
    servicios: ['Corte', { nombre: 'Color', descripcion: 'Color completo', precioDesde: '$30.000' }, { nombre: 'Peinado' }],
    horarios: [
      { dia: 'Lunes', rango: '9 a 18' },
      { dia: 'Sábado', rango: '' },
    ],
    sobreNosotrosPartes: { quien: 'Ana' },
    highlight: 'Excelente',
    highlightAutor: { nombre: 'Carla', cargo: 'clienta' },
    momento2Omitidas: ['nosotros'],
  }

  it('lee los valores editables en el orden del sitio', () => {
    const iniciales = valoresIniciales(config)
    expect(iniciales.servicios).toEqual([
      { nombre: 'Corte', descripcion: '', precioDesde: '' },
      { nombre: 'Color', descripcion: 'Color completo', precioDesde: '$30.000' },
      { nombre: 'Peinado', descripcion: '', precioDesde: '' },
    ])
    expect(iniciales.nosotros).toEqual({ desde: '', quien: 'Ana', distinto: '' })
    expect(iniciales.frase).toEqual({ frase: 'Excelente', autor: 'Carla', relacion: 'clienta' })
  })

  it('la vista resume avance, estado por tarea y los detalles del resumen', () => {
    const vista = construirVistaMomento2(config, 'SERVICIOS')
    expect(vista.avance).toBe(35 + 15 + 10 + 10 + 10)
    expect(vista.tareas.map((tarea) => [tarea.id, tarea.estado])).toEqual([
      ['servicios', 'completa'],
      ['horarios', 'completa'],
      ['nosotros', 'completa'],
      ['frase', 'completa'],
    ])
    expect(vista.serviciosTotal).toBe(3)
    expect(vista.sinDescripcion).toEqual(['Corte', 'Peinado'])
    // Solo cuenta el horario con días y rango.
    expect(vista.horarios).toBe(1)
  })

  it('una tarea sin respuesta que se omitió figura como omitida, y las demás como pendientes', () => {
    const vista = construirVistaMomento2({ servicios: ['a'], momento2Omitidas: ['frase'] }, 'LANDING')
    expect(vista.tareas.map((tarea) => [tarea.id, tarea.estado])).toEqual([
      ['servicios', 'pendiente'],
      ['nosotros', 'pendiente'],
      ['frase', 'omitida'],
    ])
    expect(vista.avance).toBe(35)
  })

  it('tolera una config que no es un objeto', () => {
    expect(construirVistaMomento2(null, 'LANDING').avance).toBe(35)
    expect(valoresIniciales('roto').servicios).toEqual([])
  })
})
