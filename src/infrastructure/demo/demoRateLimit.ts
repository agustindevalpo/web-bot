// Limitador en memoria — por-proceso, igual limitación que
// src/infrastructure/auth/rateLimit.ts (se resetea si Railway reinicia la
// instancia, no comparte estado entre instancias). Aceptable para el
// deploy actual de una sola instancia.
const demoContadores = new Map<string, { count: number; resetAt: number }>()

const LIMITE_DEMOS_POR_IP = 2
const VENTANA_MS = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Cuenta demos *iniciados* (una llamada por conversación nueva, no por
 * mensaje) — se llama una sola vez, al crear la Sesion, no en cada
 * intercambio del chat. Ver src/app/api/chat/route.ts.
 */
export function verificarLimiteDemoIP(ip: string): {
  permitido: boolean
  restantes: number
} {
  const ahora = Date.now()
  const entrada = demoContadores.get(ip)

  if (!entrada || ahora > entrada.resetAt) {
    demoContadores.set(ip, { count: 1, resetAt: ahora + VENTANA_MS })
    return { permitido: true, restantes: LIMITE_DEMOS_POR_IP - 1 }
  }

  if (entrada.count >= LIMITE_DEMOS_POR_IP) {
    return { permitido: false, restantes: 0 }
  }

  entrada.count++
  return { permitido: true, restantes: LIMITE_DEMOS_POR_IP - entrada.count }
}
