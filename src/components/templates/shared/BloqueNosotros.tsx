import { estiloCascada } from './navegacion'
import { layoutNosotros, type NosotrosProps } from './nosotros'
import styles from './BloqueNosotros.module.css'

const CLASE_LAYOUT = {
  columna: styles.columna,
  fila: styles.fila,
  dos: styles.dos,
} as const

// Server Component. Bloque a sangre sobre `--acento` (ya clampeado a >= 4.5:1
// contra blanco por `buildPaletteStyle(..., { bloques: true })`): todo el texto
// es #FFF pleno, nunca con alfa (T2). No es opcional: siempre se renderiza.
export default function BloqueNosotros({ titulo, texto, tarjetas, frase, autor }: NosotrosProps) {
  const layout = layoutNosotros(tarjetas.length)
  const firma = autor ? (autor.cargo ? `${autor.nombre} · ${autor.cargo}` : autor.nombre) : null
  let paso = 0

  return (
    <section className={`${styles.bloque} ${CLASE_LAYOUT[layout]}`} data-bloque-nosotros={layout}>
      <div className={styles.texto}>
        <div className={styles.eyebrow} data-dv-anim="up" style={estiloCascada(paso++)}>
          Nosotros
        </div>
        <h2 className={styles.titulo} data-dv-anim="up" style={estiloCascada(paso++)}>
          {titulo}
        </h2>
        {texto && (
          <p className={styles.parrafo} data-dv-anim="up" style={estiloCascada(paso++)}>
            {texto}
          </p>
        )}
        {frase && (
          <figure className={styles.cita} data-dv-anim="up" style={estiloCascada(paso++)}>
            <blockquote className={styles.frase}>&ldquo;{frase}&rdquo;</blockquote>
            {firma && <figcaption className={styles.autor}>{firma}</figcaption>}
          </figure>
        )}
      </div>

      {tarjetas.length > 0 && (
        <div className={styles.tarjetas}>
          {tarjetas.map((tarjeta, indice) => (
            <div key={tarjeta.clave} className={styles.tarjeta} data-dv-anim="up" style={estiloCascada(paso + indice)}>
              <p className={styles.tarjetaTitulo}>{tarjeta.texto}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
