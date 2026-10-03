import {
  buildMarca,
  buildInicio,
  buildDestacados,
  buildHighlight,
  buildServicios,
  buildNosotros,
  buildContacto,
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
  it('arma las dos iniciales en mayúscula desde el nombre, saltando el artículo', () => {
    // "Panadería El Trigal": "El" es la única palabra de 2 letras — se salta
    // (shared/iniciales.ts) y las iniciales salen de Panadería + Trigal.
    expect(buildMarca(configCompleto())).toEqual({ nombre: 'Panadería El Trigal', iniciales: 'PT', logo: null, logoDimensiones: null, logoAltos: null, mostrarNombre: true })
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar', () => {
    expect(() => buildMarca(configSoloNombre())).not.toThrow()
    // "Sitio E2E": ambas palabras tienen más de 2 letras y ninguna es
    // artículo/preposición — iniciales de las dos palabras tal cual.
    expect(buildMarca(configSoloNombre())).toEqual({ nombre: 'Sitio E2E', iniciales: 'SE', logo: null, logoDimensiones: null, logoAltos: null, mostrarNombre: true })
  })

  it('expone `logo` cuando config.logo viene con contenido', () => {
    expect(buildMarca(configCompleto({ logo: 'https://cdn.example.com/logo.png' }))).toEqual({
      nombre: 'Panadería El Trigal',
      iniciales: 'PT',
      logo: 'https://cdn.example.com/logo.png',
      logoDimensiones: null,
      logoAltos: null, mostrarNombre: true,
    })
  })

  it('expone dimensiones y altos ópticos cuando config.logoDimensiones es válido', () => {
    const marca = buildMarca(configCompleto({ logo: 'https://cdn.example.com/logo.png', logoDimensiones: { ancho: 300, alto: 100 } }))
    expect(marca.logoDimensiones).toEqual({ ancho: 300, alto: 100 })
    expect(marca.logoAltos).toEqual({ escritorio: 44, movil: 34 })
  })

  it.each([
    ['isotipo r<1.6', { ancho: 100, alto: 100 }, true],
    ['borde r=1.6', { ancho: 160, alto: 100 }, false],
    ['logotipo r>=1.6', { ancho: 400, alto: 100 }, false],
  ])('mostrarNombre con %s', (_n, dims, mostrar) => {
    expect(buildMarca(configCompleto({ logo: 'https://cdn.example.com/logo.png', logoDimensiones: dims })).mostrarNombre).toBe(mostrar)
  })

  it('mantiene el nombre visible sin dimensiones o sin logo', () => {
    expect(buildMarca(configCompleto({ logo: 'https://cdn.example.com/logo.png' })).mostrarNombre).toBe(true)
    expect(buildMarca(configCompleto({ logoDimensiones: { ancho: 400, alto: 100 } })).mostrarNombre).toBe(true)
  })

  it.each([
    ['string', '400x100'],
    ['cero', { ancho: 0, alto: 100 }],
    ['negativo', { ancho: -4, alto: 100 }],
    ['decimal', { ancho: 10.5, alto: 100 }],
    ['strings numéricos', { ancho: '400', alto: '100' }],
    ['incompleto', { ancho: 400 }],
  ])('descarta logoDimensiones inválido (%s) sin lanzar', (_nombre, invalido) => {
    const config = configCompleto({ logo: 'https://cdn.example.com/logo.png', logoDimensiones: invalido as never })
    expect(() => buildMarca(config)).not.toThrow()
    expect(buildMarca(config)).toMatchObject({ logo: 'https://cdn.example.com/logo.png', logoDimensiones: null, logoAltos: null, mostrarNombre: true })
  })

  it('`logo` es null cuando config.logo es solo espacios', () => {
    expect(buildMarca(configCompleto({ logo: '   ' })).logo).toBeNull()
  })
})

describe('landing/sections — buildInicio', () => {
  it('arma el hero completo desde un config lleno', () => {
    const inicio = buildInicio(configCompleto())

    expect(inicio.nombre).toBe('Panadería El Trigal')
    expect(inicio.descripcion).toBe('Pan artesanal con más de 20 años de tradición.')
    expect(inicio.rubro).toBe('Panadería')
    expect(inicio.ciudad).toBe('Viña del Mar')
    expect(inicio.imagenHero).toBe('https://images.unsplash.com/hero.jpg')
    expect(inicio.whatsappUrl).toBe('https://wa.me/56912345678')
    expect(inicio.telUrl).toBe('tel:+56 9 1234 5678')
    expect(inicio.telefonoDisplay).toBe('+56 9 1234 5678')
    // Bloques: ni cifras ni frase destacada en el hero (U5 / U7).
    expect(inicio).not.toHaveProperty('destacados')
    expect(inicio).not.toHaveProperty('highlight')
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
  })

  it('no muestra el badge de rubro cuando rubro es "demo"', () => {
    expect(buildInicio(configCompleto({ rubro: 'demo' })).rubro).toBeNull()
  })
})

describe('landing/sections — buildDestacados / buildHighlight', () => {
  it('expone las cifras y la frase destacada fuera del hero', () => {
    const config = configCompleto()
    expect(buildDestacados(config)).toEqual([
      { valor: '20+', etiqueta: 'años' },
      { valor: '500+', etiqueta: 'clientes' },
      { valor: '15', etiqueta: 'productos' },
    ])
    expect(buildHighlight(config)).toBe('Horneamos tres veces al día.')
  })

  it('degrada con un config que solo trae { nombre }', () => {
    expect(buildDestacados(configSoloNombre())).toEqual([])
    expect(buildHighlight(configSoloNombre())).toBeNull()
  })

  it('recorta a 3 destacados cuando llegan más de los que muestra el hero', () => {
    const inicio = buildDestacados(
      configCompleto({
        destacados: [
          { valor: '1', etiqueta: 'uno' },
          { valor: '2', etiqueta: 'dos' },
          { valor: '3', etiqueta: 'tres' },
          { valor: '4', etiqueta: 'cuatro' },
        ],
      }),
    )
    expect(inicio).toHaveLength(3)
  })

  describe('contra forma equivocada (destacados malformado)', () => {
    it('trata un destacados que es un string (no array) como ausente, sin lanzar', () => {
      const config = configCompleto({ destacados: 'no soy un array' as unknown as SiteConfigDTO['destacados'] })
      expect(() => buildDestacados(config)).not.toThrow()
      expect(buildDestacados(config)).toEqual([])
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
      expect(() => buildDestacados(config)).not.toThrow()
      expect(buildDestacados(config)).toEqual([{ valor: '20+', etiqueta: 'años' }])
    })
  })
})

describe('landing/sections — buildServicios', () => {
  it('usa la etiqueta "Qué ofrecemos" para LANDING', () => {
    expect(buildServicios(configCompleto())?.etiqueta).toBe('Qué ofrecemos')
  })

  // Forma legada (strings): sin descripción ni foto → forma A (número gigante).
  it('una banda por servicio, numerada desde 1 (forma legada: strings)', () => {
    expect(buildServicios(configCompleto())?.bandas).toEqual([
      { numero: 1, nombre: 'Pan artesanal', descripcion: null, foto: null, whatsappUrl: 'https://wa.me/56912345678?text=Hola%2C%20quiero%20consultar%20por%20Pan%20artesanal' },
      { numero: 2, nombre: 'Tortas', descripcion: null, foto: null, whatsappUrl: 'https://wa.me/56912345678?text=Hola%2C%20quiero%20consultar%20por%20Tortas' },
      { numero: 3, nombre: 'Hallullas', descripcion: null, foto: null, whatsappUrl: 'https://wa.me/56912345678?text=Hola%2C%20quiero%20consultar%20por%20Hallullas' },
    ])
  })

  it('acepta el shape objeto { nombre, descripcion } y expone la descripción', () => {
    const servicios = buildServicios(
      configCompleto({ servicios: [{ nombre: 'Pan artesanal', descripcion: 'Horneado a leña, todos los días.' }] }),
    )
    expect(servicios?.bandas[0]).toMatchObject({ numero: 1, nombre: 'Pan artesanal', descripcion: 'Horneado a leña, todos los días.' })
  })

  it('objeto sin descripción propia queda con descripcion: null', () => {
    const servicios = buildServicios(configCompleto({ servicios: [{ nombre: 'Tortas' }] }))
    expect(servicios?.bandas[0]).toMatchObject({ nombre: 'Tortas', descripcion: null, foto: null })
  })

  it('cada banda decide su forma por su propia foto: forma B con foto, forma A sin ella', () => {
    const servicios = buildServicios(
      configCompleto({
        servicios: [{ nombre: 'Pan artesanal', foto: 'https://cdn.example/pan.jpg' }, 'Tortas', { nombre: 'Hallullas', foto: '  ' }],
      }),
    )
    expect(servicios?.bandas.map((banda) => banda.foto)).toEqual(['https://cdn.example/pan.jpg', null, null])
  })

  it('nunca toma la foto de imagenes[] (banco) para una banda', () => {
    const servicios = buildServicios(configCompleto({ imagenes: ['https://images.unsplash.com/a', 'https://images.unsplash.com/b'] }))
    expect(servicios?.bandas.every((banda) => banda.foto === null)).toBe(true)
  })

  it('el enlace de WhatsApp lleva el nombre del servicio; sin teléfono es null', () => {
    const conTelefono = buildServicios(configCompleto({ servicios: ['Tortas'] }))
    expect(conTelefono?.bandas[0].whatsappUrl).toContain('wa.me/56912345678?text=')
    expect(decodeURIComponent(conTelefono?.bandas[0].whatsappUrl ?? '')).toContain('Tortas')

    const sinTelefono = buildServicios(configCompleto({ servicios: ['Tortas'], contacto: { telefono: '', email: '' } }))
    expect(sinTelefono?.bandas[0].whatsappUrl).toBeNull()
  })

  it('retorna null cuando no hay servicios (config { nombre } only)', () => {
    expect(buildServicios(configSoloNombre())).toBeNull()
  })

  it('no recorta: muestra una banda por cada servicio', () => {
    const servicios = buildServicios(
      configCompleto({ servicios: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete'] }),
    )
    expect(servicios?.bandas).toHaveLength(7)
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
      expect(buildServicios(config)?.bandas.map((banda) => banda.nombre)).toEqual(['Pan artesanal'])
    })
  })
})

describe('landing/sections — buildNosotros', () => {
  it('usa sobreNosotros como párrafo cuando está presente', () => {
    expect(buildNosotros(configCompleto()).texto).toBe('Nacimos en 2003 con un horno a leña y mucho cariño.')
  })

  it('cae a descripcion cuando sobreNosotros está ausente', () => {
    expect(buildNosotros(configCompleto({ sobreNosotros: undefined })).texto).toBe('Pan artesanal con más de 20 años de tradición.')
  })

  it('el H2 es "{nombre} en {ciudad}", o solo el nombre sin ciudad', () => {
    expect(buildNosotros(configCompleto()).titulo).toBe('Panadería El Trigal en Viña del Mar')
    expect(buildNosotros(configCompleto({ ciudad: undefined })).titulo).toBe('Panadería El Trigal')
  })

  it('nunca es null: con un config que solo trae { nombre } sigue habiendo bloque', () => {
    const nosotros = buildNosotros(configSoloNombre())
    expect(nosotros).toEqual({ titulo: 'Sitio E2E', texto: null, tarjetas: [], frase: null, autor: null })
  })

  it('las tarjetas salen de sobreNosotrosPartes en orden fijo, sin las vacías', () => {
    const nosotros = buildNosotros(
      configCompleto({ sobreNosotrosPartes: { distinto: 'Horno a leña', desde: '2003', quien: '   ' } }),
    )
    expect(nosotros.tarjetas).toEqual([
      { clave: 'desde', texto: '2003' },
      { clave: 'distinto', texto: 'Horno a leña' },
    ])
  })

  it('la frase destacada y su autor viajan al bloque (C3)', () => {
    const nosotros = buildNosotros(configCompleto({ highlightAutor: { nombre: 'Ana Rojas', cargo: 'Maestra panadera' } }))
    expect(nosotros.frase).toBe('Horneamos tres veces al día.')
    expect(nosotros.autor).toEqual({ nombre: 'Ana Rojas', cargo: 'Maestra panadera' })
  })

  it('sin frase no hay cita, aunque haya autor', () => {
    const nosotros = buildNosotros(configCompleto({ highlight: undefined, highlightAutor: { nombre: 'Ana Rojas' } }))
    expect(nosotros.frase).toBeNull()
    expect(nosotros.autor).toBeNull()
  })

  it('con frase pero sin autor, la cita queda sin firma', () => {
    expect(buildNosotros(configCompleto()).autor).toBeNull()
  })

  it('ya no expone fotos: imagenes[1..] no entran a Nosotros', () => {
    expect(buildNosotros(configCompleto())).not.toHaveProperty('imagenes')
  })

  it('tolera formas equivocadas de sobreNosotrosPartes y highlightAutor sin lanzar', () => {
    const config = configCompleto({
      sobreNosotrosPartes: 'no soy un objeto' as unknown as SiteConfigDTO['sobreNosotrosPartes'],
      highlightAutor: 42 as unknown as SiteConfigDTO['highlightAutor'],
    })
    expect(() => buildNosotros(config)).not.toThrow()
    expect(buildNosotros(config).tarjetas).toEqual([])
    expect(buildNosotros(config).autor).toBeNull()
  })
})

describe('landing/sections — buildContacto', () => {
  it('con formulario ausente, el form queda habilitado por defecto', () => {
    const contacto = buildContacto(configCompleto())

    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.telefono).toBe('+56 9 1234 5678')
    expect(contacto.email).toBe('contacto@eltrigal.cl')
    expect(contacto.horarios).toEqual([])
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
