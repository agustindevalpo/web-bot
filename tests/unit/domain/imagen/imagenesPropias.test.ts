import { claveSiPropia, urlsImagenDeConfig } from '@/domain/imagen/imagenesPropias'

const BASE = 'https://media.devalpo.cl'

describe('claveSiPropia', () => {
  it('extrae la clave de una URL bajo sitios/<sitioId>/', () => {
    expect(claveSiPropia(`${BASE}/sitios/s1/logo-abc.png`, BASE, 's1')).toBe('sitios/s1/logo-abc.png')
  })

  it('tolera barras finales en la base pública', () => {
    expect(claveSiPropia(`${BASE}/sitios/s1/logo-abc.png`, `${BASE}//`, 's1')).toBe('sitios/s1/logo-abc.png')
  })

  it.each([
    ['URL externa (Unsplash)', 'https://images.unsplash.com/photo-1?w=800'],
    ['clave de otro sitio', `${BASE}/sitios/s2/logo-abc.png`],
    ['prefijo de sitio parecido', `${BASE}/sitios/s10/logo-abc.png`],
    ['host con la base como prefijo', 'https://media.devalpo.cl.evil.com/sitios/s1/logo-abc.png'],
    ['host con userinfo', 'https://media.devalpo.cl@evil.com/sitios/s1/logo-abc.png'],
    ['path traversal', `${BASE}/sitios/s1/../s2/logo.png`],
    ['traversal escapado', `${BASE}/sitios/s1/%2e%2e/logo.png`],
    ['subcarpeta', `${BASE}/sitios/s1/a/logo.png`],
    ['query string', `${BASE}/sitios/s1/logo.png?x=1`],
    ['hash', `${BASE}/sitios/s1/logo.png#x`],
    ['solo la carpeta', `${BASE}/sitios/s1/`],
    ['fuera de sitios/', `${BASE}/otros/s1/logo.png`],
    ['sin barra tras la base', `${BASE}sitios/s1/logo.png`],
    ['no es string', 42],
    ['vacío', ''],
  ])('no es propia: %s', (_nombre, url) => {
    expect(claveSiPropia(url, BASE, 's1')).toBeNull()
  })

  it('sin base pública configurada nada es propio', () => {
    expect(claveSiPropia(`${BASE}/sitios/s1/logo.png`, null, 's1')).toBeNull()
  })
})

describe('urlsImagenDeConfig', () => {
  it('junta logo e imagenes ignorando valores que no son string', () => {
    expect(urlsImagenDeConfig({ logo: 'a', imagenes: ['b', 3, 'c'] })).toEqual(['a', 'b', 'c'])
  })

  it('devuelve vacío si no hay imágenes', () => {
    expect(urlsImagenDeConfig({ nombre: 'x', imagenes: 'no-array' })).toEqual([])
  })
})
