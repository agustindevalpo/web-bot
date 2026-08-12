import { TokenAcceso } from '@/domain/entities/TokenAcceso'

describe('TokenAcceso entity', () => {
  it('crear() guarda el hash del token, no el token plano', () => {
    const token = TokenAcceso.crear('a@b.cl', 'token-plano-123')

    expect(token.tokenHash).not.toBe('token-plano-123')
    expect(token.tokenHash).toHaveLength(64)
    expect(token.tokenHash).toBe(TokenAcceso.hash('token-plano-123'))
  })

  it('es válido recién creado', () => {
    const token = TokenAcceso.crear('a@b.cl', 'token-plano')

    expect(token.esValido()).toBe(true)
    expect(token.estaExpirado()).toBe(false)
    expect(token.estaUsado()).toBe(false)
  })

  it('estaExpirado() es true si expiraEn ya pasó', () => {
    const token = new TokenAcceso('id-1', 'a@b.cl', 'hash', new Date(Date.now() - 1000))

    expect(token.estaExpirado()).toBe(true)
    expect(token.esValido()).toBe(false)
  })

  it('marcarUsado() marca usadoEn y esValido() pasa a false', () => {
    const token = TokenAcceso.crear('a@b.cl', 'token-plano')

    token.marcarUsado()

    expect(token.estaUsado()).toBe(true)
    expect(token.usadoEn).toBeInstanceOf(Date)
    expect(token.esValido()).toBe(false)
  })
})
