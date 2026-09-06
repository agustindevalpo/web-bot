import { NextRequest, NextResponse } from 'next/server'
import { excedeLimite } from '@/infrastructure/auth/rateLimit'
import { adminSecretConfigurado, validarAdminSecret } from '@/infrastructure/auth/adminSecret'
import {
  crearSesionAdminJWT,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from '@/infrastructure/auth/AdminSessionService'

const MAX_INTENTOS = 5
const VENTANA_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  if (!adminSecretConfigurado()) {
    return NextResponse.json({ error: 'El panel interno no está configurado' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (excedeLimite(`admin-login:${ip}`, MAX_INTENTOS, VENTANA_MS)) {
    return NextResponse.json(
      { error: 'Demasiados intentos, inténtalo de nuevo más tarde' },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!validarAdminSecret(password)) {
    // Mensaje genérico a propósito: no se distingue entre vacía e incorrecta.
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const jwt = await crearSesionAdminJWT()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  })
  return response
}
