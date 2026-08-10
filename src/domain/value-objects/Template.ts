export const Template = {
  LANDING: 'LANDING',
  SERVICIOS: 'SERVICIOS',
  PORTFOLIO: 'PORTFOLIO',
  RESTAURANTE: 'RESTAURANTE',
  TIENDA: 'TIENDA',
} as const

export type Template = (typeof Template)[keyof typeof Template]
