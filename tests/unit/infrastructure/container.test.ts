// Aislado con jest.resetModules() + require() dinámico porque
// getChatServiceReal() es un singleton memoizado a nivel de módulo — cada
// caso necesita su propia carga limpia de container.ts con env distinto.
const ORIGINAL_ENV = process.env

afterEach(() => {
  process.env = ORIGINAL_ENV
  jest.resetModules()
})

describe('container — getChatServiceReal', () => {
  it('devuelve null cuando ANTHROPIC_API_KEY no está configurada', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    delete process.env.ANTHROPIC_API_KEY
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getChatServiceReal } = require('@/infrastructure/container')

    expect(getChatServiceReal()).toBeNull()
  })

  it('devuelve una instancia (no null) cuando ANTHROPIC_API_KEY está configurada', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, ANTHROPIC_API_KEY: 'sk-ant-test-key' }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getChatServiceReal } = require('@/infrastructure/container')

    expect(getChatServiceReal()).not.toBeNull()
  })

  it('memoiza: dos llamadas con la key configurada devuelven la MISMA instancia', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, ANTHROPIC_API_KEY: 'sk-ant-test-key' }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getChatServiceReal } = require('@/infrastructure/container')

    const primera = getChatServiceReal()
    const segunda = getChatServiceReal()

    expect(primera).toBe(segunda)
  })

  it('no exporta ya un `chatService` eager (reemplazado por getChatServiceReal)', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    delete process.env.ANTHROPIC_API_KEY
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const container = require('@/infrastructure/container')

    expect(container.chatService).toBeUndefined()
  })
})
