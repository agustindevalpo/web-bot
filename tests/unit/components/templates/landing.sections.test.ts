import {
  buildMarca,
  buildInicio,
  buildServicios,
  buildNosotros,
  buildContacto,
  buildFooter,
  construirMensajeContacto,
  construirWhatsAppFormulario,
} from '@/components/templates/landing/sections'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

function configCompleto(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Panadería El Trigal',
    rubro: 'panaderia',
    descripcion: 'Pan artesanal con más de 20 años de tradición.',
    sobreNosotros: 'Nacimos en 2003 con un horno a leña y mucho cariño.',
    servicios: ['Pan artesanal', 'Tortas', 'Hallullas'],
    ciudad: 'Viña del Mar',
    contacto: { telefono: '+56 9 1234 5678', email: 'contacto@eltrigal.cl' },
    redes: { instagram: '@eltrigal', facebook: 'Panadería El Trigal' },
    estilo: Estilo.CALIDO,
    highlight: 'Horneamos tres veces al día.',
    imagenes: [
      'https://images.unsplash.com/hero.jpg',
      'https://images.unsplash.com/galeria1.jpg',
      'https://images.unsplash.com/galeria2.jpg',
    ],
    colores: { acento: '#FF8C00' },
    destacados: [
      { valor: '20+', etiqueta: 'años' },
      { valor: '500+', etiqueta: 'clientes' },
      { valor: '15', etiqueta: 'productos' },
    ],
    ...overrides,
  }
}

// El fixture del e2e existente (tests/e2e/steps/sitio-por-subdominio.steps.ts
// y templates-por-sitio.steps.ts) crea sitios con configJson mínimos —
// ningún builder debe lanzar ni asumir la presencia de otros campos (Hard
// constraint heredado de la versión anterior).
function configSoloNombre(): SiteConfigDTO {
  return { nombre: 'Sitio E2E' } as SiteConfigDTO
}

describe('landing/sections — buildMarca', () => {
  it('arma la inicial en mayúscula desde el nombre', () => {
    expect(buildMarca(configCompleto())).toEqual({ nombre: 'Panadería El Trigal', inicial: 'P' })
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar', () => {
    expect(() => buildMarca(configSoloNombre())).not.toThrow()
    expect(buildMarca(configSoloNombre())).toEqual({ nombre: 'Sitio E2E', inicial: 'S' })
  })
})

describe('landing/sections — buildInicio', () => {
  it('arma el hero completo desde un config lleno', () => {
    const inicio = buildInicio(configCompleto())

    expect(inicio.nombre).toBe('Panadería El Trigal')
    expect(inicio.descripcion).toBe('Pan artesanal con más de 20 años de tradición.')
    expect(inicio.rubro).toBe('PANADERIA')
    expect(inicio.ciudad).toBe('Viña del Mar')
    expect(inicio.imagenHero).toBe('https://images.unsplash.com/hero.jpg')
    expect(inicio.whatsappUrl).toBe('https://wa.me/56912345678')
    expect(inicio.telUrl).toBe('tel:+56 9 1234 5678')
    expect(inicio.telefonoDisplay).toBe('+56 9 1234 5678')
    expect(inicio.highlight).toBe('Horneamos tres veces al día.')
    expect(inicio.destacados).toEqual([
      { valor: '20+', etiqueta: 'años' },
      { valor: '500+', etiqueta: 'clientes' },
      { valor: '15', etiqueta: 'productos' },
    ])
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar', () => {
    expect(() => buildInicio(configSoloNombre())).not.toThrow()
    const inicio = buildInicio(configSoloNombre())

    expect(inicio.nombre).toBe('Sitio E2E')
    expect(inicio.descripcion).toBeNull()
    expect(inicio.rubro).toBeNull()
    expect(inicio.ciudad).toBeNull()
    expect(inicio.imagenHero).toBeNull()
    expect(inicio.whatsappUrl).toBeNull()
    expect(inicio.telUrl).toBeNull()
    expect(inicio.highlight).toBeNull()
    expect(inicio.destacados).toEqual([])
  })

  it('no muestra el badge de rubro cuando rubro es "demo"', () => {
    expect(buildInicio(configCompleto({ rubro: 'demo' })).rubro).toBeNull()
  })

  it('recorta a 3 destacados cuando llegan más de los que muestra el hero', () => {
    const inicio = buildInicio(
      configCompleto({
        destacados: [
          { valor: '1', etiqueta: 'uno' },
          { valor: '2', etiqueta: 'dos' },
          { valor: '3', etiqueta: 'tres' },
          { valor: '4', etiqueta: 'cuatro' },
        ],
      }),
    )
    expect(inicio.destacados).toHaveLength(3)
  })

  describe('contra forma equivocada (destacados malformado)', () => {
    it('trata un destacados que es un string (no array) como ausente, sin lanzar', () => {
      const config = configCompleto({ destacados: 'no soy un array' as unknown as SiteConfigDTO['destacados'] })
      expect(() => buildInicio(config)).not.toThrow()
      expect(buildInicio(config).destacados).toEqual([])
    })

    it('descarta entradas de destacados sin etiqueta o sin valor, sin lanzar', () => {
      const config = configCompleto({
        destacados: [
          { valor: '20+', etiqueta: 'años' },
          { valor: '500+' } as unknown as { valor: string; etiqueta: string },
          { etiqueta: 'sin valor' } as unknown as { valor: string; etiqueta: string },
          'texto suelto' as unknown as { valor: string; etiqueta: string },
          null as unknown as { valor: string; etiqueta: string },
        ],
      })
      expect(() => buildInicio(config)).not.toThrow()
      expect(buildInicio(config).destacados).toEqual([{ valor: '20+', etiqueta: 'años' }])
    })
  })
})

describe('landing/sections — buildServicios', () => {
  it('usa la etiqueta "Qué ofrecemos" para LANDING', () => {
    expect(buildServicios(configCompleto())?.etiqueta).toBe('Qué ofrecemos')
  })

  // Forma legada — la única que existe hoy en producción (D-19 nunca se
  // implementó): un array de strings, sin descripción. `descripcion: null`
  // en cada item, no el campo ausente, porque `ServicioItem.descripcion` es
  // `string | null`, no opcional (T-servicios-descripcion).
  it('numera los servicios del config desde 1 (forma legada: strings, sin descripción)', () => {
    expect(buildServicios(configCompleto())?.items).toEqual([
      { numero: 1, titulo: 'Pan artesanal', descripcion: null },
      { numero: 2, titulo: 'Tortas', descripcion: null },
      { numero: 3, titulo: 'Hallullas', descripcion: null },
    ])
  })

  it('acepta el shape objeto { nombre, descripcion } y expone la descripción', () => {
    const servicios = buildServicios(
      configCompleto({ servicios: [{ nombre: 'Pan artesanal', descripcion: 'Horneado a leña, todos los días.' }] }),
    )
    expect(servicios?.items).toEqual([{ numero: 1, titulo: 'Pan artesanal', descripcion: 'Horneado a leña, todos los días.' }])
  })

  it('objeto sin descripción propia también queda con descripcion: null — la celda no lee como error', () => {
    const servicios = buildServicios(configCompleto({ servicios: [{ nombre: 'Tortas' }] }))
    expect(servicios?.items).toEqual([{ numero: 1, titulo: 'Tortas', descripcion: null }])
  })

  it('mezcla de strings y objetos en el mismo array, cada uno con su propia descripción o sin ella', () => {
    const servicios = buildServicios(
      configCompleto({
        servicios: ['Pan artesanal', { nombre: 'Tortas', descripcion: 'A pedido, con 48h de anticipación.' }, 'Hallullas'],
      }),
    )
    expect(servicios?.items).toEqual([
      { numero: 1, titulo: 'Pan artesanal', descripcion: null },
      { numero: 2, titulo: 'Tortas', descripcion: 'A pedido, con 48h de anticipación.' },
      { numero: 3, titulo: 'Hallullas', descripcion: null },
    ])
  })

  it('arma el link de WhatsApp de la celda CTA cuando hay teléfono', () => {
    expect(buildServicios(configCompleto())?.whatsappUrl).toBe('https://wa.me/56912345678')
  })

  it('retorna null cuando no hay servicios (config { nombre } only)', () => {
    expect(buildServicios(configSoloNombre())).toBeNull()
  })

  it('recorta a 5 celdas de servicio cuando llegan más de las que muestra la grilla', () => {
    const servicios = buildServicios(
      configCompleto({ servicios: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete'] }),
    )
    expect(servicios?.items).toHaveLength(5)
  })

  // La celda de CTA es siempre la última de la grilla de 3 columnas y debe
  // extenderse (`grid-column: span N`) para llenar lo que le queda libre en
  // su fila, así la grilla nunca deja una celda vacía gris (defecto visto en
  // `demo-consultora` con 4 servicios: 5 celdas en una grilla de 3×2 dejaban
  // la sexta sin pintar). `ctaSpan` fija ese cálculo para cada cantidad de
  // servicios que la grilla puede recibir (1 a MAX_SERVICIOS_GRID = 5).
  describe('ctaSpan — la celda de CTA nunca deja una celda vacía en la grilla de 3 columnas', () => {
    it.each([
      [1, 2], // fila: [item1] [CTA×2]
      [2, 1], // fila: [item1] [item2] [CTA×1]
      [3, 3], // fila 1 completa con items, CTA arranca fila propia y la llena entera
      [4, 2], // fila 2: [item4] [CTA×2]  ← el caso observado en demo-consultora
      [5, 1], // fila 2: [item4] [item5] [CTA×1]
    ])('con %i servicios, ctaSpan es %i', (cantidad, ctaSpanEsperado) => {
      const servicios = ['uno', 'dos', 'tres', 'cuatro', 'cinco'].slice(0, cantidad)
      expect(buildServicios(configCompleto({ servicios }))?.ctaSpan).toBe(ctaSpanEsperado)
    })
  })

  describe('contra forma equivocada (servicios malformado)', () => {
    it('trata un servicios que es un string (no array) como vacío, sin lanzar', () => {
      const config = configCompleto({ servicios: 'no soy un array' as unknown as string[] })
      expect(() => buildServicios(config)).not.toThrow()
      expect(buildServicios(config)).toBeNull()
    })

    // Antes de aceptar el shape objeto, cualquier entrada que no fuera string
    // se descartaba entera. Ahora un objeto con `nombre` es válido (ver el
    // describe de arriba); lo que sigue descartándose es lo que no es ni
    // string ni un objeto con `nombre` — número, `null`, o un objeto sin
    // `nombre` (`descripcion` suelta no alcanza).
    it('descarta entradas que no son string ni objeto con nombre, sin lanzar', () => {
      const config = configCompleto({
        servicios: [
          'Pan artesanal',
          42 as unknown as string,
          null as unknown as string,
          { descripcion: 'sin nombre' } as unknown as string,
        ],
      })
      expect(() => buildServicios(config)).not.toThrow()
      expect(buildServicios(config)?.items).toEqual([{ numero: 1, titulo: 'Pan artesanal', descripcion: null }])
    })
  })
})

describe('landing/sections — buildNosotros', () => {
  it('usa sobreNosotros cuando está presente', () => {
    expect(buildNosotros(configCompleto())?.texto).toBe('Nacimos en 2003 con un horno a leña y mucho cariño.')
  })

  it('el H2 es chrome de sección ("Quiénes somos"), no el nombre del negocio', () => {
    // Antes del fix, el H2 repetía `marca.nombre` — el mismo string que el
    // H1 del hero ya muestra. En la SPA (un clic de nav de distancia, no
    // miles de píxeles como en el long-scroll viejo) esa repetición lee como
    // bug, no como refuerzo de marca.
    expect(buildNosotros(configCompleto())?.titulo).toBe('Quiénes somos')
  })

  // Reemplaza el test que fijaba `sobreNosotros → descripcion → null`: ese
  // fallback era correcto en el long-scroll viejo, donde Inicio y Nosotros
  // quedaban lejísimos en la página. En la SPA de 4 secciones son un solo
  // clic de nav aparte, y el fallback hacía que el párrafo de Nosotros
  // repitiera literalmente `descripcion`, el mismo texto que el hero ya
  // muestra arriba. Decisión (handoff de esta tarea): sin fallback — el
  // párrafo de Nosotros solo existe cuando `sobreNosotros` tiene contenido
  // propio.
  it('NO cae a descripcion cuando sobreNosotros está ausente — el párrafo queda null', () => {
    const nosotros = buildNosotros(configCompleto({ sobreNosotros: undefined }))
    expect(nosotros?.texto).toBeNull()
  })

  it('sin sobreNosotros pero con fotos de galería, la sección igual se muestra (solo fotos, sin párrafo)', () => {
    const nosotros = buildNosotros(configCompleto({ sobreNosotros: undefined }))
    expect(nosotros).not.toBeNull()
    expect(nosotros?.texto).toBeNull()
    expect(nosotros?.imagenes.some((imagen) => imagen !== null)).toBe(true)
  })

  it('retorna null (oculta la sección, desaparece del nav) cuando NI sobreNosotros NI fotos de galería existen', () => {
    expect(buildNosotros(configSoloNombre())).toBeNull()
    // Config explícito: sin sobreNosotros, sin descripcion-como-fallback (ya
    // no aplica), y sin imágenes de galería (la única imagen que trae es la
    // del hero, que `buildNosotros` excluye).
    const config = configCompleto({ sobreNosotros: undefined, imagenes: ['https://images.unsplash.com/hero.jpg'] })
    expect(buildNosotros(config)).toBeNull()
  })

  // Tres cupos, no cuatro: la grilla de la maqueta (README.md:203) es de dos
  // columnas por dos filas y su primera celda abarca dos filas, así que solo
  // quedan dos casillas libres además de la grande. Con un cuarto cupo la
  // grilla se desbordaba a una tercera fila inexistente en el diseño y la
  // sección terminaba más alta que el hero (medido: 955px contra 652px).
  it('excluye la primera imagen (usada en el hero) y completa hasta 3 cupos con null', () => {
    const nosotros = buildNosotros(configCompleto())
    expect(nosotros?.imagenes).toEqual([
      'https://images.unsplash.com/galeria1.jpg',
      'https://images.unsplash.com/galeria2.jpg',
      null,
    ])
  })

  it('deja los 3 cupos de imagen en null cuando no hay imágenes de galería', () => {
    const nosotros = buildNosotros(configCompleto({ sobreNosotros: 'Somos una panadería familiar.', imagenes: undefined }))
    expect(nosotros?.imagenes).toEqual([null, null, null])
  })

  describe('contra forma equivocada (imagenes malformado)', () => {
    it('trata un imagenes que es un string (no array) como sin fotos, sin lanzar', () => {
      const config = configCompleto({ imagenes: 'no soy un array' as unknown as string[] })
      expect(() => buildNosotros(config)).not.toThrow()
      expect(buildNosotros(config)?.imagenes).toEqual([null, null, null])
    })
  })
})

describe('landing/sections — buildContacto', () => {
  it('con formulario ausente, el form queda habilitado por defecto', () => {
    const contacto = buildContacto(configCompleto())

    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.telefono).toBe('+56 9 1234 5678')
    expect(contacto.email).toBe('contacto@eltrigal.cl')
  })

  it('respeta formulario.habilitado === false', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: { telefono: '+56 9 1234 5678', email: 'contacto@eltrigal.cl', formulario: { habilitado: false } },
      }),
    )
    expect(contacto.formularioHabilitado).toBe(false)
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar, formulario igual habilitado', () => {
    expect(() => buildContacto(configSoloNombre())).not.toThrow()
    const contacto = buildContacto(configSoloNombre())
    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.telefono).toBeNull()
    expect(contacto.email).toBeNull()
  })

  it('trata un contacto.formulario malformado (no objeto) como habilitado por defecto, sin lanzar', () => {
    const config = configCompleto({ contacto: { telefono: '+56 9 1234 5678', email: 'x@x.cl', formulario: 'si' as unknown as { habilitado: boolean } } })
    expect(() => buildContacto(config)).not.toThrow()
    expect(buildContacto(config).formularioHabilitado).toBe(true)
  })
})

describe('landing/sections — construirMensajeContacto', () => {
  it('arma las 3 líneas cuando los 3 campos vienen completos', () => {
    expect(construirMensajeContacto('Ana', 'ana@mail.cl', 'Quiero cotizar una torta')).toBe(
      'Nombre: Ana\nEmail: ana@mail.cl\nQuiero cotizar una torta',
    )
  })

  it('omite las líneas de campos vacíos en vez de dejarlas colgando', () => {
    expect(construirMensajeContacto('', '', 'Solo el mensaje')).toBe('Solo el mensaje')
  })

  it('degrada a string vacío con los 3 campos vacíos, sin lanzar', () => {
    expect(() => construirMensajeContacto('', '', '')).not.toThrow()
    expect(construirMensajeContacto('', '', '')).toBe('')
  })
})

describe('landing/sections — construirWhatsAppFormulario', () => {
  it('arma la URL de wa.me con el mensaje precargado', () => {
    const url = construirWhatsAppFormulario('+56 9 1234 5678', 'Ana', 'ana@mail.cl', 'Quiero cotizar una torta')
    expect(url).toBe(
      `https://wa.me/56912345678?text=${encodeURIComponent('Nombre: Ana\nEmail: ana@mail.cl\nQuiero cotizar una torta')}`,
    )
  })

  it('retorna null cuando el teléfono no tiene dígitos utilizables', () => {
    expect(construirWhatsAppFormulario('sin numero', 'Ana', 'ana@mail.cl', 'Hola')).toBeNull()
  })
})

describe('landing/sections — buildFooter', () => {
  it('arma el footer desde un config lleno', () => {
    const footer = buildFooter(configCompleto())

    expect(footer.nombre).toBe('Panadería El Trigal')
    expect(footer.ciudad).toBe('Viña del Mar')
    expect(footer.telefono).toBe('+56 9 1234 5678')
    expect(footer.email).toBe('contacto@eltrigal.cl')
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar', () => {
    expect(() => buildFooter(configSoloNombre())).not.toThrow()
    const footer = buildFooter(configSoloNombre())
    expect(footer.nombre).toBe('Sitio E2E')
    expect(footer.ciudad).toBeNull()
    expect(footer.telefono).toBeNull()
    expect(footer.email).toBeNull()
  })
})
