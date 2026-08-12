import { IEmailService } from '@/application/services/IEmailService'

/**
 * Único servicio de email hoy — no hay proveedor real contratado (Resend, etc.).
 * En dev/test loguea el link a consola para poder probar el flujo completo sin
 * cuenta de email. En producción, sin proveedor real configurado, lanza para
 * que la falla sea visible en vez de silenciosa (nadie recibiría el link).
 */
export class DevEmailService implements IEmailService {
  async enviarMagicLink(email: string, url: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DevEmailService] Magic link para ${email}: ${url}`)
      return
    }

    throw new Error('DevEmailService.enviarMagicLink no implementado — falta proveedor de email real (Resend)')
  }
}
