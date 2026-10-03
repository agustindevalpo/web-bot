import Image from 'next/image'
import { estiloCascada } from './navegacion'
import { tramoDisplay, type TramoDisplay } from './displayHero'
import styles from './HeroBloques.module.css'

// Hero de Bloques compartido por LANDING y SERVICIOS. Server Component puro:
// cada plantilla decide los textos y enlaces de los botones; acá solo vive el
// markup, la cascada de entrada (`data-dv-anim`) y los tramos del display.
type Cta = { texto: string; href: string }

export type HeroBloquesProps = {
  eyebrow: string | null
  nombre: string
  descripcion: string | null
  foto: string | null
  ctaPrimario: Cta | null
  ctaSecundario: Cta | null
}

const CLASE_TRAMO: Record<TramoDisplay, string> = {
  grande: styles.tramoGrande,
  medio: styles.tramoMedio,
  chico: styles.tramoChico,
}

export default function HeroBloques({ eyebrow, nombre, descripcion, foto, ctaPrimario, ctaSecundario }: HeroBloquesProps) {
  const { tramo } = tramoDisplay(nombre)

  return (
    <section className={foto ? styles.inicio : `${styles.inicio} ${styles.inicioSinFoto}`}>
      <div className={styles.inicioIzquierda}>
        {eyebrow && (
          <div className={styles.eyebrowHero} data-dv-anim="up" style={estiloCascada(0)}>
            {eyebrow}
          </div>
        )}
        <h1 className={`${styles.inicioTitulo} ${CLASE_TRAMO[tramo]}`} data-dv-anim="up" style={estiloCascada(1)}>
          {nombre}
        </h1>
        {descripcion && (
          <p className={styles.inicioParrafo} data-dv-anim="up" style={estiloCascada(2)}>
            {descripcion}
          </p>
        )}
        <div className={styles.ctas} data-dv-anim="up" style={estiloCascada(3)}>
          {ctaPrimario && (
            <a href={ctaPrimario.href} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimaria}>
              {ctaPrimario.texto}
            </a>
          )}
          {ctaSecundario && (
            <a href={ctaSecundario.href} className={styles.ctaSecundaria}>
              {ctaSecundario.texto}
            </a>
          )}
        </div>
      </div>

      {foto && (
        <div className={styles.inicioFoto}>
          <Image src={foto} alt={nombre} fill sizes="(max-width: 767px) 100vw, 50vw" className={styles.fotoImg} priority />
        </div>
      )}
    </section>
  )
}
