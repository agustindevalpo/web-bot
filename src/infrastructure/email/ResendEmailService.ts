import { IEmailService } from '@/application/services/IEmailService'

/**
 * Envío real vía Resend (https://resend.com) — API HTTP sobre 443, no un
 * socket SMTP crudo. Se eligió sobre Gmail SMTP porque el egress de Railway
 * bloquea las conexiones salientes a smtp.gmail.com tanto en el puerto 465
 * como en el 587 (ver docs/BITACORA.md) — HTTPS no tiene ese problema.
 * Requiere RESEND_API_KEY y que RESEND_FROM_EMAIL sea de un dominio
 * verificado en el dashboard de Resend (si no, cae al remitente de pruebas
 * onboarding@resend.dev, que solo entrega a la cuenta dueña del API key).
 */
export class ResendEmailService implements IEmailService {
  private apiKey: string
  private remitente: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no configurada — ver .env.example')
    }
    this.apiKey = apiKey
    this.remitente = process.env.RESEND_FROM_EMAIL || 'WebBot <onboarding@resend.dev>'
  }

  async enviarMagicLink(email: string, url: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.remitente,
        to: email,
        subject: 'Tu link de acceso a WebBot',
        html: `
          <p>Haz clic para entrar a tu cuenta y seguir armando tu sitio:</p>
          <p><a href="${url}">${url}</a></p>
          <p>Este link expira en 15 minutos y solo funciona una vez.</p>
        `,
      }),
    })

    if (!response.ok) {
      const detalle = await response.text()
      throw new Error(`Resend respondió ${response.status} al enviar el magic link: ${detalle}`)
    }
  }
}
