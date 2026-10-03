import type { CSSProperties } from 'react'
import Image from 'next/image'
import Monograma from '@/components/templates/shared/Monograma'
import { construirPie, ANCHO_MAX_LOGO_PIE_SIN_DIMENSIONES } from '@/components/templates/shared/pieBloques'
import type { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import styles from './FooterBloques.module.css'

// Pie compartido de Bloques (T3, T4, T7). Server Component puro. `secciones`
// es la misma lista que la plantilla le pasa al nav, para que coincidan. El
// año llega del servidor (`anio`) para que la prueba pueda fijarlo.
export type FooterBloquesProps = {
  config: SiteConfigDTO
  secciones: { id: string; etiqueta: string }[]
  anio: number
}

export default function FooterBloques({ config, secciones, anio }: FooterBloquesProps) {
  const pie = construirPie(config, anio)
  const estiloLogo = {
    '--logo-alto': `${pie.altosLogo.escritorio}px`,
    '--logo-alto-movil': `${pie.altosLogo.movil}px`,
  } as CSSProperties

  return (
    <footer className={styles.pie}>
      <div className={styles.grilla}>
        <div className={styles.marca}>
          <div className={styles.marcaFila}>
            {pie.logo ? (
              <span className={styles.placa}>
                <Image
                  src={pie.logo.src}
                  alt={pie.nombre}
                  width={pie.logo.ancho}
                  height={pie.logo.alto}
                  sizes="180px"
                  className={styles.logo}
                  style={{
                    ...estiloLogo,
                    ...(pie.logo.conDimensiones ? null : { maxWidth: `${ANCHO_MAX_LOGO_PIE_SIN_DIMENSIONES}px` }),
                  }}
                />
              </span>
            ) : (
              <Monograma iniciales={pie.iniciales} tamano="pie" />
            )}
            {pie.mostrarNombre && <span className={styles.nombre}>{pie.nombre}</span>}
          </div>
          {pie.glosa && <p className={styles.glosa}>{pie.glosa}</p>}
        </div>

        {secciones.length > 0 && (
          <nav className={styles.columna} aria-label="Secciones">
            <div className={styles.titulo}>Secciones</div>
            <ul className={styles.lista}>
              {secciones.map((seccion) => (
                <li key={seccion.id}>
                  <a href={`#${seccion.id}`} className={styles.enlace}>
                    {seccion.etiqueta}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {pie.contacto.length > 0 && (
          <div className={styles.columna}>
            <div className={styles.titulo}>Contacto</div>
            <ul className={styles.lista}>
              {pie.contacto.map((enlace) => (
                <li key={enlace.href}>
                  <a
                    href={enlace.href}
                    className={styles.enlace}
                    {...(enlace.externo ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
                  >
                    {enlace.texto}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.legal}>
        <span>{pie.legal}</span>
        <span>Hecho con WebBot · Devalpo</span>
      </div>
    </footer>
  )
}
