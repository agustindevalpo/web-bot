export interface IEmailService {
  enviarMagicLink(email: string, url: string): Promise<void>
}
