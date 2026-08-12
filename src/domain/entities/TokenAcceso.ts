import { createHash, randomUUID } from 'crypto'

export class TokenAcceso {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly tokenHash: string,
    public readonly expiraEn: Date,
    public usadoEn: Date | null = null,
    public readonly fechaCreacion: Date = new Date(),
  ) {}

  estaExpirado(): boolean {
    return new Date() > this.expiraEn
  }

  estaUsado(): boolean {
    return this.usadoEn !== null
  }

  esValido(): boolean {
    return !this.estaExpirado() && !this.estaUsado()
  }

  marcarUsado(): void {
    this.usadoEn = new Date()
  }

  static hash(tokenPlano: string): string {
    return createHash('sha256').update(tokenPlano).digest('hex')
  }

  static crear(email: string, tokenPlano: string, ttlMinutos = 15): TokenAcceso {
    const expiraEn = new Date(Date.now() + ttlMinutos * 60_000)
    return new TokenAcceso(randomUUID(), email, TokenAcceso.hash(tokenPlano), expiraEn)
  }
}
