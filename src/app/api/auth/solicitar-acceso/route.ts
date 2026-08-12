import { NextRequest, NextResponse } from 'next/server'
import { solicitarAccesoUC } from '@/infrastructure/container'
import { excedeLimite } from '@/infrastructure/auth/rateLimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const emailNormalizado = email.toLowerCase()
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  if (
    excedeLimite(`ip:${ip}`, 10, 60 * 60 * 1000) ||
    excedeLimite(`email:${emailNormalizado}`, 3, 15 * 60 * 1000)
  ) {
    return NextResponse.json(
      { error: 'Demasiados intentos, probá de nuevo más tarde' },
      { status: 429 },
    )
  }

  // Siempre 200: no se revela si el email ya tenía cuenta.
  await solicitarAccesoUC.execute(emailNormalizado)

  return NextResponse.json({ ok: true })
}
