export const EstadoPago = {
  PENDIENTE: 'PENDIENTE',
  CONFIRMADO: 'CONFIRMADO',
  FALLIDO: 'FALLIDO',
  REEMBOLSADO: 'REEMBOLSADO',
} as const

export type EstadoPago = (typeof EstadoPago)[keyof typeof EstadoPago]
