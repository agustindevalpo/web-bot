import { ResultadoConfirmarPago } from '@/application/use-cases/ConfirmarPagoSitio.usecase'

// Módulo puro, sin 'use server': un archivo con esa directiva solo puede
// exportar funciones async (son Server Actions), así que esta función
// síncrona vive aparte para poder importarla desde actions.ts y testearla
// sin depender del runtime de Server Actions.
export function etiquetaCliente(resultado: ResultadoConfirmarPago): string {
  if (resultado.modo === 'creado') return `Cliente creado: ${resultado.email}`
  if (resultado.modo === 'existente') return `Cliente vinculado: ${resultado.email}`
  return 'Cliente activado'
}
