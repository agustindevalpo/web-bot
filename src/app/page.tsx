import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
import { LandingFAQ } from './LandingFAQ'
import { HeroVisual } from './_landing/HeroVisual'
import { Reveal } from './_landing/Reveal'
import { SiteHeader } from './_landing/SiteHeader'
import {
  BENEFICIOS,
  BENEFICIOS_LABEL,
  COMO_FUNCIONA,
  CTA_FINAL,
  EJEMPLOS_INTRO,
  FAQ,
  HERO,
  POR_QUE_DEVALPO,
  PRECIO,
} from './_landing/copy'
import { EJEMPLOS } from './_landing/ejemplos'
import { estadoPromo, formatCLP, PRECIO_PROMO, PRECIO_SITIO } from './_landing/precios'

// Componentes de sección a nivel de módulo (no dentro de LandingPage) para
// cumplir react-hooks/static-components — ver design D3.

function Hero() {
  const { antes, destacado, despues } = HERO.tituloPartes

  return (
    <Reveal id="inicio" className={styles.hero}>
      <div className={styles.heroCuadricula} aria-hidden="true" />
      <div className={styles.heroMancha1} aria-hidden="true" />
      <div className={styles.heroMancha2} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div>
          <div className={styles.heroBadge} data-r>
            <span className={styles.heroBadgeMarca}>{HERO.badge.marca}</span>
            <span className={styles.heroBadgeTexto}>{HERO.badge.texto}</span>
          </div>
          <h1 className={styles.heroTitle} data-r>
            {antes}{' '}
            <span className={styles.heroSubrayado}>
              {destacado}
              <span className={styles.heroSubrayadoBarra} aria-hidden="true" />
            </span>{' '}
            {despues}
          </h1>
          <p className={styles.heroSubtitle} data-r>{HERO.subtitulo}</p>
          <div className={styles.heroCtas} data-r>
            <Link href={HERO.ctaPrimario.href} className={styles.heroCtaPrimario}>
              {HERO.ctaPrimario.label}
              <span aria-hidden="true">→</span>
            </Link>
            <a href={HERO.ctaSecundario.href} className={styles.heroCtaSecundario}>{HERO.ctaSecundario.label}</a>
          </div>
          <div className={styles.heroTrust} data-r>
            {HERO.confianza.map((linea) => (
              <span key={linea} className={styles.heroTick}>
                <span className={styles.heroTickIcono} aria-hidden="true">✓</span>
                {linea}
              </span>
            ))}
          </div>
        </div>
        <div data-r>
          <HeroVisual />
        </div>
      </div>
    </Reveal>
  )
}

function FranjaBeneficios() {
  // La lista se duplica para que el bucle del marquee no tenga corte; la copia
  // es decorativa y queda fuera del árbol de accesibilidad.
  return (
    <div className={styles.franja} aria-label={BENEFICIOS_LABEL}>
      <div className={styles.franjaPista}>
        {[0, 1].map((copia) =>
          BENEFICIOS.map((texto) => (
            <span key={`${copia}-${texto}`} className={styles.franjaItem} aria-hidden={copia === 1 || undefined}>
              {texto}
              <span className={styles.franjaRombo} aria-hidden="true" />
            </span>
          )),
        )}
      </div>
    </div>
  )
}

function EjemplosReales() {
  return (
    <section id="ejemplos" className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{EJEMPLOS_INTRO.titulo}</h2>
        <p className={styles.sectionSubtitle}>{EJEMPLOS_INTRO.subtitulo}</p>
      </div>
      <div className={styles.ejemplosGrid}>
        {EJEMPLOS.map((ejemplo) => (
          <a
            key={ejemplo.subdominio}
            href={ejemplo.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ejemploCard}
          >
            <div className={styles.ejemploRubro}>{ejemplo.rubro}</div>
            <p className={styles.ejemploDescripcion}>{ejemplo.descripcion}</p>
            <span className={styles.ejemploLink}>{EJEMPLOS_INTRO.linkTarjeta}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className={`${styles.section} ${styles.sectionMuted}`}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{COMO_FUNCIONA.titulo}</h2>
      </div>
      <div className={styles.pasosGrid}>
        {COMO_FUNCIONA.pasos.map((paso) => (
          <div key={paso.n} className={styles.pasoCard}>
            <div className={styles.pasoNumero}>{paso.n}</div>
            <h3 className={styles.cardTitleSmall}>{paso.titulo}</h3>
            <p className={styles.cardTextSmall}>{paso.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Precio() {
  const promo = estadoPromo()

  return (
    <section id="precio" className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{PRECIO.titulo}</h2>
      </div>
      <div className={styles.precioCard}>
        <div className={styles.precioNombre}>{PRECIO.nombreTarjeta}</div>
        <div className={styles.precioMontoRow}>
          <span className={styles.precioMonto}>{formatCLP(PRECIO_SITIO)}</span>
          <span className={styles.precioPagoUnico}>{PRECIO.etiquetaPagoUnico}</span>
        </div>
        <ul className={styles.precioIncluyeLista}>
          {PRECIO.incluye.map((item) => (
            <li key={item} className={styles.precioIncluyeItem}>{item}</li>
          ))}
        </ul>
        <p className={styles.precioEstado}>
          {promo.agotada ? (
            <>
              <span className={styles.precioTachado}>{formatCLP(PRECIO_PROMO)}</span>{' '}
              {PRECIO.agotado.etiqueta} — {PRECIO.agotado.nota(formatCLP(PRECIO_SITIO))}
            </>
          ) : (
            <>
              {PRECIO.lanzamiento.prefijo}: {formatCLP(PRECIO_PROMO)} {PRECIO.lanzamiento.primeros} ·{' '}
              {PRECIO.lanzamiento.cupos(promo.restantes)}
            </>
          )}
        </p>
        <Link href={PRECIO.cta.href} className={styles.ctaPrimary}>{PRECIO.cta.label}</Link>
        <p className={styles.precioLetraChica}>{PRECIO.letraChica}</p>
      </div>
    </section>
  )
}

function PorQueDevalpo() {
  return (
    <section className={`${styles.section} ${styles.sectionMuted}`}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{POR_QUE_DEVALPO.titulo}</h2>
      </div>
      <div className={styles.porqueGrid}>
        {POR_QUE_DEVALPO.puntos.map((punto) => (
          <div key={punto.titulo} className={styles.porqueCard}>
            <h3 className={styles.cardTitleSmall}>{punto.titulo}</h3>
            <p className={styles.cardTextSmall}>{punto.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className={styles.faqSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{FAQ.titulo}</h2>
      </div>
      <LandingFAQ items={FAQ.items} />
    </section>
  )
}

function CtaFinal() {
  return (
    <section className={styles.ctaFinal}>
      <div className={styles.ctaFinalInner}>
        <h2 className={styles.ctaFinalTitle}>{CTA_FINAL.titulo}</h2>
        <p className={styles.ctaFinalSubtitle}>{CTA_FINAL.subtitulo}</p>
        <Link href={CTA_FINAL.cta.href} className={styles.ctaPrimary}>{CTA_FINAL.cta.label}</Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <Image src="/devalpo-logo.png" alt="Devalpo" width={100} height={37} className={styles.footerLogo} />
      <div className={styles.footerText}>
        Agustín Nicolás Romero Salazar · CEO &amp; Co-Founder · agustin.romero@devalpo.cl · +56 9 7642 4587
      </div>
      <div className={styles.footerLegal}>
        Devalpo Soluciones Tecnológicas SpA · RUT 77.119.936-4 · Reñaca Norte 265, of. 510, Viña del Mar
      </div>
      <div className={styles.footerLinks}>
        <Link href="/terminos" className={styles.footerLink}>Términos y condiciones</Link>
        <Link href="/privacidad" className={styles.footerLink}>Privacidad</Link>
      </div>
      <div className={styles.footerCopy}>© 2026 Devalpo · Soluciones Tecnológicas</div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <Hero />
      <FranjaBeneficios />
      <EjemplosReales />
      <ComoFunciona />
      <Precio />
      <PorQueDevalpo />
      <Faq />
      <CtaFinal />
      <Footer />
    </div>
  )
}
