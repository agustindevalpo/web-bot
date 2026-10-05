import Link from 'next/link'
import styles from './completar.module.css'
import { buildWhatsAppUrl } from '@/components/templates/shared/enlaces'
import { WHATSAPP_DEVALPO } from '../contactoDevalpo'

export type MotivoEstado = 'cerrado' | 'sesion_vencida'

const TEXTOS: Record<MotivoEstado, { titulo: string; texto: string; boton: string }> = {
  cerrado: {
    titulo: 'Tu sitio ya está en preparación',
    texto: 'Para cambiar algo, escríbenos por WhatsApp y lo hacemos por ti.',
    boton: 'Escribir por WhatsApp',
  },
  sesion_vencida: {
    titulo: 'No encontramos tu sitio de prueba',
    texto: 'Puede que haya pasado mucho tiempo desde que lo armaste. Escríbenos y lo recuperamos.',
    boton: 'Escribir por WhatsApp',
  },
}

// Las dos pantallas sin tarea (E2): el momento 2 cerrado porque Devalpo ya
// confirmó el pago, y la sesión vencida o inexistente. Las dos salen por
// WhatsApp; el mensaje queda vacío porque la spec no escribe uno.
export function EstadoMomento2({ motivo }: { motivo: MotivoEstado }) {
  const { titulo, texto, boton } = TEXTOS[motivo]

  return (
    <div className={styles.pagina}>
      <header className={styles.header}>
        <Link href="/chat" className={styles.marca}>
          WebBot
        </Link>
      </header>
      <main className={styles.estado}>
        <h1 className={styles.titulo}>{titulo}</h1>
        <p className={styles.estadoTexto}>{texto}</p>
        <a
          href={buildWhatsAppUrl(WHATSAPP_DEVALPO)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.botonPrimario}
        >
          {boton}
        </a>
      </main>
    </div>
  )
}
