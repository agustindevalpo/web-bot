import { verificarLimiteClaude } from '@/infrastructure/claude/claudeRateLimit'

describe('verificarLimiteClaude', () => {
  it('permite los primeros 20 mensajes del mismo clienteId', () => {
    const clienteId = 'cliente-20-ok-' + Date.now()
    for (let i = 0; i < 20; i++) {
      expect(verificarLimiteClaude(clienteId).permitido).toBe(true)
    }
  })

  it('bloquea el mensaje 21 del mismo clienteId', () => {
    const clienteId = 'cliente-21-bloqueado-' + Date.now()
    for (let i = 0; i < 20; i++) {
      verificarLimiteClaude(clienteId)
    }
    const resultado = verificarLimiteClaude(clienteId)
    expect(resultado.permitido).toBe(false)
    expect(resultado.restantes).toBe(0)
  })

  it('clienteIds distintos tienen contadores independientes', () => {
    const ts = Date.now()
    const clienteA = `cliente-a-${ts}`
    const clienteB = `cliente-b-${ts}`
    for (let i = 0; i < 20; i++) {
      verificarLimiteClaude(clienteA)
    }
    expect(verificarLimiteClaude(clienteA).permitido).toBe(false)
    expect(verificarLimiteClaude(clienteB).permitido).toBe(true)
  })

  it('resetea la ventana de 24h cuando ya pasó resetAt', () => {
    const clienteId = 'cliente-reset-' + Date.now()
    const nowSpy = jest.spyOn(Date, 'now')
    const inicio = 1_700_000_000_000
    nowSpy.mockReturnValue(inicio)

    for (let i = 0; i < 20; i++) {
      verificarLimiteClaude(clienteId)
    }
    expect(verificarLimiteClaude(clienteId).permitido).toBe(false)

    // avanzar 24h + 1ms más allá de la ventana
    nowSpy.mockReturnValue(inicio + 24 * 60 * 60 * 1000 + 1)
    const resultado = verificarLimiteClaude(clienteId)
    expect(resultado.permitido).toBe(true)
    expect(resultado.restantes).toBe(19)

    nowSpy.mockRestore()
  })
})
