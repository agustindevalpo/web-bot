import styles from './DemoCTA.module.css'

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''
const ES_LOCAL = APP_URL.includes('localhost')

interface Plan {
  nombre: string
  precio: string
  detalle: string
  destacado?: boolean
}

const PLANES: Plan[] = [
  { nombre: 'Presencia', precio: '$29.990/mes', detalle: 'Hasta 6 páginas' },
  { nombre: 'Presencia Pro', precio: '$49.990/mes', detalle: 'Dominio gestionado + SEO', destacado: true },
  { nombre: 'Agencia', precio: '$149.990/mes', detalle: 'Hasta 10 sitios' },
  { nombre: 'Landing única', precio: '$249.000', detalle: 'Pago único' },
]

export function DemoCTA({ subdominioDemo }: { subdominioDemo: string }) {
  // En local, sitios.devalpo.cl sirve lo que esté deployado en producción,
  // no esta rama — apuntar ahí en dev muestra código viejo, no el que se
  // está probando. Solo se usa el subdominio real fuera de localhost.
  const urlDemo = ES_LOCAL ? `${APP_URL}/sites/${subdominioDemo}` : `https://${subdominioDemo}.${BASE_DOMAIN}`

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
        <h3 className={styles.titulo}>Tu sitio propio, listo en minutos</h3>
        <p className={styles.texto}>
          Este fue un ejemplo. Con tu plan WebBot generamos un sitio personalizado con el
          nombre, servicios y estilo de <strong>tu negocio</strong>, con tu propio dominio y
          soporte en español.
        </p>

        <div className={styles.planes}>
          {PLANES.map((plan) => (
            <div key={plan.nombre} className={`${styles.plan} ${plan.destacado ? styles.planDestacado : ''}`}>
              {plan.destacado && <span className={styles.planBadge}>⭐ Popular</span>}
              <span className={styles.planNombre}>{plan.nombre}</span>
              <span className={styles.planPrecio}>{plan.precio}</span>
              <span className={styles.planDetalle}>{plan.detalle}</span>
            </div>
          ))}
        </div>

        <a href="/login" className={styles.boton}>
          Activar mi plan y crear mi sitio real →
        </a>

        <p className={styles.disclaimer}>
          Pagas solo cuando ves tu sitio terminado y estás conforme. Sin contratos ni
          permanencia mínima.
        </p>
      </div>
    </div>
  )
}
