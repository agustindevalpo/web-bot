// Limitador en memoria — por-proceso, misma limitación que
// src/infrastructure/demo/demoRateLimit.ts (se resetea si Railway reinicia
// la instancia, no comparte estado entre instancias). Separado del límite de
// demos: este cuenta mensajes de clientes activados/pagados hacia Claude, no
// demos gratuitos por IP.
const claudeContadores = new Map<string, { count: number; resetAt: number }>()

const LIMITE = 20
const VENTANA_MS = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Se llama una vez por cada vuelta que efectivamente llega a Claude (no por
 * cada intento) — ver src/app/api/chat/route.ts.
 */
export function verificarLimiteClaude(clienteId: string): {
  permitido: boolean
  restantes: number
  resetAt: number
} {
  const ahora = Date.now()
  const entrada = claudeContadores.get(clienteId)

  if (!entrada || ahora > entrada.resetAt) {
    const resetAt = ahora + VENTANA_MS
    claudeContadores.set(clienteId, { count: 1, resetAt })
    return { permitido: true, restantes: LIMITE - 1, resetAt }
  }

  if (entrada.count >= LIMITE) {
    return { permitido: false, restantes: 0, resetAt: entrada.resetAt }
  }

  entrada.count++
  return { permitido: true, restantes: LIMITE - entrada.count, resetAt: entrada.resetAt }
}
