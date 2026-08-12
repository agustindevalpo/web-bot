import { NextRequest, NextResponse } from 'next/server'
import { verificarAccesoUC } from '@/infrastructure/container'
import {
  crearSesionJWT,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/infrastructure/auth/JwtSessionService'
import { TokenAccesoInvalidoException } from '@/domain/exceptions/TokenAccesoInvalidoException'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=token_invalido', req.url))
  }

  try {
    const { clienteId, email } = await verificarAccesoUC.execute(token)
    const jwt = await crearSesionJWT(clienteId, email)

    const response = NextResponse.redirect(new URL('/onboarding', req.url))
    response.cookies.set(SESSION_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
    return response
  } catch (error) {
    if (error instanceof TokenAccesoInvalidoException) {
      return NextResponse.redirect(new URL('/login?error=token_invalido', req.url))
    }
    throw error
  }
}
