// Aislado con jest.resetModules() + require() dinámico porque
// getChatServiceReal() es un singleton memoizado a nivel de módulo — cada
// caso necesita su propia carga limpia de container.ts con env distinto.
// `export {}` aísla el scope del archivo (sin imports de nivel superior
// TypeScript lo trataría como script global).
export {}

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
    expect(container.confirmarPagoSitioUC).toBeDefined()
  })

  it('inyecta confirmarPagoSitioUC con el CLIENTE_DEMO_ID compartido (WB-43)', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const container = require('@/infrastructure/container')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ConfirmarPagoSitioUseCase } = require('@/application/use-cases/ConfirmarPagoSitio.usecase')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CLIENTE_DEMO_ID } = require('@/infrastructure/demo/rubroDefaults')

    expect(container.confirmarPagoSitioUC).toBeInstanceOf(ConfirmarPagoSitioUseCase)
    expect((container.confirmarPagoSitioUC as { clienteDemoId: string }).clienteDemoId).toBe(CLIENTE_DEMO_ID)
  })
})

describe('container — getAlmacenamientoArchivos', () => {
  const TODAS_LAS_CREDENCIALES = {
    R2_ACCOUNT_ID: 'cuenta-1',
    R2_ACCESS_KEY_ID: 'ak',
    R2_SECRET_ACCESS_KEY: 'sk',
    R2_BUCKET: 'bucket',
    R2_PUBLIC_URL: 'https://media.devalpo.cl',
  }

  function limpiarEnvR2(env: NodeJS.ProcessEnv): void {
    delete env.R2_ACCOUNT_ID
    delete env.R2_ACCESS_KEY_ID
    delete env.R2_SECRET_ACCESS_KEY
    delete env.R2_BUCKET
    delete env.R2_PUBLIC_URL
  }

  it('devuelve el Noop cuando no hay ninguna credencial de R2', async () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    limpiarEnvR2(process.env)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAlmacenamientoArchivos } = require('@/infrastructure/container')

    const resultado = await getAlmacenamientoArchivos().subir({
      clave: 'x',
      contenido: new Uint8Array([1]),
      tipoContenido: 'image/png',
    })

    expect(resultado.tipo).toBe('no_configurado')
  })

  it.each(Object.keys(TODAS_LAS_CREDENCIALES))('devuelve el Noop si falta solo %s', async (faltante) => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, ...TODAS_LAS_CREDENCIALES }
    limpiarEnvR2(process.env)
    process.env = {
      ...process.env,
      ...Object.fromEntries(Object.entries(TODAS_LAS_CREDENCIALES).filter(([clave]) => clave !== faltante)),
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAlmacenamientoArchivos } = require('@/infrastructure/container')

    const resultado = await getAlmacenamientoArchivos().subir({
      clave: 'x',
      contenido: new Uint8Array([1]),
      tipoContenido: 'image/png',
    })

    expect(resultado.tipo).toBe('no_configurado')
  })

  it.each(['media.devalpo.cl', 'no es una url', 'ftp://media.devalpo.cl'])(
    'devuelve el Noop si R2_PUBLIC_URL no es una URL http(s) absoluta (%s)',
    async (urlInvalida) => {
      jest.resetModules()
      process.env = { ...ORIGINAL_ENV, ...TODAS_LAS_CREDENCIALES, R2_PUBLIC_URL: urlInvalida }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAlmacenamientoArchivos } = require('@/infrastructure/container')

      const resultado = await getAlmacenamientoArchivos().subir({
        clave: 'x',
        contenido: new Uint8Array([1]),
        tipoContenido: 'image/png',
      })

      expect(resultado.tipo).toBe('no_configurado')
    },
  )

  it('devuelve la implementación de R2 (memoizada) con las cinco credenciales', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, ...TODAS_LAS_CREDENCIALES }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAlmacenamientoArchivos } = require('@/infrastructure/container')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { R2AlmacenamientoArchivos } = require('@/infrastructure/storage/R2AlmacenamientoArchivos')

    const primera = getAlmacenamientoArchivos()

    expect(primera).toBeInstanceOf(R2AlmacenamientoArchivos)
    expect(getAlmacenamientoArchivos()).toBe(primera)
  })

  it('exporta subirImagenSitioUC', () => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const container = require('@/infrastructure/container')

    expect(container.subirImagenSitioUC).toBeDefined()
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
