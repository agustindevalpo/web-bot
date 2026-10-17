import type { CSSProperties } from 'react'
import HeroBloques from '@/components/templates/shared/HeroBloques'
import { estiloCascada } from '@/components/templates/shared/navegacion'
import { tramoDisplay, type TramoDisplay } from '@/components/templates/shared/displayHero'
import heroStyles from '../shared/HeroBloques.module.css'
import type { AccionHero, DatoHero } from './sections'
import styles from './HeroRestaurante.module.css'

// Hero de RESTAURANTE (S4). Server Component puro. Elige entre dos formas:
// - Con foto (`foto` propia, P2): el hero de Bloques compartido.
// - Tipográfica (sin foto): ancho completo, nombre, párrafo y botones en una
//   fila, y bajo ella la fila de datos reales (Dónde, Reservas, La carta).
export type HeroRestauranteProps = {
  eyebrow: string | null
  nombre: string
  descripcion: string | null
  // Solo una foto propia; nunca de banco.
  foto: string | null
  datos: DatoHero[]
  primaria: AccionHero | null
  secundaria: AccionHero | null
}

const CLASE_TRAMO: Record<TramoDisplay, string> = {
  grande: heroStyles.tramoGrande,
  medio: heroStyles.tramoMedio,
  chico: heroStyles.tramoChico,
}

// 04-RESTAURANTE: foto de 680px en escritorio y 220px en móvil.
const ALTO_FOTO = { escritorio: 680, movil: 220 }

export default function HeroRestaurante({ eyebrow, nombre, descripcion, foto, datos, primaria, secundaria }: HeroRestauranteProps) {
  if (foto) {
    return (
      <HeroBloques
        eyebrow={eyebrow}
        nombre={nombre}
        descripcion={descripcion}
        foto={foto}
        ctaPrimario={primaria}
        ctaSecundario={secundaria}
        altoFoto={ALTO_FOTO}
      />
    )
  }

  const { tramo } = tramoDisplay(nombre)

  return (
    <section className={styles.seccion}>
      {eyebrow && (
        <div className={heroStyles.eyebrowHero} data-dv-anim="up" style={estiloCascada(0)}>
          {eyebrow}
        </div>
      )}
      <h1 className={`${heroStyles.inicioTitulo} ${CLASE_TRAMO[tramo]} ${styles.titulo}`} data-dv-anim="up" style={estiloCascada(1)}>
        {nombre}
      </h1>

      <div className={styles.fila} data-dv-anim="up" style={estiloCascada(2)}>
        {descripcion ? <p className={styles.parrafo}>{descripcion}</p> : <span />}
        {(primaria || secundaria) && (
          <div className={heroStyles.ctas}>
            {primaria && (
              <a
                href={primaria.href}
                {...(primaria.interno ? null : { target: '_blank', rel: 'noopener noreferrer' })}
                className={heroStyles.ctaPrimaria}
              >
                {primaria.texto}
              </a>
            )}
            {secundaria && (
              <a href={secundaria.href} className={heroStyles.ctaSecundaria}>
                {secundaria.texto}
              </a>
            )}
          </div>
        )}
      </div>

      {datos.length > 0 && (
        <dl
          className={styles.datos}
          style={{ '--columnas-datos': datos.length } as CSSProperties}
          data-dv-anim="up"
          data-datos-hero={datos.length}
        >
          {datos.map((dato) => (
            <div key={dato.rotulo} className={styles.celda}>
              <dt className={styles.rotulo}>{dato.rotulo}</dt>
              <dd className={styles.valor}>{dato.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
