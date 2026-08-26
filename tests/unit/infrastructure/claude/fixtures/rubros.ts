import { MensajeDTO } from '@/application/dtos/MensajeDTO'

export interface RubroFixture {
  rubro: string
  historial: MensajeDTO[]
  // Formato en que Claude devuelve el JSON — ejercita las 3 ramas de
  // parseSiteConfig: directo, con fence markdown, y con prosa alrededor.
  formato: 'raw' | 'fenced' | 'prose'
  respuestaClaude: string
  esperado: {
    nombre: string
    rubro: string
    template: string
  }
}

function turno(nombre: string, respuestas: string[]): MensajeDTO[] {
  const preguntas = [
    '¿Cómo se llama tu negocio?',
    '¿A qué se dedica?',
    '¿Cuáles son tus principales productos o servicios?',
    '¿En qué ciudad o zona opera tu negocio?',
    '¿Cuál es el teléfono de contacto y el email?',
    '¿Tienes redes sociales?',
    '¿Qué estilo visual prefieres para tu sitio?',
    '¿Hay algo especial de tu negocio que quieras destacar?',
  ]
  const historial: MensajeDTO[] = []
  respuestas.forEach((respuesta, i) => {
    historial.push({ rol: 'assistant', contenido: preguntas[i], timestamp: new Date() })
    historial.push({ rol: 'user', contenido: respuesta, timestamp: new Date() })
  })
  return historial
}

function jsonCrudo(datos: Record<string, unknown>): string {
  return JSON.stringify(datos)
}

function jsonConFence(datos: Record<string, unknown>): string {
  return '```json\n' + JSON.stringify(datos, null, 2) + '\n```'
}

function jsonConProsa(datos: Record<string, unknown>): string {
  return `¡Listo! Aquí tienes los datos extraídos de la conversación:\n\n${JSON.stringify(datos)}\n\nEspero que te sirva.`
}

function baseDatos(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    descripcion: 'Negocio local atendido con dedicación',
    servicios: ['Servicio A', 'Servicio B', 'Servicio C'],
    ciudad: 'Santiago',
    contacto: { telefono: '+56911112222', email: 'contacto@negocio.cl' },
    redes: { instagram: '@negocio', facebook: null },
    estilo: 'moderno',
    highlight: 'Más de 10 años de experiencia',
    ...overrides,
  }
}

export const RUBRO_FIXTURES: RubroFixture[] = [
  {
    rubro: 'panaderia',
    formato: 'raw',
    historial: turno('Panadería El Trigal', [
      'Panadería El Trigal',
      'Vendemos pan artesanal y pastelería',
      'Pan de masa madre, tortas, hallullas',
      'Viña del Mar',
      '+56911112222 contacto@eltrigal.cl',
      '@panaderiaeltrigal',
      'Cálido y cercano',
      '20 años de tradición familiar',
    ]),
    respuestaClaude: jsonCrudo(
      baseDatos({ nombre: 'Panadería El Trigal', rubro: 'panaderia', ciudad: 'Viña del Mar', estilo: 'calido' }),
    ),
    esperado: { nombre: 'Panadería El Trigal', rubro: 'panaderia', template: 'RESTAURANTE' },
  },
  {
    rubro: 'peluqueria',
    formato: 'fenced',
    historial: turno('Peluquería Valeria', [
      'Peluquería Valeria',
      'Cortes, color y tratamientos capilares',
      'Corte, colorimetría, keratina',
      'Santiago Centro',
      '+56922223333 valeria@peluqueria.cl',
      '@peluqueriavaleria',
      'Colorido y llamativo',
      'Productos 100% veganos',
    ]),
    respuestaClaude: jsonConFence(
      baseDatos({ nombre: 'Peluquería Valeria', rubro: 'peluqueria', ciudad: 'Santiago Centro', estilo: 'colorido' }),
    ),
    esperado: { nombre: 'Peluquería Valeria', rubro: 'peluqueria', template: 'SERVICIOS' },
  },
  {
    rubro: 'dentista',
    formato: 'prose',
    historial: turno('Clínica Dental Sonrisas', [
      'Clínica Dental Sonrisas',
      'Odontología general y estética',
      'Limpieza, ortodoncia, blanqueamiento',
      'Concepción',
      '+56933334444 contacto@sonrisas.cl',
      'sin redes',
      'Moderno y minimalista',
      'Atención de urgencias 24h',
    ]),
    respuestaClaude: jsonConProsa(
      baseDatos({ nombre: 'Clínica Dental Sonrisas', rubro: 'dentista', ciudad: 'Concepción', redes: { instagram: null, facebook: null } }),
    ),
    esperado: { nombre: 'Clínica Dental Sonrisas', rubro: 'dentista', template: 'SERVICIOS' },
  },
  {
    rubro: 'restaurante',
    formato: 'raw',
    historial: turno('Restaurante La Cazuela', [
      'Restaurante La Cazuela',
      'Comida típica chilena',
      'Cazuela, pastel de choclo, empanadas',
      'Valparaíso',
      '+56944445555 reservas@lacazuela.cl',
      '@lacazuelarestaurant',
      'Cálido y cercano',
      'Recetas de la abuela desde 1980',
    ]),
    respuestaClaude: jsonCrudo(
      baseDatos({ nombre: 'Restaurante La Cazuela', rubro: 'restaurante', ciudad: 'Valparaíso', estilo: 'calido' }),
    ),
    esperado: { nombre: 'Restaurante La Cazuela', rubro: 'restaurante', template: 'RESTAURANTE' },
  },
  {
    rubro: 'consultora',
    formato: 'fenced',
    historial: turno('Asesorías Tributarias SA', [
      'Asesorías Tributarias SA',
      'Contabilidad y asesoría tributaria para pymes',
      'Declaración de renta, IVA, contabilidad mensual',
      'Providencia',
      '+56955556666 info@asesoriastributarias.cl',
      '@asesoriastrib',
      'Moderno y minimalista',
      'Certificados por el Colegio de Contadores',
    ]),
    respuestaClaude: jsonConFence(
      baseDatos({ nombre: 'Asesorías Tributarias SA', rubro: 'consultora', ciudad: 'Providencia' }),
    ),
    esperado: { nombre: 'Asesorías Tributarias SA', rubro: 'consultora', template: 'SERVICIOS' },
  },
  {
    rubro: 'taller',
    formato: 'prose',
    historial: turno('Taller Mecánico Don Pedro', [
      'Taller Mecánico Don Pedro',
      'Mecánica automotriz general',
      'Frenos, aceite, diagnóstico computarizado',
      'Maipú',
      '+56966667777 taller.donpedro@gmail.com',
      'sin redes',
      'Moderno y minimalista',
      '30 años de experiencia en el rubro',
    ]),
    respuestaClaude: jsonConProsa(
      baseDatos({ nombre: 'Taller Mecánico Don Pedro', rubro: 'taller', ciudad: 'Maipú', redes: { instagram: null, facebook: null } }),
    ),
    esperado: { nombre: 'Taller Mecánico Don Pedro', rubro: 'taller', template: 'SERVICIOS' },
  },
  {
    rubro: 'yoga',
    formato: 'raw',
    historial: turno('Centro de Yoga Paz', [
      'Centro de Yoga Paz',
      'Clases de yoga y meditación',
      'Hatha yoga, vinyasa, meditación guiada',
      'Ñuñoa',
      '+56977778888 contacto@yogapaz.cl',
      '@yogapaz',
      'Cálido y cercano',
      'Instructores certificados internacionalmente',
    ]),
    respuestaClaude: jsonCrudo(baseDatos({ nombre: 'Centro de Yoga Paz', rubro: 'yoga', ciudad: 'Ñuñoa', estilo: 'calido' })),
    esperado: { nombre: 'Centro de Yoga Paz', rubro: 'yoga', template: 'SERVICIOS' },
  },
  {
    rubro: 'ferreteria',
    formato: 'fenced',
    historial: turno('Ferretería Los Maestros', [
      'Ferretería Los Maestros',
      'Venta de herramientas y materiales de construcción',
      'Herramientas, pintura, gasfitería',
      'La Florida',
      '+56988889999 losmaestros@ferreteria.cl',
      '@ferreterialosmaestros',
      'Moderno y minimalista',
      'Despacho el mismo día',
    ]),
    respuestaClaude: jsonConFence(
      baseDatos({ nombre: 'Ferretería Los Maestros', rubro: 'ferreteria', ciudad: 'La Florida' }),
    ),
    esperado: { nombre: 'Ferretería Los Maestros', rubro: 'ferreteria', template: 'TIENDA' },
  },
  {
    rubro: 'veterinaria',
    formato: 'prose',
    historial: turno('Clínica Veterinaria Huellitas', [
      'Clínica Veterinaria Huellitas',
      'Atención de mascotas',
      'Consultas, vacunas, cirugías',
      'Las Condes',
      '+56999990000 huellitas@vet.cl',
      'sin redes',
      'Colorido y llamativo',
      'Urgencias 24 horas',
    ]),
    respuestaClaude: jsonConProsa(
      baseDatos({ nombre: 'Clínica Veterinaria Huellitas', rubro: 'veterinaria', ciudad: 'Las Condes', estilo: 'colorido', redes: { instagram: null, facebook: null } }),
    ),
    esperado: { nombre: 'Clínica Veterinaria Huellitas', rubro: 'veterinaria', template: 'SERVICIOS' },
  },
  {
    rubro: 'tienda',
    formato: 'raw',
    historial: turno('Boutique de Ropa Luna', [
      'Boutique de Ropa Luna',
      'Venta de ropa y accesorios de moda',
      'Vestidos, carteras, zapatos',
      'Providencia',
      '+56900001111 boutiqueluna@gmail.com',
      '@boutiqueluna',
      'Colorido y llamativo',
      'Colecciones exclusivas cada temporada',
    ]),
    respuestaClaude: jsonCrudo(baseDatos({ nombre: 'Boutique de Ropa Luna', rubro: 'tienda', ciudad: 'Providencia', estilo: 'colorido' })),
    esperado: { nombre: 'Boutique de Ropa Luna', rubro: 'tienda', template: 'TIENDA' },
  },
]
