import { ITokenAccesoRepository } from '@/domain/repositories/ITokenAccesoRepository'
import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { TokenAcceso } from '@/domain/entities/TokenAcceso'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'
import { TokenAccesoInvalidoException } from '@/domain/exceptions/TokenAccesoInvalidoException'

export class VerificarAccesoUseCase {
  constructor(
    private tokenAccesoRepo: ITokenAccesoRepository,
    private clienteRepo: IClienteRepository,
  ) {}

  async execute(tokenPlano: string): Promise<{ clienteId: string; email: string }> {
    const tokenHash = TokenAcceso.hash(tokenPlano)
    const token = await this.tokenAccesoRepo.findByTokenHash(tokenHash)

    if (!token || !token.esValido()) {
      throw new TokenAccesoInvalidoException()
    }

    await this.tokenAccesoRepo.update(token.id, { usadoEn: new Date() })

    let cliente = await this.clienteRepo.findByEmail(token.email)
    if (!cliente) {
      // Cliente.nombre es obligatorio pero el login solo pide email — se usa
      // la parte local del email como placeholder, no hay flujo de perfil todavía.
      cliente = Cliente.crear(token.email, token.email.split('@')[0], Plan.STARTER)
      cliente = await this.clienteRepo.save(cliente)
    }

    return { clienteId: cliente.id, email: cliente.email }
  }
}
