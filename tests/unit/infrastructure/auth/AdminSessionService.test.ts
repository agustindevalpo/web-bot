import {
  crearSesionAdminJWT,
  verificarSesionAdminJWT,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from '@/infrastructure/auth/AdminSessionService'
import { crearSesionJWT } from '@/infrastructure/auth/JwtSessionService'

describe('AdminSessionService', () => {
  const secretOriginal = process.env.AUTH_SECRET

  beforeEach(() => {
    process.env.AUTH_SECRET = 'secreto-de-test-suficientemente-largo'
  })

  afterAll(() => {
    process.env.AUTH_SECRET = secretOriginal
  })

  it('usa una cookie distinta a la de clientes y dura 12 horas', () => {
    expect(ADMIN_COOKIE_NAME).toBe('webbot_admin')
    expect(ADMIN_SESSION_MAX_AGE_SECONDS).toBe(12 * 60 * 60)
  })

  it('crea y verifica un JWT de admin de punta a punta', async () => {
    const jwt = await crearSesionAdminJWT()

    expect(await verificarSesionAdminJWT(jwt)).toBe(true)
  })

  it('rechaza un token corrupto', async () => {
    expect(await verificarSesionAdminJWT('esto-no-es-un-jwt')).toBe(false)
  })

  it('rechaza un token firmado con otro secret', async () => {
    const jwt = await crearSesionAdminJWT()

    process.env.AUTH_SECRET = 'otro-secreto-completamente-distinto'

    expect(await verificarSesionAdminJWT(jwt)).toBe(false)
  })

  it('rechaza una sesión de cliente aunque esté firmada con el mismo secret', async () => {
    const jwtCliente = await crearSesionJWT('cliente-1', 'a@b.cl')

    expect(await verificarSesionAdminJWT(jwtCliente)).toBe(false)
  })

  it('crearSesionAdminJWT tira si AUTH_SECRET no está configurada', async () => {
    delete process.env.AUTH_SECRET

    await expect(crearSesionAdminJWT()).rejects.toThrow('AUTH_SECRET')
  })

  it('verificarSesionAdminJWT devuelve false (no tira) si AUTH_SECRET no está configurada', async () => {
    const jwt = await crearSesionAdminJWT()
    delete process.env.AUTH_SECRET

    expect(await verificarSesionAdminJWT(jwt)).toBe(false)
  })
})
