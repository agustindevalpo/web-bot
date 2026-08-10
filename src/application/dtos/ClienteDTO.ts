import { Plan } from '@/domain/value-objects/Plan'

export interface ClienteDTO {
  id: string
  email: string
  nombre: string
  telefono?: string
  plan: Plan
  activo: boolean
  fechaPago: Date | null
}
