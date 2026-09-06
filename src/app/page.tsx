import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
import { LandingFAQ } from './LandingFAQ'
import { HeroDemo } from './_landing/HeroDemo'
import {
  COMO_FUNCIONA,
  CTA_FINAL,
  EJEMPLOS_INTRO,
  FAQ,
  HERO,
  NAV,
  POR_QUE_DEVALPO,
  PRECIO,
} from './_landing/copy'
import { EJEMPLOS } from './_landing/ejemplos'
import { estadoPromo, formatCLP, PRECIO_PROMO, PRECIO_SITIO } from './_landing/precios'
import { urlPreviewDesdeEnv } from './admin/_lib/urlPreview'

// El poster viene de scripts/capturar-posters.ts (slice 1): viewport móvil
// 390×844 con deviceScaleFactor 2 → PNG de 780×1688px.
const HERO_DEMO_SUBDOMINIO = 'demo-restaurante'
const HERO_DEMO_URL = urlPreviewDesdeEnv(HERO_DEMO_SUBDOMINIO)
const HERO_DEMO_POSTER = '/demo-restaurante-poster.png'
const HERO_DEMO_POSTER_ANCHO = 780
const HERO_DEMO_POSTER_ALTO = 1688
const HERO_DEMO_TITULO = 'Sitio real publicado — demo de restaurante'

// Componentes de sección a nivel de módulo (no dentro de LandingPage) para
// cumplir react-hooks/static-components — ver design D3.

function Nav() {
  return (
    <nav className={styles.nav}>
      <Image src="/devalpo-logo.png" alt="Devalpo" width={120} height={44} className={styles.navLogo} priority />
      <div className={styles.navLinks}>
        <a href={NAV.ejemplos.href} className={styles.navLink}>{NAV.ejemplos.label}</a>
        <a href={NAV.comoFunciona.href} className={styles.navLink}>{NAV.comoFunciona.label}</a>
        <a href={NAV.precio.href} className={styles.navLink}>{NAV.precio.label}</a>
        <a href={NAV.preguntas.href} className={styles.navLink}>{NAV.preguntas.label}</a>
        <Link href={NAV.cta.href} className={styles.navCta}>{NAV.cta.label}</Link>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>{HERO.badge}</div>
          <h1 className={styles.heroTitle}>{HERO.titulo}</h1>
          <p className={styles.heroSubtitle}>{HERO.subtitulo}</p>
          <div className={styles.heroCtas}>
            <Link href={HERO.ctaPrimario.href} className={styles.ctaPrimary}>{HERO.ctaPrimario.label}</Link>
            <a href={HERO.ctaSecundario.href} className={styles.ctaSecondary}>{HERO.ctaSecundario.label}</a>
          </div>
          <div className={styles.heroTrust}>
            {HERO.confianza.map((linea) => (
              <span key={linea}>✓ {linea}</span>
            ))}
          </div>
        </div>
        <div className={styles.heroDemoWrap}>
          <span className={styles.heroDemoEtiqueta}>{HERO.demo.etiqueta}</span>
          <HeroDemo
            url={HERO_DEMO_URL}
            poster={HERO_DEMO_POSTER}
            posterAncho={HERO_DEMO_POSTER_ANCHO}
            posterAlto={HERO_DEMO_POSTER_ALTO}
            titulo={HERO_DEMO_TITULO}
          />
        </div>
      </div>
    </section>
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
      <div className={styles.footerCopy}>© 2026 Devalpo · Soluciones Tecnológicas</div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Nav />
      <Hero />
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
