'use client'

// Poster + demo interactiva del hero (WB-42) — ver design D6/D7. El servidor
// (page.tsx) calcula `url` con construirUrlPreview y pasa los props de
// poster; este componente no hace fetch propio, solo alterna entre el poster
// y el iframe. El iframe queda ausente del HTML inicial: no se monta hasta
// que la persona hace clic.

import { useState } from 'react'
import Image from 'next/image'
import styles from '../page.module.css'

export interface HeroDemoProps {
  url: string
  poster: string
  posterAncho: number
  posterAlto: number
  titulo: string
}

export function HeroDemo({ url, poster, posterAncho, posterAlto, titulo }: HeroDemoProps) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className={styles.heroTelefonoContenedor}>
      <div className={styles.heroTelefono}>
        <div className={styles.heroPantalla}>
          {abierto ? (
            <iframe
              src={url}
              title={titulo}
              className={styles.heroIframe}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <button
              type="button"
              className={styles.heroPosterBoton}
              onClick={() => setAbierto(true)}
            >
              <Image
                src={poster}
                alt={titulo}
                width={posterAncho}
                height={posterAlto}
                priority
                className={styles.heroPoster}
              />
              <span className={styles.heroPosterOverlay}>Ver el sitio funcionando</span>
            </button>
          )}
        </div>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.heroVerEnVivo}>
        Ver en vivo →
      </a>
    </div>
  )
}
