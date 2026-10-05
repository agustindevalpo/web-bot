import type { Metadata } from 'next'
import Link from 'next/link'
import { enlaceWhatsAppDevalpo } from '../chat/contactoDevalpo'
import styles from './gracias.module.css'

export const metadata: Metadata = {
  title: 'Gracias · WebBot',
  robots: { index: false },
}

const MENSAJE_WHATSAPP_GRACIAS = 'Hola, acabo de pagar mi sitio de WebBot. Les mando mi logo y mis fotos.'

const ITEMS = [
  {
    titulo: 'Tu logo',
    detalle: 'PNG, JPG o WebP, de hasta 5 MB. Si no tienes, usamos tus iniciales.',
  },
  {
    titulo: 'Una foto de tu local o de tu equipo',
    detalle: 'Es la que va arriba en tu sitio.',
  },
  {
    titulo: 'Más fotos, si tienes',
    detalle: 'Del lugar o de cada servicio. Son opcionales.',
  },
]

// G1: página de servidor estática a la que vuelve Mercado Pago tras el pago.
// No recibe `searchParams` a propósito: Mercado Pago agrega collection_id,
// status, payment_id, etc., y la página debe verse igual y no repetirlos.
// El pago lo confirma Devalpo a mano, así que aquí no se afirma nada más.
export default function GraciasPage() {
  const hrefWhatsApp = enlaceWhatsAppDevalpo(MENSAJE_WHATSAPP_GRACIAS)

  return (
    <div className={styles.pagina}>
      <header className={styles.header}>
        <Link href="/chat" className={styles.marca}>
          WebBot
        </Link>
      </header>
      <main className={styles.contenido}>
        <p className={styles.rotulo}>Gracias</p>
        <h1 className={styles.titulo}>Ahora revisamos tu pago</h1>
        <p className={styles.texto}>
          Lo confirmamos a mano y te escribimos por WhatsApp en menos de un día hábil para
          publicar tu sitio.
        </p>
        <h2 className={styles.encabezadoLista}>Para publicarlo, ten a mano:</h2>
        <ol className={styles.lista}>
          {ITEMS.map((item, i) => (
            <li key={item.titulo} className={styles.item}>
              <span className={styles.numero} aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <strong className={styles.itemTitulo}>{item.titulo}</strong>
                <span className={styles.itemDetalle}>{item.detalle}</span>
              </span>
            </li>
          ))}
        </ol>
      </main>
      <footer className={styles.barra}>
        {hrefWhatsApp && (
          <a
            href={hrefWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.boton}
          >
            Mandar logo y fotos por WhatsApp
          </a>
        )}
        <p className={styles.pie}>Si ya nos escribiste, no necesitas hacer nada más.</p>
      </footer>
    </div>
  )
}
