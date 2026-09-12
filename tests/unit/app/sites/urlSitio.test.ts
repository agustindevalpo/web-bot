import { construirUrlSitioDominioPropio, construirUrlSitioSubdominio } from '@/app/sites/urlSitio'

describe('construirUrlSitioSubdominio', () => {
  it.each([
    ['panaderia', 'sitios.devalpo.cl', 'https://panaderia.sitios.devalpo.cl'],
    ['demo-cea59ef1', 'sitios.devalpo.cl', 'https://demo-cea59ef1.sitios.devalpo.cl'],
  ])('subdominio "%s" + baseDomain "%s" → "%s"', (subdominio, baseDomain, esperado) => {
    expect(construirUrlSitioSubdominio(subdominio, baseDomain)).toBe(esperado)
  })
})

describe('construirUrlSitioDominioPropio', () => {
  it.each([
    ['panaderia.cl', 'https://panaderia.cl'],
    ['www.panaderia.cl', 'https://www.panaderia.cl'],
  ])('host "%s" → "%s"', (host, esperado) => {
    expect(construirUrlSitioDominioPropio(host)).toBe(esperado)
  })
})
