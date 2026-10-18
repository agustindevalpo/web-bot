'use client'

// Único trozo interactivo de la FAQ. El primer ítem llega abierto ya desde el
// servidor y las respuestas están siempre en el DOM: sin JS el contenido se lee.
import { useId, useState } from 'react'
import styles from '../page.module.css'
import { alternarFaq, FAQ_ABIERTO_INICIAL } from './faqEstado'

interface FaqAcordeonProps {
  items: { q: string; a: string }[]
}

export function FaqAcordeon({ items }: FaqAcordeonProps) {
  const [abierto, setAbierto] = useState<number | null>(FAQ_ABIERTO_INICIAL)
  const base = useId()

  return (
    <div className={styles.faqLista}>
      {items.map((item, i) => {
        const activo = abierto === i
        const idBoton = `${base}-q${i}`
        const idPanel = `${base}-a${i}`
        return (
          <div key={item.q} className={styles.faqItem} data-abierto={activo}>
            <h3 className={styles.faqPregunta}>
              <button
                type="button"
                id={idBoton}
                className={styles.faqBoton}
                aria-expanded={activo}
                aria-controls={idPanel}
                onClick={() => setAbierto((actual) => alternarFaq(actual, i))}
              >
                {item.q}
                <span className={styles.faqIcono} aria-hidden="true">+</span>
              </button>
            </h3>
            <div id={idPanel} role="region" aria-labelledby={idBoton} className={styles.faqPanel}>
              <div className={styles.faqPanelInterior}>
                <p className={styles.faqRespuesta}>{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
