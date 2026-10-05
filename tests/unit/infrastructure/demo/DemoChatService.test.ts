import { DemoChatService, sugerenciasServicios } from '@/infrastructure/demo/DemoChatService'
import { MensajeDTO } from '@/application/dtos/MensajeDTO'
import { RUBROS_CONOCIDOS, detectarRubro } from '@/infrastructure/demo/rubroDefaults'
import {
  MENSAJE_FINAL,
  OPCIONES_ESTILO,
  RUBRO_FRASE,
  RUBRO_LABELS,
  SUGERENCIAS_SERVICIOS,
} from '@/infrastructure/demo/guionChat'
import { extraerOpciones } from '@/app/chat/opciones'

function historialDeUsuario(respuestas: string[]): MensajeDTO[] {
  return respuestas.map((contenido) => ({ rol: 'user' as const, contenido, timestamp: new Date() }))
}

describe('DemoChatService', () => {
  let service: DemoChatService

  beforeEach(() => {
    service = new DemoChatService()
  })

  // procesarMensaje recibe el historial ANTES del mensaje actual: la
  // respuesta es la pregunta que sigue a todas las respuestas, la actual
  // incluida.
  const preguntaTras = (previas: string[], actual: string) =>
    service.procesarMensaje(historialDeUsuario(previas), actual)

  describe('guion de seis preguntas', () => {
    const nombre = 'Panadería El Trigal'

    it('tras el nombre, si el rubro se deduce, pide confirmarlo con la frase del rubro (2a)', async () => {
      const { texto, opciones } = extraerOpciones(await preguntaTras([], nombre))

      expect(texto).toBe(`Por el nombre, parece que es ${RUBRO_FRASE.panaderia}. ¿Es correcto?`)
      expect(opciones).toEqual(['Sí, es correcto', 'No, es otra cosa'])
    })

    it('tras confirmar el rubro, pregunta la descripción', async () => {
      const respuesta = await preguntaTras([nombre], 'Sí, es correcto')
      expect(respuesta).toBe('¿A qué se dedica tu negocio? Cuéntalo en una o dos frases.')
    })

    it('tras rechazar el rubro, ofrece las 10 categorías más "Ninguno de estos" (2b)', async () => {
      const { texto, opciones } = extraerOpciones(await preguntaTras([nombre], 'No, es otra cosa'))

      expect(texto).toBe('¿Cuál de estas categorías describe mejor tu negocio?')
      expect(opciones).toEqual([...RUBROS_CONOCIDOS.map((r) => RUBRO_LABELS[r]), 'Ninguno de estos'])
      expect(opciones).toHaveLength(11)
    })

    it('si el rubro no se deduce del nombre, pasa directo a las categorías (2b) sin pedir confirmación', async () => {
      const { texto, opciones } = extraerOpciones(await preguntaTras([], 'Servicios Generales del Sur'))

      expect(texto).toBe('¿Cuál de estas categorías describe mejor tu negocio?')
      expect(opciones).toHaveLength(11)
    })

    it('si el nombre empata entre rubros, también pregunta las categorías', async () => {
      // "Pan y peluquería" suma un punto para panadería y otro para peluquería.
      const { texto } = extraerOpciones(await preguntaTras([], 'Pan y Peluquería Lucía'))
      expect(texto).toBe('¿Cuál de estas categorías describe mejor tu negocio?')
    })

    it('tras elegir una categoría pregunta la descripción, y el resto del guion sigue en orden', async () => {
      const base = ['Servicios Generales del Sur', 'Ninguno de estos']
      expect(await preguntaTras(base.slice(0, 1), base[1])).toBe(
        '¿A qué se dedica tu negocio? Cuéntalo en una o dos frases.',
      )

      const servicios = await preguntaTras([...base, 'Hacemos trámites'], 'Trámites, gestión')
      expect(servicios).toBe('¿En qué ciudad o comuna atiendes?')
    })

    it('la pregunta de servicios lleva el texto de ayuda', async () => {
      const respuesta = await preguntaTras([nombre, 'Sí, es correcto'], 'Hacemos pan')
      expect(respuesta).toBe(
        '¿Cuáles son tus principales servicios?\n\nEscribe los 3 o 4 más importantes, separados por coma.',
      )
    })

    it('pregunta el estilo con las etiquetas exactas (contrato D-29)', async () => {
      const respuesta = await preguntaTras(
        [nombre, 'Sí, es correcto', 'Hacemos pan', 'Pan, tortas', ],
        'Viña del Mar',
      )
      const { texto, opciones } = extraerOpciones(respuesta)

      expect(texto).toBe('¿Qué estilo prefieres para tu sitio?')
      expect(opciones).toEqual(['Moderno y minimalista', 'Cálido y cercano', 'Colorido y llamativo'])
      expect(opciones).toEqual([...OPCIONES_ESTILO])
    })

    it('tras el estilo responde el cierre, sin emoji', async () => {
      const respuesta = await preguntaTras(
        [nombre, 'Sí, es correcto', 'Hacemos pan', 'Pan, tortas', 'Viña del Mar'],
        'Cálido y cercano',
      )
      expect(respuesta).toBe('Listo. Ya tengo lo necesario para armar tu sitio.')
      expect(respuesta).toBe(MENSAJE_FINAL)
    })

    it('ya no pregunta contacto, redes ni algo para destacar', async () => {
      const respuestas = [nombre, 'Sí, es correcto', 'Hacemos pan', 'Pan, tortas', 'Viña del Mar']
      const preguntas: string[] = []
      for (let i = 1; i <= respuestas.length; i++) {
        preguntas.push(await preguntaTras(respuestas.slice(0, i - 1), respuestas[i - 1]))
      }
      const todo = preguntas.join('\n').toLowerCase()

      expect(todo).not.toContain('teléfono')
      expect(todo).not.toContain('redes')
      expect(todo).not.toContain('destacar')
    })
  })

  describe('conversacionCompleta', () => {
    it('con rubro deducido y confirmado exige 6 respuestas (nombre, 2a, descripción, servicios, ciudad, estilo)', () => {
      const completas = ['Panadería El Trigal', 'Sí, es correcto', 'Pan', 'Pan, tortas', 'Viña', 'Cálido y cercano']

      expect(service.conversacionCompleta(historialDeUsuario(completas))).toBe(true)
      expect(service.conversacionCompleta(historialDeUsuario(completas.slice(0, 5)))).toBe(false)
    })

    it('con "No, es otra cosa" exige una respuesta más (2b)', () => {
      const respuestas = [
        'Panadería El Trigal',
        'No, es otra cosa',
        'Ninguno de estos',
        'Pan',
        'Pan, tortas',
        'Viña',
      ]

      expect(service.conversacionCompleta(historialDeUsuario(respuestas))).toBe(false)
      expect(service.conversacionCompleta(historialDeUsuario([...respuestas, 'Moderno']))).toBe(true)
    })

    it('sin rubro deducible del nombre exige nombre, 2b, descripción, servicios, ciudad y estilo', () => {
      const respuestas = ['Servicios del Sur', 'Ninguno de estos', 'Pan', 'Pan, tortas', 'Viña']

      expect(service.conversacionCompleta(historialDeUsuario(respuestas))).toBe(false)
      expect(service.conversacionCompleta(historialDeUsuario([...respuestas, 'Moderno']))).toBe(true)
    })

    it('un historial vacío no está completo', () => {
      expect(service.conversacionCompleta([])).toBe(false)
    })

    it('concuerda con procesarMensaje: la última respuesta devuelve el cierre justo cuando queda completo', async () => {
      const respuestas = ['Servicios del Sur', 'Ninguno de estos', 'Pan', 'Pan, tortas', 'Viña', 'Moderno']
      for (let i = 1; i <= respuestas.length; i++) {
        const respuesta = await preguntaTras(respuestas.slice(0, i - 1), respuestas[i - 1])
        const completa = service.conversacionCompleta(historialDeUsuario(respuestas.slice(0, i)))
        expect(respuesta === MENSAJE_FINAL).toBe(completa)
      }
    })
  })

  describe('contrato del parser: etiquetas de botones', () => {
    it('cada etiqueta de categoría se resuelve a su propio rubro', () => {
      for (const rubro of RUBROS_CONOCIDOS) {
        expect(detectarRubro(RUBRO_LABELS[rubro])).toBe(rubro)
      }
    })

    it('hay frase con artículo y 5 sugerencias para cada rubro, y ninguna sugerencia para "otro"', () => {
      for (const rubro of RUBROS_CONOCIDOS) {
        expect(RUBRO_FRASE[rubro]).toMatch(/^(un|una) /)
        expect(SUGERENCIAS_SERVICIOS[rubro]).toHaveLength(5)
      }
      expect(SUGERENCIAS_SERVICIOS.otro).toBeUndefined()
    })

    it('cada etiqueta de estilo se parsea al estilo correspondiente', async () => {
      const esperado = ['moderno', 'calido', 'colorido']
      for (const [i, etiqueta] of OPCIONES_ESTILO.entries()) {
        const datos = await service.extraerDatos(
          historialDeUsuario(['Panadería', 'Sí, es correcto', 'Pan', 'Pan', 'Viña', etiqueta]),
        )
        expect(datos.estilo).toBe(esperado[i])
      }
    })

    it('"Sí, es correcto" confirma y cualquier otra cosa abre las categorías', () => {
      const confirma = historialDeUsuario(['Panadería El Trigal', 'Sí, es correcto'])
      expect(service.conversacionCompleta(confirma)).toBe(false)

      return Promise.all([
        service.extraerDatos(confirma).then((d) => expect(d.rubro).toBe('panaderia')),
        service
          .extraerDatos(historialDeUsuario(['Panadería El Trigal', 'No, es otra cosa', 'Taller mecánico o automotriz']))
          .then((d) => expect(d.rubro).toBe('taller')),
      ])
    })
  })

  describe('sugerenciasServicios (solo interfaz)', () => {
    it('devuelve las sugerencias del rubro ya resuelto', () => {
      const historial = historialDeUsuario(['Panadería El Trigal', 'Sí, es correcto', 'Hacemos pan'])
      expect(sugerenciasServicios(historial)).toEqual(SUGERENCIAS_SERVICIOS.panaderia)
    })

    it('es vacío mientras el rubro no está resuelto o si es "otro"', () => {
      expect(sugerenciasServicios([])).toEqual([])
      expect(sugerenciasServicios(historialDeUsuario(['Panadería El Trigal']))).toEqual([])
      expect(sugerenciasServicios(historialDeUsuario(['Servicios', 'Ninguno de estos']))).toEqual([])
    })
  })

  describe('extraerDatos — detección de rubro por el nombre (sin 2a/2b respondidas)', () => {
    const casos = [
      { texto: 'Panadería El Trigal', esperado: 'panaderia' },
      { texto: 'Peluquería Valeria', esperado: 'peluqueria' },
      { texto: 'Clínica Dental Sonrisas', esperado: 'dentista' },
      { texto: 'Restaurante La Cazuela', esperado: 'restaurante' },
      { texto: 'Asesorías Tributarias SA', esperado: 'consultora' },
      { texto: 'Taller Mecánico Don Pedro', esperado: 'taller' },
      { texto: 'Centro de Yoga Paz', esperado: 'yoga' },
      { texto: 'Ferretería Los Maestros', esperado: 'ferreteria' },
      { texto: 'Clínica Veterinaria Huellitas', esperado: 'veterinaria' },
      { texto: 'Boutique de Ropa Luna', esperado: 'tienda' },
    ]

    casos.forEach(({ texto, esperado }) => {
      it(`detecta rubro correcto para "${texto}"`, async () => {
        const datos = await service.extraerDatos(historialDeUsuario([texto]))
        expect(datos.rubro).toBe(esperado)
      })
    })

    it('usa "otro" como fallback neutro cuando no detecta rubro', async () => {
      const datos = await service.extraerDatos(historialDeUsuario(['xkcd 1234 empresa xyz']))
      expect(datos.rubro).toBe('otro')
      expect(datos.template).toBe('LANDING')
    })
  })

  describe('extraerDatos — el contenido sale de las respuestas reales del usuario', () => {
    it('mapea cada respuesta al campo correspondiente y deja contacto, redes y highlight vacíos', async () => {
      const datos = await service.extraerDatos(
        historialDeUsuario([
          'Panadería El Trigal',
          'Sí, es correcto',
          'Vendemos pan artesanal y pastelería',
          'Pan de masa madre, tortas, hallullas',
          'Viña del Mar',
          'Cálido y cercano',
        ]),
      )

      expect(datos.nombre).toBe('Panadería El Trigal')
      expect(datos.rubro).toBe('panaderia')
      expect(datos.descripcion).toBe('Vendemos pan artesanal y pastelería')
      expect(datos.servicios).toEqual(['Pan de masa madre', 'tortas', 'hallullas'])
      expect(datos.ciudad).toBe('Viña del Mar')
      expect(datos.estilo).toBe('calido')
      expect(datos.contacto).toEqual({ telefono: '', email: '' })
      expect(datos.redes).toEqual({})
      expect(datos.highlight).toBe('')
    })

    it('con rubro elegido en 2b, el resto de las respuestas se lee desde la posición correcta', async () => {
      const datos = await service.extraerDatos(
        historialDeUsuario([
          'Servicios Generales del Sur',
          'Peluquería o salón de belleza',
          'Cortes y color',
          'Corte, tintura',
          'Rancagua',
          'Moderno y minimalista',
        ]),
      )

      expect(datos.rubro).toBe('peluqueria')
      expect(datos.descripcion).toBe('Cortes y color')
      expect(datos.servicios).toEqual(['Corte', 'tintura'])
      expect(datos.ciudad).toBe('Rancagua')
      expect(datos.estilo).toBe('moderno')
    })

    it('"Ninguno de estos" deja el rubro en "otro" con template LANDING', async () => {
      const datos = await service.extraerDatos(
        historialDeUsuario(['Servicios Generales del Sur', 'Ninguno de estos', 'Trámites', 'Gestión', 'Rancagua', 'Moderno']),
      )

      expect(datos.rubro).toBe('otro')
      expect(datos.template).toBe('LANDING')
    })

    it('aplica el template, colores y fotos por defecto del rubro detectado', async () => {
      const datos = await service.extraerDatos(
        historialDeUsuario([
          'Clínica Veterinaria Huellitas',
          'Sí, es correcto',
          'Atención de mascotas',
          'Consultas, vacunas, cirugías',
          'Ñuñoa',
          'Moderno y minimalista',
        ]),
      )

      expect(datos.template).toBe('SERVICIOS')
      // D-31 (camino 3): solo `acento` se persiste — primario/secundario/texto
      // se derivan siempre en tiempo de render (palette.ts).
      expect(datos.colores).toEqual({ acento: '#dc93a9' })
      expect(datos.imagenes?.length).toBeGreaterThan(0)
    })
  })
})
