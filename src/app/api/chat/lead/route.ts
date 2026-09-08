import { NextRequest, NextResponse } from 'next/server'
import { capturarLeadDemoUC, clienteRepo } from '@/infrastructure/container'
import { resolverModoChat } from '@/infrastructure/auth/modoChat'
import { SESSION_COOKIE_NAME } from '@/infrastructure/auth/JwtSessionService'
import { LeadInvalidoException } from '@/domain/exceptions/LeadInvalidoException'
import { SesionNoEncontradaException } from '@/domain/exceptions/SesionNoEncontradaException'
import { SesionIncompletaException } from '@/domain/exceptions/SesionIncompletaException'
import { SesionNoDemoException } from '@/domain/exceptions/SesionNoDemoException'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''
    const nombre = typeof body?.nombre === 'string' ? body.nombre : ''
    const email = typeof body?.email === 'string' ? body.email : ''

    // Re-deriva el modo (demo vs. cliente real y pagado) de forma
    // independiente a lo que el chat haya devuelto — nunca se confía en un
    // flag que venga del cliente HTTP.
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
    const esDemo = await resolverModoChat(token, clienteRepo)

    const resultado = await capturarLeadDemoUC.execute({ sessionId, nombre, email, esDemo })

    return NextResponse.json({ subdominioDemo: resultado.subdominioDemo })
  } catch (error) {
    if (error instanceof LeadInvalidoException) {
      return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 })
    }
    if (error instanceof SesionNoDemoException) {
      return NextResponse.json({ error: 'sesion_no_demo' }, { status: 400 })
    }
    if (error instanceof SesionIncompletaException) {
      return NextResponse.json({ error: 'sesion_incompleta' }, { status: 400 })
    }
    if (error instanceof SesionNoEncontradaException) {
      return NextResponse.json({ error: 'sesion_no_encontrada' }, { status: 404 })
    }

    console.error('[/api/chat/lead]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
