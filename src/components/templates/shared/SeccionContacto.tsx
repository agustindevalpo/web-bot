import type { ReactNode } from 'react'
import { estiloCascada } from './navegacion'
import styles from './Contacto.module.css'

export type SeccionContactoProps = {
  // Rótulo sobre el título; "Contacto" por defecto (RESTAURANTE: "Reservas").
  eyebrow?: string
  titulo: string
  parrafo?: string | null
  // `FormularioContacto` (o nada, si el sitio lo deshabilitó).
  formulario?: ReactNode
  // `ContactoDatos` (o null).
  datos?: ReactNode
}

// Armazón de la sección Contacto (Bloques): 140px 96px, 1fr 1fr, gap 96px.
// Server Component; el formulario es la única isla cliente. Si `datos` rinde
// null la columna derecha no existe (CSS `:not(:has(> .datos))`) y la
// izquierda ocupa todo el ancho.
export default function SeccionContacto({ eyebrow = 'Contacto', titulo, parrafo, formulario, datos }: SeccionContactoProps) {
  return (
    <section className={styles.seccion}>
      <div className={styles.izquierda}>
        <div className={styles.eyebrow} data-dv-anim="up" style={estiloCascada(0)}>
          {eyebrow}
        </div>
        <h2 className={styles.titulo} data-dv-anim="up" style={estiloCascada(1)}>
          {titulo}
        </h2>
        {parrafo && (
          <p className={styles.parrafo} data-dv-anim="up" style={estiloCascada(2)}>
            {parrafo}
          </p>
        )}
        {formulario && (
          <div className={styles.formularioCelda} data-dv-anim="up" style={estiloCascada(3)}>
            {formulario}
          </div>
        )}
      </div>
      {datos}
    </section>
  )
}
