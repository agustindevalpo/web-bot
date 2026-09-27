// Aislado con jest.resetModules() + require() dinámico porque
// remotePatternsImagenes() lee process.env — mismo motivo que
// container.test.ts.
export {}

const ORIGINAL_ENV = process.env

afterEach(() => {
  process.env = ORIGINAL_ENV
  jest.resetModules()
})

describe('next.config — remotePatternsImagenes', () => {
  it('siempre incluye images.unsplash.com', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    delete process.env.R2_PUBLIC_URL
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { remotePatternsImagenes } = require('../../next.config')

    expect(remotePatternsImagenes()).toEqual([{ hostname: 'images.unsplash.com' }])
  })

  it('agrega el host de R2_PUBLIC_URL cuando está configurada', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, R2_PUBLIC_URL: 'https://media.devalpo.cl' }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { remotePatternsImagenes } = require('../../next.config')

    expect(remotePatternsImagenes()).toEqual([
      { hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'media.devalpo.cl' },
    ])
  })

  it('ignora una R2_PUBLIC_URL mal formada en vez de romper el boot', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, R2_PUBLIC_URL: 'no-es-una-url' }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { remotePatternsImagenes } = require('../../next.config')

    expect(remotePatternsImagenes()).toEqual([{ hostname: 'images.unsplash.com' }])
  })
})
