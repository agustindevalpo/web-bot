import { calcularScrollNavHorizontal } from '@/components/templates/shared/navScroll'

// Pinea los 3 casos del nav móvil con scroll (S1-fix,
// odd/tasks/nav-movil-seccionesspa.md) — ver el comentario de
// `calcularScrollNavHorizontal` en navScroll.ts.
describe('shared/navScroll — calcularScrollNavHorizontal', () => {
  it('un ítem ya visible entre ambos paddings no mueve el scroll', () => {
    const resultado = calcularScrollNavHorizontal({
      anchoNav: 300,
      scrollActual: 50,
      offsetItem: 100,
      anchoItem: 80,
      paddingScroll: 18,
    })
    expect(resultado).toBe(50)
  })

  it('un ítem cortado por la derecha se alinea a su propio borde derecho', () => {
    const resultado = calcularScrollNavHorizontal({
      anchoNav: 300,
      scrollActual: 0,
      offsetItem: 350,
      anchoItem: 80,
      paddingScroll: 18,
    })
    // 350 + 80 - 300 + 18 = 148
    expect(resultado).toBe(148)
  })

  it('un ítem cortado por la izquierda (p. ej. volver a la primera sección) se alinea a su borde izquierdo', () => {
    const resultado = calcularScrollNavHorizontal({
      anchoNav: 300,
      scrollActual: 400,
      offsetItem: 0,
      anchoItem: 80,
      paddingScroll: 18,
    })
    expect(resultado).toBe(0)
  })

  it('nunca devuelve un scrollLeft negativo aunque el cálculo lo pida', () => {
    const resultado = calcularScrollNavHorizontal({
      anchoNav: 300,
      scrollActual: 20,
      offsetItem: 5,
      anchoItem: 20,
      paddingScroll: 18,
    })
    // 5 - 18 = -13 → clamp a 0
    expect(resultado).toBe(0)
  })
})
