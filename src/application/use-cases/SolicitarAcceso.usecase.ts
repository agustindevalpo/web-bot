import { randomBytes } from 'crypto'
import { ITokenAccesoRepository } from '@/domain/repositories/ITokenAccesoRepository'
import { IEmailService } from '@/application/services/IEmailService'
import { TokenAcceso } from '@/domain/entities/TokenAcceso'

export class SolicitarAccesoUseCase {
  constructor(
    private tokenAccesoRepo: ITokenAccesoRepository,
    private emailService: IEmailService,
    private appUrl: string,
  ) {}

  async execute(emailCrudo: string): Promise<void> {
    const email = emailCrudo.trim().toLowerCase()
    const tokenPlano = randomBytes(32).toString('hex')
    const token = TokenAcceso.crear(email, tokenPlano)

    await this.tokenAccesoRepo.save(token)

    const url = `${this.appUrl}/api/auth/verificar?token=${tokenPlano}`
    await this.emailService.enviarMagicLink(email, url)
  }
}
