import { DemoChatService } from '@/infrastructure/demo/DemoChatService'
import { MensajeDTO } from '@/application/dtos/MensajeDTO'

describe('DemoChatService', () => {
  let service: DemoChatService

  beforeEach(() => {
    service = new DemoChatService()
  })

  it('con historial vacío, salta la pregunta del nombre (ya la muestra el saludo estático del frontend) y pregunta el rubro', async () => {
    const respuesta = await service.procesarMensaje([], 'Panadería El Trigal')
    expect(respuesta).toContain('dedica')
  })

  it('avanza al orden correcto de preguntas', async () => {
    // historial refleja el estado ANTES del mensaje actual: 1 respuesta de
    // usuario ya registrada (respuestasUsuario=1) → toca la pregunta índice 1.
    const historial: MensajeDTO[] = [
      { rol: 'user', contenido: 'Panadería El Trigal', timestamp: new Date() },
      { rol: 'assistant', contenido: '¿A qué se dedica tu negocio?', timestamp: new Date() },
    ]
    const respuesta = await service.procesarMensaje(historial, 'Hacemos pan artesanal')
    expect(respuesta).toContain('productos o servicios')
  })

  // Contenido "Panadería" (en vez del genérico "respuesta test" que tenía
  // este test) a propósito: nombre/descripción/servicios salen de las 3
  // primeras respuestas de usuario, y con texto genérico sin ninguna
  // keyword el matcher da puntaje 0 — eso agrega la 9na pregunta guiada de
  // la Pieza 4 y el flujo deja de terminar en la 8va respuesta, que es
  // justo lo que este test verifica. Con "Panadería" el rubro es confiable
  // (matchea "panadería", sin empate) y el guion base de 8 se mantiene.
  it('devuelve el mensaje final tras la 8va respuesta de usuario, coincidiendo con la conversación completa', async () => {
    const historial: MensajeDTO[] = Array.from({ length: 14 }, (_, i) => ({
      rol: i % 2 === 0 ? 'user' : 'assistant',
      contenido: 'Panadería',
      timestamp: new Date(),
    })) // 7 user + 7 assistant ya registradas
    const respuesta = await service.procesarMensaje(historial, 'última respuesta')
    expect(respuesta).toContain('Perfecto')
  })

  it('marca conversación como completa después de 8 respuestas de usuario', () => {
    const historial: MensajeDTO[] = Array.from({ length: 16 }, (_, i) => ({
      rol: i % 2 === 0 ? 'user' : 'assistant',
      contenido: 'Panadería',
      timestamp: new Date(),
    }))
    expect(service.conversacionCompleta(historial)).toBe(true)
  })

  it('no marca completa con menos de 8 respuestas', () => {
    const historial: MensajeDTO[] = Array.from({ length: 6 }, (_, i) => ({
      rol: i % 2 === 0 ? 'user' : 'assistant',
      contenido: 'test',
      timestamp: new Date(),
    }))
    expect(service.conversacionCompleta(historial)).toBe(false)
  })

  describe('extraerDatos — detección de rubro (solo determina template/colores/fotos)', () => {
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
        const historial: MensajeDTO[] = [{ rol: 'user', contenido: texto, timestamp: new Date() }]
        const datos = await service.extraerDatos(historial)
        expect(datos.rubro).toBe(esperado)
      })
    })

    // Antes esta aserción esperaba "panaderia": un rubro no reconocido caía
    // ahí con total confianza, heredando colores y plantilla de panadería
    // sin ninguna relación real (ver Pieza 3 del cambio "acento y estilo").
    // Se corrige a "otro" porque contradice el comportamiento nuevo, que es
    // el que pidió el usuario — no se debilita la cobertura, se corrige la
    // expectativa. Con un solo mensaje en el historial (no hay 9na
    // respuesta) `extraerDatos` usa el texto original, que no matchea nada.
    it('usa "otro" como fallback neutro cuando no detecta rubro', async () => {
      const historial: MensajeDTO[] = [{ rol: 'user', contenido: 'xkcd 1234 empresa xyz', timestamp: new Date() }]
      const datos = await service.extraerDatos(historial)
      expect(datos.rubro).toBe('otro')
      expect(datos.template).toBe('LANDING')
    })
  })

  describe('extraerDatos — el contenido sale de las respuestas reales del usuario', () => {
    function historialCompleto(respuestas: string[]): MensajeDTO[] {
      return respuestas.map((contenido) => ({ rol: 'user' as const, contenido, timestamp: new Date() }))
    }

    it('mapea cada respuesta al campo correspondiente del sitio', async () => {
      const historial = historialCompleto([
        'Panadería El Trigal',
        'Vendemos pan artesanal y pastelería',
        'Pan de masa madre, tortas, hallullas',
        'Viña del Mar',
        '+56 9 1234 5678 contacto@eltrigal.cl',
        '@panaderiaeltrigal',
        'Cálido y cercano',
        '20 años de tradición familiar',
      ])

      const datos = await service.extraerDatos(historial)

      expect(datos.nombre).toBe('Panadería El Trigal')
      expect(datos.descripcion).toBe('Vendemos pan artesanal y pastelería')
      expect(datos.servicios).toEqual(['Pan de masa madre', 'tortas', 'hallullas'])
      expect(datos.ciudad).toBe('Viña del Mar')
      expect(datos.contacto.email).toBe('contacto@eltrigal.cl')
      expect(datos.contacto.telefono).toBe('+56 9 1234 5678')
      expect(datos.redes.instagram).toBe('@panaderiaeltrigal')
      expect(datos.estilo).toBe('calido')
      expect(datos.highlight).toBe('20 años de tradición familiar')
    })

    it('aplica el template, colores y fotos por defecto del rubro detectado', async () => {
      const historial = historialCompleto([
        'Clínica Veterinaria Huellitas',
        'Atención de mascotas',
        'Consultas, vacunas, cirugías',
        'Ñuñoa',
        '+56 9 8888 1111',
        'sin redes',
        'Moderno',
        'Urgencias 24h',
      ])

      const datos = await service.extraerDatos(historial)

      // El acento ya no es el crudo de RUBRO_DEFAULTS: la respuesta "Moderno"
      // pasa por derivarAcento antes de llegar acá (ver
      // src/domain/color/acentoPorEstilo.ts).
      expect(datos.template).toBe('SERVICIOS')
      expect(datos.colores).toEqual({ primario: '#6C5CE7', secundario: '#a29bfe', acento: '#dc93a9', texto: '#ffffff' })
      expect(datos.imagenes?.length).toBeGreaterThan(0)
    })
  })
})
