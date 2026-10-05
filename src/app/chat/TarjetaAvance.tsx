import Link from 'next/link'
import styles from './DemoCTA.module.css'
import { BarraAvance } from './BarraAvance'
import { AVANCE_TECHO_ANTES_DEL_PAGO } from '@/application/shared/avanceSitio'

export const HREF_COMPLETAR = '/chat/completar'

// Invitación por plantilla (microcopy del reveal). RESTAURANTE, PORTFOLIO y
// TIENDA usan la de LANDING hasta que lleguen sus capítulos.
const INVITACION_SERVICIOS =
  'Con dos minutos más, tu sitio muestra precios, horarios y quién atiende. Todo es opcional.'
const INVITACION_LANDING =
  'Con dos minutos más, tu sitio describe tus servicios y cuenta quién está detrás. Todo es opcional.'

export function invitacionDePlantilla(template: string | null): string {
  return template === 'SERVICIOS' ? INVITACION_SERVICIOS : INVITACION_LANDING
}

// Tarjeta de avance del reveal (R2, R3). Al techo de 80 % se compacta: título,
// barra, la frase de logro y "Editar respuestas". El botón es de tinta y no
// violeta para no competir con el de pago.
export function TarjetaAvance({ avance, template }: { avance: number; template: string | null }) {
  const completo = avance >= AVANCE_TECHO_ANTES_DEL_PAGO

  return (
    <section className={styles.tarjetaAvance} aria-labelledby="avance-titulo">
      <h2 id="avance-titulo" className={styles.avanceTitulo}>
        Tu sitio está al {avance} %
      </h2>
      <BarraAvance avance={avance} />
      {completo ? (
        <>
          <p className={styles.avanceTexto}>Completaste todo lo que se puede antes del pago.</p>
          <Link href={HREF_COMPLETAR} className={styles.enlaceEditar}>
            Editar respuestas
          </Link>
        </>
      ) : (
        <>
          <p className={styles.avanceTexto}>{invitacionDePlantilla(template)}</p>
          <Link href={HREF_COMPLETAR} className={styles.botonTinta}>
            Completar mi sitio
          </Link>
        </>
      )}
    </section>
  )
}
