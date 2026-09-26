import { resolverSeccionActiva } from '@/components/templates/shared/scrollspy'

// Pinea los 4 comportamientos que R3-001 encontró solo a mano en el
// navegador (nunca reproducidos por un test) — ver el comentario de
// `resolverSeccionActiva` en scrollspy.ts.
const ORDEN = ['inicio', 'servicios', 'nosotros', 'contacto']

describe('shared/scrollspy — resolverSeccionActiva', () => {
  it('con dos secciones intersectando en el mismo batch, gana la última en orden de documento', () => {
    const interseccion = new Map([
      ['inicio', false],
      ['servicios', true],
      ['nosotros', true],
      ['contacto', false],
    ])
    expect(resolverSeccionActiva(ORDEN, interseccion, false, 500, 'inicio')).toBe('nosotros')
  })

  it('una sección final demasiado corta para cruzar la franja se activa igual vía el centinela de fin de página', () => {
    const interseccion = new Map([
      ['inicio', false],
      ['servicios', true],
      ['nosotros', false],
      ['contacto', false],
    ])
    expect(resolverSeccionActiva(ORDEN, interseccion, true, 900, 'servicios')).toBe('contacto')
  })

  it('el centinela deja de ganar apenas sale del viewport al volver a subir', () => {
    const interseccion = new Map([
      ['inicio', false],
      ['servicios', true],
      ['nosotros', false],
      ['contacto', false],
    ])
    expect(resolverSeccionActiva(ORDEN, interseccion, false, 900, 'contacto')).toBe('servicios')
  })

  it('una página que entra entera en el viewport arranca en la primera sección, no en la última', () => {
    const interseccion = new Map<string, boolean>()
    expect(resolverSeccionActiva(ORDEN, interseccion, true, 0, 'inicio')).toBe('inicio')
  })
})
