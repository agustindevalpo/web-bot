import { SignJWT, jwtVerify } from 'jose'

// Sesión del panel interno — independiente de la sesión de clientes
// (webbot_auth) para que un cliente logueado nunca vea /admin y para poder
// revocar una sin tocar la otra. Comparte AUTH_SECRET porque ambas viven en
// el mismo deploy.
export const ADMIN_COOKIE_NAME = 'webbot_admin'
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

const ROL_ADMIN = 'admin'

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET no está configurada — ver .env.example')
  }
  return new TextEncoder().encode(secret)
}

export async function crearSesionAdminJWT(): Promise<string> {
  return new SignJWT({ rol: ROL_ADMIN })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getSecret())
}

export async function verificarSesionAdminJWT(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload.rol === ROL_ADMIN
  } catch {
    return false
  }
}
