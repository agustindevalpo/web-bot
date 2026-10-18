import { alternarFaq, FAQ_ABIERTO_INICIAL } from '@/app/_landing/faqEstado'

describe('alternarFaq', () => {
  it('el primer ítem abre por defecto', () => {
    expect(FAQ_ABIERTO_INICIAL).toBe(0)
  })

  it('abrir otro ítem cierra el anterior (solo uno abierto)', () => {
    expect(alternarFaq(0, 3)).toBe(3)
  })

  it('pulsar el ítem abierto lo cierra', () => {
    expect(alternarFaq(2, 2)).toBeNull()
  })

  it('con todo cerrado, pulsar un ítem lo abre', () => {
    expect(alternarFaq(null, 1)).toBe(1)
  })
})
