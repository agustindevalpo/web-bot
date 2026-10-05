// Validación de los datos legales del cliente (razón social y RUT) que el
// footer de las plantillas muestra como `© {año} {razonSocial} · RUT {rut}`.
// Funciones puras: las usa el use case del admin, nunca el cliente.

export const RAZON_SOCIAL_MAX = 120

export type ResultadoCampo = { ok: true; valor: string } | { ok: false; error: string }

// Módulo 11 con pesos 2..7 cíclicos, de derecha a izquierda.
function digitoVerificador(cuerpo: string): string {
  let suma = 0
  let peso = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * peso
    peso = peso === 7 ? 2 : peso + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

// Acepta con o sin puntos, guion y espacios ("77119936-4", "77.119.936-4").
// Devuelve el RUT en el formato que muestran las plantillas: "77.119.936-4".
export function normalizarRut(crudo: string): ResultadoCampo {
  const limpio = crudo.replace(/[.\s-]/g, '').toUpperCase()
  const mensaje = 'El RUT no es válido. Revisa el número y el dígito verificador (por ejemplo 77.119.936-4).'

  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return { ok: false, error: mensaje }

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  if (digitoVerificador(cuerpo) !== dv) return { ok: false, error: mensaje }

  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+$)/g, '.')
  return { ok: true, valor: `${conPuntos}-${dv}` }
}

export function normalizarRazonSocial(crudo: string): ResultadoCampo {
  const valor = crudo.trim().replace(/\s+/g, ' ')
  if (valor === '') return { ok: false, error: 'La razón social no puede estar vacía.' }
  if (valor.length > RAZON_SOCIAL_MAX) {
    return { ok: false, error: `La razón social no puede superar los ${RAZON_SOCIAL_MAX} caracteres.` }
  }
  return { ok: true, valor }
}
