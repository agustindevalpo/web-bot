import { rubroVisible } from '@/components/templates/shared/rubroVisible'

describe('rubroVisible', () => {
  it.each([
    ['panaderia', 'Panadería'],
    ['ferreteria', 'Ferretería'],
    ['taller', 'Taller mecánico'],
    ['  Dentista ', 'Dentista'],
  ])('escribe el rubro conocido %s como %s', (entrada, esperado) => {
    expect(rubroVisible(entrada)).toBe(esperado)
  })

  it('un rubro libre solo sube la primera letra', () => {
    expect(rubroVisible('estudio de tatuajes')).toBe('Estudio de tatuajes')
  })
})
