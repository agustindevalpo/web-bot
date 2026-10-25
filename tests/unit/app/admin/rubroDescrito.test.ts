import { rubroDescritoDe } from '@/app/admin/sitios/[id]/rubroDescrito'

describe('rubroDescritoDe', () => {
  it('devuelve el texto que escribió el cliente, sin espacios sobrantes', () => {
    expect(rubroDescritoDe({ rubroDescrito: '  Tatuajes y perforaciones ' })).toBe('Tatuajes y perforaciones')
  })

  it.each([
    ['ausente', {}],
    ['vacío', { rubroDescrito: '   ' }],
    ['no es string', { rubroDescrito: 42 }],
    ['nulo', { rubroDescrito: null }],
  ])('%s → null', (_caso, config) => {
    expect(rubroDescritoDe(config)).toBeNull()
  })
})
