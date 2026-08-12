import { crearSesionJWT, verificarSesionJWT } from '@/infrastructure/auth/JwtSessionService'

describe('JwtSessionService', () => {
  const secretOriginal = process.env.AUTH_SECRET

  beforeEach(() => {
    process.env.AUTH_SECRET = 'secreto-de-test-suficientemente-largo'
  })

  afterAll(() => {
    process.env.AUTH_SECRET = secretOriginal
  })

  it('crea y verifica un JWT válido de punta a punta', async () => {
    const jwt = await crearSesionJWT('cliente-1', 'a@b.cl')
    const payload = await verificarSesionJWT(jwt)

    expect(payload).toEqual({ clienteId: 'cliente-1', email: 'a@b.cl' })
  })

  it('devuelve null para un token corrupto', async () => {
    const payload = await verificarSesionJWT('esto-no-es-un-jwt')

    expect(payload).toBeNull()
  })

  it('devuelve null para un token firmado con otro secret', async () => {
    const jwt = await crearSesionJWT('cliente-1', 'a@b.cl')

    process.env.AUTH_SECRET = 'otro-secreto-completamente-distinto'
    const payload = await verificarSesionJWT(jwt)

    expect(payload).toBeNull()
  })

  it('crearSesionJWT tira si AUTH_SECRET no está configurada', async () => {
    delete process.env.AUTH_SECRET

    await expect(crearSesionJWT('cliente-1', 'a@b.cl')).rejects.toThrow('AUTH_SECRET')
  })
})
