export const Proveedor = {
  FLOW: 'FLOW',
  MERCADOPAGO: 'MERCADOPAGO',
  PAYPAL: 'PAYPAL',
  TRANSFERENCIA: 'TRANSFERENCIA',
} as const

export type Proveedor = (typeof Proveedor)[keyof typeof Proveedor]
