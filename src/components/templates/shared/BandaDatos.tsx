import { estiloCascada } from './navegacion'
import { layoutBanda } from './layoutBanda'
import styles from './BandaDatos.module.css'

export type ItemBanda = { valor: string; etiqueta: string }

export type BandaDatosProps = {
  items: ItemBanda[]
  // Rótulo inicial opcional (SERVICIOS: "Horarios"). Va antes del primer ítem.
  rotulo?: string
  // `cifras` (LANDING, 76px de padding, valor 56px) o `horarios` (SERVICIOS,
  // 72px, valor 44px, y en móvil fila con la glosa a la izquierda y el valor a
  // la derecha). PROFESIONAL reusa `cifras` con sus credenciales.
  variante?: 'cifras' | 'horarios'
}

// Server Component. Banda a sangre sobre `--ink`: no es una sección del nav
// (sin ancla), vive dentro de la sección que la contiene. Sin ítems utilizables
// no renderiza nada (el hero pasa directo a servicios).
export default function BandaDatos({ items, rotulo, variante = 'cifras' }: BandaDatosProps) {
  const layout = layoutBanda(items.length)
  if (!layout) return null

  const claseVariante = variante === 'horarios' ? styles.horarios : styles.cifras

  return (
    <section className={`${styles.banda} ${claseVariante}`} data-banda-datos={layout}>
      <div className={`${styles.fila} ${styles[layout]}`}>
        {rotulo && <div className={styles.rotulo}>{rotulo}</div>}
        {items.map((item, indice) => (
          <div key={`${item.valor}-${indice}`} className={styles.item} data-dv-anim="up" style={estiloCascada(indice)}>
            <div className={styles.valor}>{item.valor}</div>
            <p className={styles.etiqueta}>{item.etiqueta}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
