import styles from './Monograma.module.css'

// Monograma "Sans pesado" (T4): la única variante. Cuadrado con `--acento`,
// iniciales blancas Montserrat 800. `tamano` elige el lado: "cabecera" 36px
// (26px bajo 768px) o "pie" 34px — ver el CSS module.
export type TamanoMonograma = 'cabecera' | 'pie'

export type MonogramaProps = {
  iniciales: string
  tamano?: TamanoMonograma
}

// Server Component puro, sin estado. Si `iniciales` llega vacía (ver
// `shared/iniciales.ts`) no pinta nada en vez de un cuadrado vacío.
export default function Monograma({ iniciales, tamano = 'cabecera' }: MonogramaProps) {
  if (!iniciales) return null

  return <span className={`${styles.monograma} ${styles[tamano]}`}>{iniciales}</span>
}
