import { Prisma } from '@prisma/client'
import { Plan } from '@/domain/value-objects/Plan'
import { Cliente } from '@/domain/entities/Cliente'

// Mockea el módulo que expone la instancia de Prisma para poder simular,
// sin tocar la base real, la carrera P2002 que `findOrCreateByEmail`
// resuelve (ver verify-report obs #399, WARNING #1 — este archivo cierra
// esa cobertura). No hay precedente de testear un repositorio Prisma en
// este repo; `tests/unit/prisma/seedDemoTemplates.test.ts` es el único
// otro test bajo `tests/unit/prisma/` y evita Prisma por completo.
jest.mock('@/infrastructure/db', () => ({
  prisma: {
    cliente: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { prisma } from '@/infrastructure/db'
import { PrismaClienteRepository } from '@/infrastructure/db/repositories/PrismaClienteRepository'

const mockCreate = prisma.cliente.create as jest.Mock
const mockFindUnique = prisma.cliente.findUnique as jest.Mock

// Construye un error real de Prisma (no un objeto plano con `code`) para que
// `error instanceof Prisma.PrismaClientKnownRequestError` sea genuinamente
// verdadero — un objeto plano no pasaría el `instanceof` del catch real.
function crearErrorP2002(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`email`)', {
    code: 'P2002',
    clientVersion: '7.9.1',
  })
}

function crearErrorPrismaConocido(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(`Error simulado ${code}`, {
    code,
    clientVersion: '7.9.1',
  })
}

const CLIENTE_NUEVO = new Cliente('cli-1', 'ana@correo.cl', 'Ana', Plan.STARTER, false, null)

const RAW_CREADO = {
  id: 'cli-1',
  email: 'ana@correo.cl',
  nombre: 'Ana',
  plan: Plan.STARTER,
  activo: false,
  fechaPago: null,
  telefono: null,
}

const RAW_GANADOR = {
  id: 'cli-existente',
  email: 'ana@correo.cl',
  nombre: 'Ana Original',
  plan: Plan.STARTER,
  activo: false,
  fechaPago: null,
  telefono: null,
}

describe('PrismaClienteRepository.findOrCreateByEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('happy path: create tiene éxito y devuelve el Cliente creado sin leer de nuevo', async () => {
    mockCreate.mockResolvedValue(RAW_CREADO)
    const repo = new PrismaClienteRepository()

    const resultado = await repo.findOrCreateByEmail(CLIENTE_NUEVO)

    expect(resultado.id).toBe('cli-1')
    expect(resultado.email).toBe('ana@correo.cl')
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('carrera P2002: create choca por email único, relee por email y devuelve la fila ganadora', async () => {
    mockCreate.mockRejectedValue(crearErrorP2002())
    mockFindUnique.mockResolvedValue(RAW_GANADOR)
    const repo = new PrismaClienteRepository()

    const resultado = await repo.findOrCreateByEmail(CLIENTE_NUEVO)

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'ana@correo.cl' } })
    expect(resultado.id).toBe('cli-existente')
    expect(resultado.nombre).toBe('Ana Original')
  })

  it('P2002 pero la fila no existe al releer: relanza el error original en vez de tragárselo', async () => {
    const errorOriginal = crearErrorP2002()
    mockCreate.mockRejectedValue(errorOriginal)
    mockFindUnique.mockResolvedValue(null)
    const repo = new PrismaClienteRepository()

    await expect(repo.findOrCreateByEmail(CLIENTE_NUEVO)).rejects.toBe(errorOriginal)
  })

  it('error Prisma conocido pero no P2002: se relanza sin intentar releer', async () => {
    const errorNoP2002 = crearErrorPrismaConocido('P2025')
    mockCreate.mockRejectedValue(errorNoP2002)
    const repo = new PrismaClienteRepository()

    await expect(repo.findOrCreateByEmail(CLIENTE_NUEVO)).rejects.toBe(errorNoP2002)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('error genérico no-Prisma: se relanza sin intentar releer', async () => {
    const errorGenerico = new Error('conexión perdida')
    mockCreate.mockRejectedValue(errorGenerico)
    const repo = new PrismaClienteRepository()

    await expect(repo.findOrCreateByEmail(CLIENTE_NUEVO)).rejects.toBe(errorGenerico)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  // Prueba de mutación manual (documentada, no automatizada): invertir la
  // condición `error.code === 'P2002'` a `!==` en el archivo de producción
  // hace fallar el caso "carrera P2002" de este archivo (deja de llamar a
  // `findUnique` y en su lugar relanza), confirmando que el test realmente
  // ejercita esa rama y no pasa por una razón accidental.
})
