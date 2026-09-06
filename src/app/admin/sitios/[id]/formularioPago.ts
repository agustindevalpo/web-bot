const REFERENCIA_PAGO_MAX = 100

export interface CamposFormularioPago {
  monto?: string | null
  referencia?: string | null
  nombre?: string | null
  email?: string | null
}

export interface FormularioPagoValido {
  ok: true
  monto: number
  referencia: string | undefined
  nombre: string | undefined
  email: string | undefined
}

export interface FormularioPagoInvalido {
  ok: false
  error: string
}

export type ResultadoFormularioPago = FormularioPagoValido | FormularioPagoInvalido

// Módulo puro, sin 'use server': ver etiquetaCliente.ts — un archivo con esa
// directiva solo puede exportar funciones async (son Server Actions), así
// que esta validación síncrona vive aparte para poder testearla sin el
// runtime de Server Actions.
export function parsearFormularioPago(campos: CamposFormularioPago): ResultadoFormularioPago {
  const montoCrudo = campos.monto
  const referenciaCruda = campos.referencia
  const nombreCrudo = campos.nombre
  const emailCrudo = campos.email

  const monto = typeof montoCrudo === 'string' && /^\d+$/.test(montoCrudo.trim()) ? Number(montoCrudo.trim()) : NaN
  const referencia = typeof referenciaCruda === 'string' ? referenciaCruda.trim() : ''
  const nombre = typeof nombreCrudo === 'string' ? nombreCrudo : undefined
  const email = typeof emailCrudo === 'string' ? emailCrudo : undefined

  if (!Number.isSafeInteger(monto) || monto <= 0) {
    return { ok: false, error: 'El monto debe ser un número entero de pesos mayor que cero.' }
  }
  if (referencia.length > REFERENCIA_PAGO_MAX) {
    return { ok: false, error: `La referencia no puede superar los ${REFERENCIA_PAGO_MAX} caracteres.` }
  }

  return { ok: true, monto, referencia: referencia || undefined, nombre, email }
}

// Sitios demo pertenecen al cliente compartido: todavía no tienen comprador
// real, así que el formulario de pago siempre pide nombre/email (R5, R8, R10).
export function esSitioDemo(clienteId: string, clienteDemoId: string): boolean {
  return clienteId === clienteDemoId
}
