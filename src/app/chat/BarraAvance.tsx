import styles from './BarraAvance.module.css'
import { AVANCE_TECHO_ANTES_DEL_PAGO } from '@/application/shared/avanceSitio'

// Barra de avance de 8px con tres tramos (03-CHAT-Y-MOMENTO-2.md, (i)): lo
// logrado en violeta, lo que falta hasta el 80 % en lila y el último 20 %
// rayado en gris, porque solo se completa después del pago. Nunca dice 100 %.
export function BarraAvance({ avance }: { avance: number }) {
  const logrado = Math.min(Math.max(Math.round(avance), 0), AVANCE_TECHO_ANTES_DEL_PAGO)
  const faltante = AVANCE_TECHO_ANTES_DEL_PAGO - logrado
  const despuesDelPago = 100 - AVANCE_TECHO_ANTES_DEL_PAGO

  return (
    <div className={styles.contenedor}>
      <div
        className={styles.barra}
        role="progressbar"
        aria-label="Avance de tu sitio"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={logrado}
        aria-valuetext={`${logrado} %. El 20 % final se completa después del pago.`}
      >
        <span className={styles.logrado} style={{ width: `${logrado}%` }} />
        <span className={styles.faltante} style={{ width: `${faltante}%` }} />
        <span className={styles.despuesDelPago} style={{ width: `${despuesDelPago}%` }} />
      </div>
      <p className={styles.leyenda}>Logo y fotos: después del pago</p>
    </div>
  )
}
