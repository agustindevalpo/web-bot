import { resolverTemplate } from '@/components/templates/resolver'
import { Template } from '@/domain/value-objects/Template'

const REGISTRO_FAKE: Record<Template, string> = {
  [Template.LANDING]: 'landing',
  [Template.SERVICIOS]: 'servicios',
  [Template.PORTFOLIO]: 'portfolio',
  [Template.RESTAURANTE]: 'restaurante',
  [Template.TIENDA]: 'tienda',
}

describe('resolverTemplate', () => {
  const valoresConocidos: Template[] = [
    Template.LANDING,
    Template.SERVICIOS,
    Template.PORTFOLIO,
    Template.RESTAURANTE,
    Template.TIENDA,
  ]

  it.each(valoresConocidos)('resuelve la entrada correcta para Template.%s', (valor) => {
    expect(resolverTemplate(REGISTRO_FAKE, valor)).toBe(REGISTRO_FAKE[valor])
  })

  it('cae a la entrada LANDING cuando el valor es desconocido (Threat: valor de DB no confiable)', () => {
    expect(resolverTemplate(REGISTRO_FAKE, 'ALGO_INVENTADO')).toBe(REGISTRO_FAKE[Template.LANDING])
  })

  it('cae a la entrada LANDING cuando el valor es undefined', () => {
    expect(resolverTemplate(REGISTRO_FAKE, undefined)).toBe(REGISTRO_FAKE[Template.LANDING])
  })

  it('cae a la entrada LANDING cuando el valor es basura no-string', () => {
    // @ts-expect-error — ejercita un valor no confiable proveniente de una fuente externa (DB)
    expect(resolverTemplate(REGISTRO_FAKE, 12345)).toBe(REGISTRO_FAKE[Template.LANDING])
  })

  it('nunca lanza para ningún valor de entrada', () => {
    expect(() => resolverTemplate(REGISTRO_FAKE, '../../evil')).not.toThrow()
  })

  describe('Threat: prototype pollution / claves heredadas no deben resolver código', () => {
    const clavesHeredadas = ['toString', 'constructor', '__proto__', 'hasOwnProperty']

    it.each(clavesHeredadas)('cae a la entrada LANDING para la clave heredada "%s"', (valor) => {
      expect(resolverTemplate(REGISTRO_FAKE, valor)).toBe(REGISTRO_FAKE[Template.LANDING])
    })
  })
})
