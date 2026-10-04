import Image from 'next/image'
import { estiloCascada } from '@/components/templates/shared/navegacion'
import type { DisposicionLugar, LugarProps } from './datosLugar'
import styles from './Lugar.module.css'

// `sizes` por disposición: [foto principal, resto]. Escritorio: ancho de la
// columna descontando el padding de 96px y el gap de 20px; móvil: ancho completo.
const SIZES: Record<DisposicionLugar, [string, string]> = {
  una: ['(min-width: 768px) calc(100vw - 192px), 100vw', '100vw'],
  dos: ['(min-width: 768px) calc((100vw - 212px) / 2), 100vw', '100vw'],
  tres: [
    '(min-width: 768px) calc((100vw - 212px) * 0.583), 100vw',
    '(min-width: 768px) calc((100vw - 212px) * 0.417), 100vw',
  ],
}

// "El lugar" (S2-3). Server Component puro. No es una sección del nav: la monta
// `servicios/index.tsx` dentro del fragmento de "Servicios".
export default function Lugar({ titulo, ciudad, disposicion, fotos }: LugarProps) {
  const [sizesPrincipal, sizesResto] = SIZES[disposicion]

  return (
    <section className={styles.seccion}>
      <div className={styles.encabezado} data-dv-anim="up" style={estiloCascada(0)}>
        <h2 className={styles.titulo}>{titulo}</h2>
        {ciudad && <span className={styles.ciudad}>{ciudad}</span>}
      </div>
      <div className={`${styles.galeria} ${styles[disposicion]}`}>
        {fotos.map((foto, indice) => (
          <div key={foto.src} className={styles.foto} data-dv-anim="up" style={estiloCascada(indice + 1)}>
            <Image
              src={foto.src}
              alt={foto.alt}
              fill
              sizes={indice === 0 ? sizesPrincipal : sizesResto}
              className={styles.img}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
