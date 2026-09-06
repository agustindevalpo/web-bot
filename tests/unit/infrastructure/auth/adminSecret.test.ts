import { validarAdminSecret, adminSecretConfigurado } from '@/infrastructure/auth/adminSecret'

describe('adminSecret', () => {
  const secretOriginal = process.env.ADMIN_SECRET

  beforeEach(() => {
    process.env.ADMIN_SECRET = 'clave-super-secreta'
  })

  afterAll(() => {
    process.env.ADMIN_SECRET = secretOriginal
  })

  it('acepta la contraseña exacta', () => {
    expect(validarAdminSecret('clave-super-secreta')).toBe(true)
  })

  it('rechaza una contraseña distinta del mismo largo', () => {
    expect(validarAdminSecret('clave-super-secretX')).toBe(false)
  })

  it('rechaza una contraseña de distinto largo', () => {
    expect(validarAdminSecret('clave')).toBe(false)
    expect(validarAdminSecret('clave-super-secreta-mas-larga')).toBe(false)
  })

  it('rechaza el string vacío', () => {
    expect(validarAdminSecret('')).toBe(false)
  })

  it('rechaza todo si ADMIN_SECRET no está configurada', () => {
    delete process.env.ADMIN_SECRET

    expect(adminSecretConfigurado()).toBe(false)
    expect(validarAdminSecret('clave-super-secreta')).toBe(false)
    expect(validarAdminSecret('')).toBe(false)
  })

  it('adminSecretConfigurado es true cuando existe la variable', () => {
    expect(adminSecretConfigurado()).toBe(true)
  })
})
