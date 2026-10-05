import {
  AVANCE_BASE,
  AVANCE_TECHO_ANTES_DEL_PAGO,
  TAREAS_POR_PLANTILLA,
  calcularAvance,
  estadoDeTareas,
  tareasDePlantilla,
} from '@/application/shared/avanceSitio'

// Ejemplos de 03-CHAT-Y-MOMENTO-2.md, sección (i): base 35 %, suma completa por
// tarea con al menos una respuesta y techo de 80 % antes del pago.

const servicio = (descripcion?: string, precioDesde?: string) => ({ nombre: 'Corte', descripcion, precioDesde })

const configMinima = { nombre: 'Peluquería Ana', servicios: ['Corte', 'Tinte'], highlight: '' }

describe('tabla de tareas por plantilla (d) con los pesos de (i)', () => {
  it('LANDING: servicios 20, quién está detrás 15, frase 10', () => {
    expect(TAREAS_POR_PLANTILLA.LANDING).toEqual([
      { id: 'servicios', peso: 20 },
      { id: 'nosotros', peso: 15 },
      { id: 'frase', peso: 10 },
    ])
  })

  it('SERVICIOS: servicios 15, horarios 10, quién está detrás 10, frase 10', () => {
    expect(TAREAS_POR_PLANTILLA.SERVICIOS).toEqual([
      { id: 'servicios', peso: 15 },
      { id: 'horarios', peso: 10 },
      { id: 'nosotros', peso: 10 },
      { id: 'frase', peso: 10 },
    ])
  })

  it('LANDING tiene 3 tareas y SERVICIOS 4', () => {
    expect(TAREAS_POR_PLANTILLA.LANDING).toHaveLength(3)
    expect(TAREAS_POR_PLANTILLA.SERVICIOS).toHaveLength(4)
  })

  it.each(['LANDING', 'SERVICIOS'] as const)('%s reparte 45 puntos de texto: base 35 + 45 = techo de 80', (plantilla) => {
    const total = TAREAS_POR_PLANTILLA[plantilla].reduce((suma, tarea) => suma + tarea.peso, 0)
    expect(total).toBe(45)
    expect(AVANCE_BASE + total).toBe(AVANCE_TECHO_ANTES_DEL_PAGO)
  })

  it.each(['RESTAURANTE', 'PORTFOLIO', 'TIENDA', undefined, null, 'DESCONOCIDA'])(
    'la plantilla %s usa la tabla de LANDING hasta su capítulo',
    (plantilla) => {
      expect(tareasDePlantilla(plantilla)).toBe(TAREAS_POR_PLANTILLA.LANDING)
    },
  )
})

describe('calcularAvance', () => {
  it('sin ninguna tarea de momento 2 queda en la base de 35 %', () => {
    expect(calcularAvance(configMinima, 'LANDING')).toBe(35)
    expect(calcularAvance(configMinima, 'SERVICIOS')).toBe(35)
  })

  it('nunca explota con configuraciones de forma inesperada: cae a la base', () => {
    for (const config of [undefined, null, 'texto', 42, [], {}, { servicios: 'Corte', horarios: 3, sobreNosotrosPartes: [] }]) {
      expect(calcularAvance(config, 'SERVICIOS')).toBe(35)
    }
  })

  describe('LANDING', () => {
    it('describir los servicios suma 20 (35 → 55)', () => {
      expect(calcularAvance({ servicios: [servicio('Corte clásico')] }, 'LANDING')).toBe(55)
    })

    it('quién está detrás suma 15 (35 → 50)', () => {
      expect(calcularAvance({ sobreNosotrosPartes: { desde: '2015' } }, 'LANDING')).toBe(50)
    })

    it('la frase de un cliente suma 10 (35 → 45)', () => {
      expect(calcularAvance({ highlight: 'Excelente atención' }, 'LANDING')).toBe(45)
    })

    it('las tres tareas llegan al techo de 80', () => {
      const config = {
        servicios: [servicio('Corte clásico')],
        sobreNosotrosPartes: { quien: 'Ana' },
        highlight: 'Excelente atención',
      }
      expect(calcularAvance(config, 'LANDING')).toBe(80)
    })

    it('horarios y precio no cuentan en LANDING', () => {
      const config = {
        servicios: [servicio(undefined, 'Desde $10.000')],
        horarios: [{ dia: 'Lunes a viernes', rango: '9 a 18' }],
      }
      expect(calcularAvance(config, 'LANDING')).toBe(35)
    })
  })

  describe('SERVICIOS', () => {
    it('describir los servicios suma 15 (35 → 50)', () => {
      expect(calcularAvance({ servicios: [servicio('Corte clásico')] }, 'SERVICIOS')).toBe(50)
    })

    it('un precio sin descripción también es una respuesta de la tarea de servicios', () => {
      expect(calcularAvance({ servicios: [servicio(undefined, 'Desde $10.000')] }, 'SERVICIOS')).toBe(50)
    })

    it('horarios suma 10 (35 → 45)', () => {
      expect(calcularAvance({ horarios: [{ dia: 'Sábado', rango: '10 a 14' }] }, 'SERVICIOS')).toBe(45)
    })

    it('quién está detrás suma 10 (35 → 45)', () => {
      expect(calcularAvance({ sobreNosotrosPartes: { distinto: 'Atención personalizada' } }, 'SERVICIOS')).toBe(45)
    })

    it('la frase suma 10 (35 → 45)', () => {
      expect(calcularAvance({ highlight: 'Excelente atención' }, 'SERVICIOS')).toBe(45)
    })

    it('las cuatro tareas llegan al techo de 80', () => {
      const config = {
        servicios: [servicio('Corte clásico', 'Desde $10.000')],
        horarios: [{ dia: 'Sábado', rango: '10 a 14' }],
        sobreNosotrosPartes: { desde: '2015' },
        highlight: 'Excelente atención',
      }
      expect(calcularAvance(config, 'SERVICIOS')).toBe(80)
    })
  })

  describe('regla de suma: una tarea suma completa con al menos una respuesta', () => {
    it('describir 1 de 4 servicios suma lo mismo que describir los 4', () => {
      const nombres = ['A', 'B', 'C', 'D']
      const una = nombres.map((nombre, i) => ({ nombre, descripcion: i === 0 ? 'Algo' : undefined }))
      const todas = nombres.map((nombre) => ({ nombre, descripcion: 'Algo' }))
      expect(calcularAvance({ servicios: una }, 'SERVICIOS')).toBe(calcularAvance({ servicios: todas }, 'SERVICIOS'))
      expect(calcularAvance({ servicios: una }, 'LANDING')).toBe(calcularAvance({ servicios: todas }, 'LANDING'))
    })

    it('una sola parte de Nosotros suma lo mismo que las tres', () => {
      expect(calcularAvance({ sobreNosotrosPartes: { desde: '2015' } }, 'LANDING')).toBe(
        calcularAvance({ sobreNosotrosPartes: { desde: '2015', quien: 'Ana', distinto: 'Todo' } }, 'LANDING'),
      )
    })

    it('la frase suma aunque no tenga autor', () => {
      expect(calcularAvance({ highlight: 'Muy buen servicio', highlightAutor: undefined }, 'LANDING')).toBe(45)
    })

    it('el resultado es siempre un entero: sin decimales como 47 %', () => {
      const config = { servicios: [servicio('Algo'), servicio()], horarios: [{ dia: 'Sábado', rango: '10 a 14' }] }
      for (const plantilla of ['LANDING', 'SERVICIOS']) {
        expect(Number.isInteger(calcularAvance(config, plantilla))).toBe(true)
      }
    })
  })

  describe('lo vacío no cuenta', () => {
    it('textos en blanco o solo espacios no suman', () => {
      const config = {
        servicios: [servicio('   ', '  ')],
        horarios: [{ dia: '  ', rango: '' }],
        sobreNosotrosPartes: { desde: ' ', quien: '', distinto: '\n' },
        highlight: '   ',
      }
      expect(calcularAvance(config, 'SERVICIOS')).toBe(35)
    })

    it('un horario con solo día o solo rango no suma: la plantilla no lo dibuja', () => {
      expect(calcularAvance({ horarios: [{ dia: 'Sábado', rango: '' }] }, 'SERVICIOS')).toBe(35)
      expect(calcularAvance({ horarios: [{ dia: '', rango: '10 a 14' }] }, 'SERVICIOS')).toBe(35)
    })

    it('servicios en forma legada (strings) no tienen descripción', () => {
      expect(calcularAvance({ servicios: ['Corte', 'Tinte'] }, 'LANDING')).toBe(35)
    })
  })

  describe('techo de 80 % antes del pago', () => {
    it('nunca supera 80 ni llega a 100, con cualquier combinación', () => {
      const todo = {
        servicios: [servicio('a', 'b')],
        horarios: [{ dia: 'a', rango: 'b' }],
        sobreNosotrosPartes: { desde: 'a', quien: 'b', distinto: 'c' },
        highlight: 'x',
        logo: 'https://ejemplo.cl/logo.png',
        imagenes: ['https://ejemplo.cl/a.jpg'],
      }
      for (const plantilla of ['LANDING', 'SERVICIOS', 'RESTAURANTE', undefined]) {
        const avance = calcularAvance(todo, plantilla)
        expect(avance).toBe(80)
        expect(avance).toBeLessThan(100)
      }
    })

    it('el logo y las fotos no suman antes del pago', () => {
      expect(calcularAvance({ logo: 'https://ejemplo.cl/logo.png', imagenes: ['https://ejemplo.cl/a.jpg'] }, 'LANDING')).toBe(35)
    })
  })

  describe('tareas omitidas (momento2Omitidas)', () => {
    it('omitir no suma ni resta', () => {
      expect(calcularAvance({ momento2Omitidas: ['servicios', 'horarios', 'nosotros', 'frase'] }, 'SERVICIOS')).toBe(35)
    })

    it('una tarea omitida y respondida después sí suma', () => {
      expect(calcularAvance({ momento2Omitidas: ['frase'], highlight: 'Excelente' }, 'LANDING')).toBe(45)
    })

    it('un momento2Omitidas con forma inválida se ignora', () => {
      expect(calcularAvance({ momento2Omitidas: 'frase' }, 'LANDING')).toBe(35)
      expect(calcularAvance({ momento2Omitidas: [1, null] }, 'LANDING')).toBe(35)
    })
  })
})

describe('estadoDeTareas', () => {
  it('distingue completa, omitida y pendiente en el orden de las pantallas', () => {
    const config = {
      servicios: [servicio('Corte clásico')],
      momento2Omitidas: ['horarios', 'servicios'],
    }
    expect(estadoDeTareas(config, 'SERVICIOS')).toEqual([
      { id: 'servicios', peso: 15, estado: 'completa' },
      { id: 'horarios', peso: 10, estado: 'omitida' },
      { id: 'nosotros', peso: 10, estado: 'pendiente' },
      { id: 'frase', peso: 10, estado: 'pendiente' },
    ])
  })

  it('una LANDING nunca incluye la tarea de horarios', () => {
    expect(estadoDeTareas({}, 'LANDING').map((tarea) => tarea.id)).toEqual(['servicios', 'nosotros', 'frase'])
  })

  it('un id de otra plantilla en momento2Omitidas no afecta a la LANDING', () => {
    const estados = estadoDeTareas({ momento2Omitidas: ['horarios'] }, 'LANDING')
    expect(estados.every((tarea) => tarea.estado === 'pendiente')).toBe(true)
  })
})
