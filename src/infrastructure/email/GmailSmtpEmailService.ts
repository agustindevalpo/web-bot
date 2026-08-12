import nodemailer, { type Transporter } from 'nodemailer'
import { IEmailService } from '@/application/services/IEmailService'

/**
 * Envío real vía Gmail Workspace (smtp.gmail.com), autenticado con una
 * "contraseña de aplicación" (requiere verificación en 2 pasos activada en
 * la cuenta remitente) — no la contraseña normal de la cuenta.
 * configuremos el archivo .env con GMAIL_USER y GMAIL_APP_PASSWORD
 */
export class GmailSmtpEmailService implements IEmailService {
  private transporter: Transporter
  private remitente: string

  constructor() {
    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASSWORD

    if (!user || !pass) {
      throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD no configuradas — ver .env.example')
    }

    this.remitente = user
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    })
  }

  async enviarMagicLink(email: string, url: string): Promise<void> {
    await this.transporter.sendMail({
      from: `WebBot <${this.remitente}>`,
      to: email,
      subject: 'Tu link de acceso a WebBot',
      html: `
        <p>Haz clic para entrar a tu cuenta y seguir armando tu sitio:</p>
        <p><a href="${url}">${url}</a></p>
        <p>Este link expira en 15 minutos y solo funciona una vez.</p>
      `,
    })
  }
}
