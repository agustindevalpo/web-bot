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

describe('container — getCustomHostnameService', () => {
  it('devuelve el Noop cuando faltan las credenciales de Cloudflare', async () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    delete process.env.CLOUDFLARE_API_TOKEN
    delete process.env.CLOUDFLARE_ZONE_ID
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCustomHostnameService } = require('@/infrastructure/container')

    const resultado = await getCustomHostnameService().asegurarHostname('www.x.cl')

    expect(resultado.estado).toBe('no_configurado')
  })

  it('devuelve el Noop si solo está una de las dos credenciales', async () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, CLOUDFLARE_API_TOKEN: 'tok' }
    delete process.env.CLOUDFLARE_ZONE_ID
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCustomHostnameService } = require('@/infrastructure/container')

    const resultado = await getCustomHostnameService().asegurarHostname('www.x.cl')

    expect(resultado.estado).toBe('no_configurado')
  })

  it('devuelve la implementación de Cloudflare (memoizada) con ambas credenciales', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, CLOUDFLARE_API_TOKEN: 'tok', CLOUDFLARE_ZONE_ID: 'zona' }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCustomHostnameService } = require('@/infrastructure/container')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CloudflareCustomHostnameService } = require('@/infrastructure/cloudflare/CloudflareCustomHostnameService')

    const primera = getCustomHostnameService()

    expect(primera).toBeInstanceOf(CloudflareCustomHostnameService)
    expect(getCustomHostnameService()).toBe(primera)
  })

  it('exporta los use cases del panel interno', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const container = require('@/infrastructure/container')

    expect(container.listarSitiosUC).toBeDefined()
    expect(container.cambiarEstadoSitioUC).toBeDefined()
    expect(container.asignarDominioPropioUC).toBeDefined()
    expect(container.actualizarConfigSitioUC).toBeDefined()
  })
})

// Triangulation skipped: re-export estructural de un singleton sin ramas —
// un solo resultado posible, cubierto en TemplateService.test.ts.
describe('container — templateService', () => {
  it('exporta un templateService capaz de resolver un Template real', () => {
    jest.resetModules()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { templateService } = require('@/infrastructure/container')

    expect(
      templateService.seleccionarTemplate({
        nombre: '',
        rubro: 'panaderia',
        descripcion: '',
        servicios: [],
        ciudad: '',
        contacto: { telefono: '', email: '' },
        redes: {},
        estilo: 'moderno',
        highlight: '',
      }),
    ).toBe('RESTAURANTE')
  })
})
