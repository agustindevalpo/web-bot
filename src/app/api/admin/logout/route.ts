import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/infrastructure/auth/AdminSessionService'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return response
}
