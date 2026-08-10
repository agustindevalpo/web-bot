import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'

describe('Sitio entity', () => {
  let sitio: Sitio

  beforeEach(() => {
    sitio = new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, { nombre: 'Test Pyme' })
  })

  it('está activo por defecto', () => {
    expect(sitio.activo).toBe(true)
    expect(sitio.estaActivo()).toBe(true)
  })

  it('pausar() pone activo=false', () => {
    sitio.pausar()
    expect(sitio.estaActivo()).toBe(false)
  })

  it('reactivar() pone activo=true', () => {
    sitio.pausar()
    sitio.reactivar()
    expect(sitio.estaActivo()).toBe(true)
  })

  it('conectarDominio() setea dominioPropio', () => {
    expect(sitio.dominioPropio).toBeNull()
    sitio.conectarDominio('www.testpyme.cl')
    expect(sitio.dominioPropio).toBe('www.testpyme.cl')
  })
})
