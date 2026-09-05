import { FooterProps } from '@/components/templates/shared/types'
import styles from './Footer.module.css'

// Footer compartido (D3, regla de tres): el JSX era idéntico byte a byte en
// landing/servicios/restaurante/tienda (verificado con diff antes de
// extraer) — el footer minimalista de PORTFOLIO difiere a propósito y no
// usa este componente. Server Component puro, sin estado ni efectos.
export default function Footer({ footer }: { footer: FooterProps }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInfo}>
        {footer.ciudad && <span>{footer.ciudad}</span>}
        {footer.telefono && <span>{footer.telefono}</span>}
        {footer.email && <span>{footer.email}</span>}
      </div>
      <div className={styles.footerRedes}>
        {footer.instagramUrl && (
          <a href={footer.instagramUrl} target="_blank" rel="noopener noreferrer">
            {footer.instagramHandle}
          </a>
        )}
        {footer.facebook && <span>{footer.facebook}</span>}
      </div>
      <div className={styles.footerCredito}>Hecho con WebBot · Devalpo</div>
    </footer>
  )
}
