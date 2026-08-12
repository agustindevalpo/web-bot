import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE_NAME = 'webbot_auth'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

interface SesionPayload {
  clienteId: string
  email: string
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET no está configurada — ver .env.example')
  }
  return new TextEncoder().encode(secret)
}

export async function crearSesionJWT(clienteId: string, email: string): Promise<string> {
  return new SignJWT({ clienteId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verificarSesionJWT(token: string): Promise<SesionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (typeof payload.clienteId !== 'string' || typeof payload.email !== 'string') {
      return null
    }
    return { clienteId: payload.clienteId, email: payload.email }
  } catch {
    return null
  }
}
