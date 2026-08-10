export const Estilo = {
  MODERNO: 'moderno',
  CALIDO: 'calido',
  COLORIDO: 'colorido',
} as const

export type Estilo = (typeof Estilo)[keyof typeof Estilo]
