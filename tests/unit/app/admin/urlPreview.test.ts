import { construirUrlPreview } from '@/app/admin/_lib/urlPreview'

describe('construirUrlPreview', () => {
  it('en local apunta a /sites/<subdominio> de la app', () => {
    expect(construirUrlPreview('testpyme', 'http://localhost:3000', 'sitios.devalpo.cl')).toBe(
      'http://localhost:3000/sites/testpyme',
    )
  })

  it('en local tolera la barra final de NEXT_PUBLIC_APP_URL', () => {
    expect(construirUrlPreview('testpyme', 'http://localhost:3000/', 'sitios.devalpo.cl')).toBe(
      'http://localhost:3000/sites/testpyme',
    )
  })

  it('fuera de local usa el subdominio real sobre el base domain', () => {
    expect(construirUrlPreview('testpyme', 'https://webbot.devalpo.cl', 'sitios.devalpo.cl')).toBe(
      'https://testpyme.sitios.devalpo.cl',
    )
  })

  it('sin APP_URL configurada también usa el subdominio real', () => {
    expect(construirUrlPreview('testpyme', '', 'sitios.devalpo.cl')).toBe('https://testpyme.sitios.devalpo.cl')
  })
})
