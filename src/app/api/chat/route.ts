import { NextRequest, NextResponse } from 'next/server'
import { sesionRepo, clienteRepo, sitioRepo, getChatServiceReal } from '@/infrastructure/container'
import { DemoChatService } from '@/infrastructure/demo/DemoChatService'
import { verificarLimiteDemoIP } from '@/infrastructure/demo/demoRateLimit'
import { verificarLimiteClaude } from '@/infrastructure/claude/claudeRateLimit'
import { ClaudeServiceError } from '@/infrastructure/claude/claudeErrors'
import { CLIENTE_DEMO_ID } from '@/infrastructure/demo/rubroDefaults'
import { verificarSesionJWT, SESSION_COOKIE_NAME } from '@/infrastructure/auth/JwtSessionService'
import { Sesion } from '@/domain/entities/Sesion'
import { Sitio } from '@/domain/entities/Sitio'
import type { Template } from '@/domain/value-objects/Template'
import { IChatService } from '@/application/services/IChatService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const mensaje = typeof body?.mensaje === 'string' ? body.mensaje.trim() : ''
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''

    if (!mensaje || !sessionId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // ── Determinar modo: demo (sin tokens) vs real (Claude, solo clientes
    // con suscripción activa y pagada) — ver docs/WEBBOT_DEMO_MODE.md.
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
    const sesionAuth = token ? await verificarSesionJWT(token) : null
    const cliente = sesionAuth ? await clienteRepo.findById(sesionAuth.clienteId) : null
    const esDemo = !cliente || !cliente.activo

    // Subdominio del sitio demo generado — derivado del sessionId, no de un
    // sitio prefabricado. Siempre el mismo para la misma conversación, así
    // que no hace falta guardarlo en ningún lado para recuperarlo después.
    const subdominioDemo = esDemo ? `demo-${sessionId.slice(0, 8)}` : null

    // Composición root única del servicio real — construcción perezosa y
    // memoizada (ver Decisión D2 en design.md); null cuando ANTHROPIC_API_KEY
    // no está configurada, sin romper el boot ni el modo demo.
    const chatServiceReal = esDemo ? null : getChatServiceReal()

    if (!esDemo && !chatServiceReal) {
      return NextResponse.json({ error: 'chat_no_configurado' }, { status: 503 })
    }

    const chatService: IChatService = esDemo ? new DemoChatService() : (chatServiceReal as IChatService)

    let sesion = await sesionRepo.findBySessionId(sessionId)

    if (!sesion) {
      // El límite de IP cuenta demos *iniciados* (una vez por conversación
      // nueva), no cada mensaje — si contara cada mensaje, una demo de 8
      // preguntas se cortaría sola al segundo intercambio. Se salta en dev
      // para no bloquearse a uno mismo mientras se prueba localmente.
      if (esDemo && process.env.NODE_ENV === 'production') {
        const ip =
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          req.headers.get('x-real-ip') ??
          '0.0.0.0'

        const { permitido } = verificarLimiteDemoIP(ip)

        if (!permitido) {
          return NextResponse.json(
            {
              error: 'demo_limit_reached',
              mensaje: 'Ya usaste tus 2 demos gratuitos de hoy. Activa tu plan para generar tu sitio real.',
            },
            { status: 429 },
          )
        }
      }

      sesion = new Sesion(crypto.randomUUID(), sessionId)
      await sesionRepo.save(sesion)
    }

    // Conversación ya terminada — no reprocesar, devolver el resultado ya conocido.
    if (sesion.completada) {
      return NextResponse.json({
        respuesta: null,
        completada: true,
        esDemo,
        subdominioDemo,
      })
    }

    // Límite de costo por cliente activado — separado del límite de demos
    // por IP (ver claudeRateLimit.ts). Se chequea antes de cualquier llamada
    // pagada a Claude, sin tocar la sesión (queda intacta y reintentable).
    if (!esDemo && cliente) {
      const limite = verificarLimiteClaude(cliente.id)
      if (!limite.permitido) {
        return NextResponse.json(
          {
            error: 'claude_limit_reached',
            mensaje: 'Alcanzaste el límite de mensajes por hoy. Intenta más tarde.',
          },
          { status: 429 },
        )
      }
    }

    // Reintento de extracción (Decisión D4 en design.md): si la conversación
    // ya tiene las 8 respuestas pero `completada` sigue en false (un intento
    // previo de extraerDatos falló), se salta procesarMensaje y se llama
    // extraerDatos directo — así un reintento no paga una vuelta extra de
    // onboarding ni agrega turnos de más al historial.
    const reintentoDeExtraccion = chatService.conversacionCompleta(sesion.historial)

    let respuesta: string | null = null

    try {
      if (!reintentoDeExtraccion) {
        respuesta = await chatService.procesarMensaje(sesion.historial, mensaje)
        sesion.agregarMensaje('user', mensaje)
        sesion.agregarMensaje('assistant', respuesta)
      }

      if (chatService.conversacionCompleta(sesion.historial)) {
        const datosJson = await chatService.extraerDatos(sesion.historial)
        sesion.marcarCompletada(datosJson as unknown as Record<string, unknown>)

        await sesionRepo.update(sessionId, {
          historial: sesion.historial,
          datosJson: datosJson as unknown as Record<string, unknown>,
          completada: true,
        })

        // Modo demo: persistir el sitio generado con los datos reales del
        // chat, dueño del cliente demo (no factura, no requiere pago) — así
        // /sites/[subdominio] lo sirve igual que cualquier sitio real.
        if (esDemo && subdominioDemo) {
          const existente = await sitioRepo.findBySubdominio(subdominioDemo)
          if (existente) {
            await sitioRepo.update(existente.id, {
              configJson: datosJson as unknown as Record<string, unknown>,
            })
          } else {
            await sitioRepo.save(
              new Sitio(
                crypto.randomUUID(),
                CLIENTE_DEMO_ID,
                subdominioDemo,
                datosJson.template as Template,
                datosJson as unknown as Record<string, unknown>,
                true,
              ),
            )
          }
        }

        // Modo real: disparar la generación del sitio de forma async.
        if (!esDemo && cliente) {
          const { generarSitioUC } = await import('@/infrastructure/container')
          generarSitioUC.execute(sessionId, cliente.id).catch(console.error)
        }

        return NextResponse.json({
          respuesta,
          completada: true,
          esDemo,
          subdominioDemo,
        })
      }

      await sesionRepo.update(sessionId, { historial: sesion.historial })

      return NextResponse.json({ respuesta, completada: false, esDemo })
    } catch (error) {
      if (error instanceof ClaudeServiceError) {
        if (error.codigo === 'claude_extraction_failed') {
          // El historial (incluida la vuelta que recién se agregó, si la
          // hubo) se persiste igual — es lo que habilita el short-circuit de
          // reintento arriba en la próxima llamada, sin perder la conversación.
          await sesionRepo.update(sessionId, { historial: sesion.historial })
          return NextResponse.json({ error: 'extraccion_fallida' }, { status: 502 })
        }

        // claude_api_error: la vuelta fallida NO se persiste (agregarMensaje
        // no llegó a ejecutarse), la sesión queda como estaba y es
        // reintentable manualmente sin perder datos.
        return NextResponse.json({ error: 'claude_no_disponible' }, { status: 502 })
      }

      throw error
    }
  } catch (error) {
    console.error('[/api/chat]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
