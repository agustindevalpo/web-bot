import styles from './DemoCTA.module.css'
import { estadoPromo, formatCLP, PRECIO_PROMO, PRECIO_SITIO } from '@/app/_landing/precios'
import { resolverEnlacePago } from './hrefPago'

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''
const ES_LOCAL = APP_URL.includes('localhost')
// Link de pago único de Mercado Pago (WB-43). Debe ser NEXT_PUBLIC_* porque este
// componente se renderiza en el cliente (lo importa ChatWidget, 'use client').
// Sin la variable, el CTA cae a /login.
const ENLACE_PAGO = resolverEnlacePago(process.env.NEXT_PUBLIC_MERCADOPAGO_LINK_URL)

export function DemoCTA({ subdominioDemo }: { subdominioDemo: string }) {
  // En local, sitios.devalpo.cl sirve lo que esté deployado en producción,
  // no esta rama — apuntar ahí en dev muestra código viejo, no el que se
  // está probando. Solo se usa el subdominio real fuera de localhost.
  const urlDemo = ES_LOCAL ? `${APP_URL}/sites/${subdominioDemo}` : `https://${subdominioDemo}.${BASE_DOMAIN}`
  const promo = estadoPromo()

  return (
    <div className={styles.contenedor}>
      <div className={styles.preview}>
        <p className={styles.previewLabel}>📱 Así se vería tu sitio</p>
        <a href={urlDemo} target="_blank" rel="noopener noreferrer" className={styles.previewLink}>
          <iframe src={urlDemo} title="Vista previa de tu sitio" className={styles.iframe} />
        </a>
        <a href={urlDemo} target="_blank" rel="noopener noreferrer" className={styles.verCompleto}>
          Ver sitio completo →
        </a>
      </div>

      <div className={styles.caja}>
        <h3 className={styles.titulo}>Tu sitio propio, listo en 1 día</h3>
        <p className={styles.texto}>
          Este fue un ejemplo. Armamos tu sitio real con los datos de <strong>tu negocio</strong>, con tu propio
          dominio y un pago único, sin mensualidades.
        </p>

        <div className={styles.precio}>
          {promo.agotada ? (
            <>
              <span className={styles.precioActual}>{formatCLP(PRECIO_SITIO)}</span>
              <span className={styles.precioNota}>Cupos de lanzamiento agotados</span>
            </>
          ) : (
            <>
              <span className={styles.precioActual}>{formatCLP(PRECIO_PROMO)}</span>
              <span className={styles.precioTachado}>{formatCLP(PRECIO_SITIO)}</span>
              <span className={styles.precioNota}>Precio de lanzamiento · quedan {promo.restantes} cupos</span>
            </>
          )}
          <span className={styles.precioDetalle}>Pago único</span>
        </div>

        <a
          href={ENLACE_PAGO.href}
          className={styles.boton}
          {...(ENLACE_PAGO.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          Quiero mi sitio real →
        </a>

        <p className={styles.disclaimer}>
          {ENLACE_PAGO.externo && (
            <>Pago único por Mercado Pago. Después del pago te contactamos para activar tu sitio en 1 día. </>
          )}
          Sin contratos ni permanencia mínima.
        </p>
      </div>
    </div>
  )
}
