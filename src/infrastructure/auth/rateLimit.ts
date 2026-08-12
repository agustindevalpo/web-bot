// Limitador en memoria — por-proceso, se resetea si Railway reinicia la
// instancia y no comparte estado entre instancias si algún día hay más de
// una. Aceptable para el deploy actual de una sola instancia.
const intentos = new Map<string, number[]>()

export function excedeLimite(clave: string, maxIntentos: number, ventanaMs: number): boolean {
  const ahora = Date.now()
  const historial = (intentos.get(clave) ?? []).filter((t) => ahora - t < ventanaMs)
  historial.push(ahora)
  intentos.set(clave, historial)
  return historial.length > maxIntentos
}
