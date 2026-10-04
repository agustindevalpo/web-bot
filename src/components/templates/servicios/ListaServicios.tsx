import type { CSSProperties } from 'react'
import { estiloCascada } from '@/components/templates/shared/navegacion'
import type { ListaServiciosProps } from './sections'
import styles from './ListaServicios.module.css'

// Lista de servicios con precio (S2, 02-SERVICIOS.md "Lista de servicios").
// Server Component puro. Reemplaza a las bandas de LANDING: el visitante compara
// precios en una sola mirada. Con un solo servicio la fila no lleva número
// (01-RESPUESTAS). La sección vive dentro del `div#servicios` de SeccionesSPA.
export default function ListaServicios({ eyebrow, titulo, hayDescripciones, columnas, filas }: ListaServiciosProps) {
  const claseLista = hayDescripciones ? styles.lista : `${styles.lista} ${styles.sinDescripciones}`

  return (
    <section className={styles.seccion}>
      <div className={styles.eyebrow} data-dv-anim="up" style={estiloCascada(0)}>
        {eyebrow}
      </div>
      <h2 className={styles.titulo} data-dv-anim="up" style={estiloCascada(1)}>
        {titulo}
      </h2>
      <ol className={claseLista} style={{ '--lista-columnas': columnas } as CSSProperties}>
        {filas.map((fila, indice) => (
          <li
            key={`${fila.nombre}-${indice}`}
            className={fila.numero ? styles.fila : `${styles.fila} ${styles.filaSinNumero}`}
            data-dv-anim="up"
            style={estiloCascada(Math.min(indice, 4))}
          >
            {fila.numero && <span className={styles.numero}>{fila.numero}</span>}
            <h3 className={styles.nombre}>{fila.nombre}</h3>
            {hayDescripciones && <p className={styles.descripcion}>{fila.descripcion}</p>}
            <div className={styles.precio}>
              {fila.precio ? (
                <>
                  <span className={styles.desde}>desde</span>
                  <span className={styles.monto}>{fila.precio}</span>
                </>
              ) : (
                fila.whatsappUrl && (
                  <a href={fila.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.agendar}>
                    Agendar →
                  </a>
                )
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
