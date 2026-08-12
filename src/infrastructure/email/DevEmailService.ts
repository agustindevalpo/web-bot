import { IEmailService } from '@/application/services/IEmailService'

/**
 * Fallback cuando no hay credenciales de Gmail configuradas (ver
 * GmailSmtpEmailService, el envío real). Loguea el link a consola para poder
 * probar el flujo completo en local sin mandar emails de verdad. En
 * producción, sin proveedor real configurado, lanza para que la falla sea
 * visible en vez de silenciosa (nadie recibiría el link).
 */
export class DevEmailService implements IEmailService {
  async enviarMagicLink(email: string, url: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DevEmailService] Magic link para ${email}: ${url}`)
      return
    }

    throw new Error('DevEmailService.enviarMagicLink no implementado — falta configurar GMAIL_USER / GMAIL_APP_PASSWORD')
  }
}
