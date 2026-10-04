import { buildLugar, disposicionLugar, fotosPropiasLugar } from '@/components/templates/servicios/datosLugar'
import { esImagenPropia } from '@/domain/imagen/imagenesPropias'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

const BASE = 'https://media.devalpo.cl'
const propia = (n: number, sitio = 'abc123') => `${BASE}/sitios/${sitio}/foto-${n}.jpg`
const BANCO = 'https://images.unsplash.com/photo-1?w=1600'

function config(imagenes: unknown, extra: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return { nombre: 'Peluquería Luna', imagenes, ...extra } as SiteConfigDTO
}

describe('esImagenPropia', () => {
  it.each([
    ['propia de un sitio', propia(1), BASE, true],
    ['propia con base con barra final', propia(1), `${BASE}/`, true],
    ['de otro sitio también cuenta (no se conoce el id)', propia(1, 'otro'), BASE, true],
    ['Unsplash', BANCO, BASE, false],
    ['host ajeno con la misma ruta', 'https://evil.com/sitios/abc123/foto.jpg', BASE, false],
    ['sin base configurada', propia(1), null, false],
    ['subcarpeta', `${BASE}/sitios/abc123/x/foto.jpg`, BASE, false],
    ['con query', `${propia(1)}?w=1`, BASE, false],
    ['fuera de sitios/', `${BASE}/otra/foto.jpg`, BASE, false],
    ['no es string', 42, BASE, false],
  ])('%s', (_nombre, url, base, esperado) => {
    expect(esImagenPropia(url, base)).toBe(esperado)
  })
})

describe('fotosPropiasLugar', () => {
  it('descarta Unsplash y claves ajenas, conserva el orden', () => {
    const urls = [propia(0), BANCO, propia(1), 'https://evil.com/sitios/a/b.jpg', propia(2)]
    expect(fotosPropiasLugar(urls, BASE)).toEqual([propia(1), propia(2)])
  })

  it('nunca incluye imagenes[0], aunque sea propia', () => {
    expect(fotosPropiasLugar([propia(0), propia(1)], BASE)).toEqual([propia(1)])
    expect(fotosPropiasLugar([propia(0)], BASE)).toEqual([])
  })

  it('sin base URL no hay fotos propias', () => {
    expect(fotosPropiasLugar([propia(0), propia(1), propia(2)], null)).toEqual([])
  })

  it('tolera imagenes ausente o con valores raros', () => {
    expect(fotosPropiasLugar(undefined, BASE)).toEqual([])
    expect(fotosPropiasLugar(['x', null, 3, propia(1)], BASE)).toEqual([propia(1)])
  })
})

describe('disposicionLugar', () => {
  it.each([
    [0, null],
    [1, 'una'],
    [2, 'dos'],
    [3, 'tres'],
    [5, 'tres'],
  ])('%i fotos → %s', (cantidad, esperado) => {
    expect(disposicionLugar(cantidad)).toBe(esperado)
  })
})

describe('buildLugar', () => {
  it('0 fotos propias → null (solo hero o solo banco)', () => {
    expect(buildLugar(config([propia(0)]), BASE)).toBeNull()
    expect(buildLugar(config([BANCO, BANCO]), BASE)).toBeNull()
    expect(buildLugar(config([]), BASE)).toBeNull()
  })

  it('1 foto → una, con alt sin índice y ciudad', () => {
    const lugar = buildLugar(config([BANCO, propia(1)], { ciudad: 'Viña del Mar' }), BASE)
    expect(lugar).toEqual({
      titulo: 'El lugar',
      ciudad: 'Viña del Mar',
      disposicion: 'una',
      fotos: [{ src: propia(1), alt: 'Peluquería Luna — el lugar' }],
    })
  })

  it('2 fotos → dos, alt con índice; ciudad vacía se omite', () => {
    const lugar = buildLugar(config([propia(0), propia(1), propia(2)], { ciudad: '  ' }), BASE)
    expect(lugar?.disposicion).toBe('dos')
    expect(lugar?.ciudad).toBeNull()
    expect(lugar?.fotos.map((foto) => foto.alt)).toEqual(['Peluquería Luna — el lugar 1', 'Peluquería Luna — el lugar 2'])
  })

  it('5 fotos propias → tres, solo las 3 primeras de imagenes[1..]', () => {
    const lugar = buildLugar(config([propia(0), propia(1), propia(2), propia(3), propia(4), propia(5)]), BASE)
    expect(lugar?.disposicion).toBe('tres')
    expect(lugar?.fotos.map((foto) => foto.src)).toEqual([propia(1), propia(2), propia(3)])
  })

  it('imagenes[0] nunca aparece', () => {
    const lugar = buildLugar(config([propia(0), propia(1), propia(2), propia(3)]), BASE)
    expect(lugar?.fotos.map((foto) => foto.src)).not.toContain(propia(0))
  })

  it('sin base URL → null', () => {
    expect(buildLugar(config([propia(0), propia(1)]), null)).toBeNull()
  })
})
