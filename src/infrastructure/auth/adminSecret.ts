import { timingSafeEqual } from 'crypto'

export function adminSecretConfigurado(): boolean {
  return Boolean(process.env.ADMIN_SECRET)
}

// Comparación en tiempo constante: timingSafeEqual exige buffers del mismo
// largo, así que la diferencia de largo se resuelve antes (eso solo filtra
// el largo de la contraseña, no su contenido).
export function validarAdminSecret(recibido: string): boolean {
  const esperado = process.env.ADMIN_SECRET
  if (!esperado || typeof recibido !== 'string' || recibido === '') return false

  const bufRecibido = Buffer.from(recibido, 'utf8')
  const bufEsperado = Buffer.from(esperado, 'utf8')
  if (bufRecibido.length !== bufEsperado.length) return false

  return timingSafeEqual(bufRecibido, bufEsperado)
}
