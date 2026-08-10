export const Plan = {
  STARTER: 'STARTER',
  PRO: 'PRO',
  AGENCIA: 'AGENCIA',
} as const

export type Plan = (typeof Plan)[keyof typeof Plan]
