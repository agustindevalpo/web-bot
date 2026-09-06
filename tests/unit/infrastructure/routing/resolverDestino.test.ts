import {
  normalizarHost,
  resolverDestino,
  variantesDominio,
  EntradaDestino,
} from '@/infrastructure/routing/resolverDestino'

const BASE: Pick<EntradaDestino, 'baseDomain' | 'appDomain'> = {
  baseDomain: 'sitios.devalpo.cl',
  appDomain: 'webbot.devalpo.cl',
}

function entrada(extra: Partial<EntradaDestino>): EntradaDestino {
  return { host: '', pathname: '/', ...BASE, ...extra }
}

describe('resolverDestino', () => {
  describe('regla (b): hosts de la app no se reescriben', () => {
    it.each([
      ['webbot.devalpo.cl', 'appDomain'],
      ['localhost:3000', 'localhost con puerto'],
      ['localhost', 'localhost sin puerto'],
      ['web-bot-production.up.railway.app', 'host de Railway'],
    ])('host "%s" (%s) → app', (host) => {
      expect(resolverDestino(entrada({ host }))).toEqual({ tipo: 'app' })
    })

    it('compara appDomain sin importar mayúsculas', () => {
      expect(resolverDestino(entrada({ host: 'WebBot.Devalpo.CL' }))).toEqual({ tipo: 'app' })
    })
  })

  describe('regla (c): subdominios de baseDomain', () => {
    it('extrae el subdominio y conserva el pathname', () => {
      expect(
        resolverDestino(entrada({ host: 'panaderia.sitios.devalpo.cl', pathname: '/menu' })),
      ).toEqual({
        tipo: 'subdominio',
        subdominio: 'panaderia',
        rutaInterna: '/sites/panaderia/menu',
      })
    })

    it('no confunde un host que solo termina en el mismo texto sin el punto', () => {
      const destino = resolverDestino(entrada({ host: 'otrossitios.devalpo.cl' }))
      expect(destino.tipo).toBe('dominioPropio')
    })
  })

  describe('regla (d): fallback a dominio propio con el host normalizado', () => {
    it('reescribe a /sites/custom/{host}{pathname}', () => {
      expect(resolverDestino(entrada({ host: 'panaderia.cl', pathname: '/contacto' }))).toEqual({
        tipo: 'dominioPropio',
        dominio: 'panaderia.cl',
        rutaInterna: '/sites/custom/panaderia.cl/contacto',
      })
    })

    it('quita el puerto', () => {
      expect(resolverDestino(entrada({ host: 'panaderia.cl:8443' }))).toMatchObject({
        tipo: 'dominioPropio',
        dominio: 'panaderia.cl',
      })
    })

    it('pasa el host a minúsculas', () => {
      expect(resolverDestino(entrada({ host: 'PANADERIA.CL' }))).toMatchObject({
        tipo: 'dominioPropio',
        dominio: 'panaderia.cl',
      })
    })

    it('conserva el prefijo www. tal cual (lo resuelve la página)', () => {
      expect(resolverDestino(entrada({ host: 'www.panaderia.cl' }))).toMatchObject({
        tipo: 'dominioPropio',
        dominio: 'www.panaderia.cl',
        rutaInterna: '/sites/custom/www.panaderia.cl/',
      })
    })

    it('usa "/" como pathname por defecto', () => {
      expect(resolverDestino(entrada({ host: 'panaderia.cl', pathname: undefined }))).toMatchObject({
        rutaInterna: '/sites/custom/panaderia.cl/',
      })
    })
  })

  describe('regla (a): X-WebBot-Forwarded-Host del Worker', () => {
    const hostRailway = 'custom.sitios.devalpo.cl'

    it('sin secreto configurado, confía en la cabecera', () => {
      expect(
        resolverDestino(
          entrada({ host: hostRailway, forwardedHost: 'panaderia.cl', secretEsperado: undefined }),
        ),
      ).toMatchObject({ tipo: 'dominioPropio', dominio: 'panaderia.cl' })
    })

    it('con secreto vacío, confía en la cabecera', () => {
      expect(
        resolverDestino(entrada({ host: hostRailway, forwardedHost: 'panaderia.cl', secretEsperado: '' })),
      ).toMatchObject({ tipo: 'dominioPropio', dominio: 'panaderia.cl' })
    })

    it('con secreto configurado y coincidente, confía en la cabecera', () => {
      expect(
        resolverDestino(
          entrada({
            host: hostRailway,
            forwardedHost: 'panaderia.cl',
            secretRecibido: 's3cr3t',
            secretEsperado: 's3cr3t',
          }),
        ),
      ).toMatchObject({ tipo: 'dominioPropio', dominio: 'panaderia.cl' })
    })

    it('con secreto configurado y distinto, ignora la cabecera y sigue las reglas normales', () => {
      expect(
        resolverDestino(
          entrada({
            host: hostRailway,
            forwardedHost: 'panaderia.cl',
            secretRecibido: 'otro',
            secretEsperado: 's3cr3t',
          }),
        ),
      ).toEqual({ tipo: 'subdominio', subdominio: 'custom', rutaInterna: '/sites/custom/' })
    })

    it('con secreto configurado y sin cabecera de secreto, ignora X-WebBot-Forwarded-Host', () => {
      expect(
        resolverDestino(
          entrada({ host: hostRailway, forwardedHost: 'panaderia.cl', secretEsperado: 's3cr3t' }),
        ),
      ).toMatchObject({ tipo: 'subdominio', subdominio: 'custom' })
    })

    it('normaliza el host reenviado (mayúsculas, puerto, espacios)', () => {
      expect(
        resolverDestino(entrada({ host: hostRailway, forwardedHost: '  Panaderia.CL:443 ' })),
      ).toMatchObject({ tipo: 'dominioPropio', dominio: 'panaderia.cl' })
    })

    it('conserva www. en el host reenviado', () => {
      expect(
        resolverDestino(entrada({ host: hostRailway, forwardedHost: 'www.panaderia.cl' })),
      ).toMatchObject({ tipo: 'dominioPropio', dominio: 'www.panaderia.cl' })
    })

    it('una cabecera vacía o en blanco no cuenta como presente', () => {
      expect(resolverDestino(entrada({ host: hostRailway, forwardedHost: '   ' }))).toMatchObject({
        tipo: 'subdominio',
        subdominio: 'custom',
      })
    })

    it('Threat: una cabecera confiable con el dominio de la app no la convierte en dominio propio', () => {
      expect(
        resolverDestino(entrada({ host: hostRailway, forwardedHost: 'webbot.devalpo.cl' })),
      ).toEqual({ tipo: 'app' })
    })

    it('una cabecera confiable con un subdominio propio se trata como subdominio', () => {
      expect(
        resolverDestino(entrada({ host: hostRailway, forwardedHost: 'panaderia.sitios.devalpo.cl' })),
      ).toMatchObject({ tipo: 'subdominio', subdominio: 'panaderia' })
    })
  })

  it('no lanza con host ausente', () => {
    expect(() => resolverDestino(entrada({ host: undefined }))).not.toThrow()
    expect(resolverDestino(entrada({ host: null }))).toMatchObject({ tipo: 'dominioPropio', dominio: '' })
  })
})

describe('normalizarHost', () => {
  it.each([
    ['Panaderia.CL', 'panaderia.cl'],
    ['panaderia.cl:3000', 'panaderia.cl'],
    ['  panaderia.cl  ', 'panaderia.cl'],
    ['www.panaderia.cl', 'www.panaderia.cl'],
  ])('"%s" → "%s"', (bruto, esperado) => {
    expect(normalizarHost(bruto)).toBe(esperado)
  })
})

describe('variantesDominio', () => {
  it('devuelve el dominio y su versión sin www. cuando aplica', () => {
    expect(variantesDominio('www.panaderia.cl')).toEqual(['www.panaderia.cl', 'panaderia.cl'])
  })

  it('devuelve solo el dominio cuando no empieza con www.', () => {
    expect(variantesDominio('panaderia.cl')).toEqual(['panaderia.cl'])
  })

  it('normaliza antes de derivar variantes', () => {
    expect(variantesDominio('WWW.Panaderia.CL:443')).toEqual(['www.panaderia.cl', 'panaderia.cl'])
  })

  it('no genera una variante vacía para "www."', () => {
    expect(variantesDominio('www.')).toEqual(['www.'])
  })
})
