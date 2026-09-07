// Normalización y validación de email compartida entre casos de uso. No
// depende de infraestructura ni de excepciones específicas de un dominio:
// cada caller decide qué excepción lanzar ante un email inválido.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Normaliza un email crudo (trim + minúsculas) y valida su formato.
 * Lanza `Error` genérico si el formato es inválido; los callers que
 * necesiten una excepción de dominio propia deben capturar y relanzar.
 */
export function normalizarEmail(email: string): string {
  const normalizado = email.trim().toLowerCase()
  if (!EMAIL_REGEX.test(normalizado)) {
    throw new Error('Email inválido.')
  }
  return normalizado
}
