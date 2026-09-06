import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
import { LandingFAQ } from './LandingFAQ'
import { HeroDemo } from './_landing/HeroDemo'
import { COMO_FUNCIONA, EJEMPLOS_INTRO, HERO, NAV } from './_landing/copy'
import { EJEMPLOS } from './_landing/ejemplos'
import { urlPreviewDesdeEnv } from './admin/_lib/urlPreview'

// Usado todavía por PLANES/COMPARE/CTA final, que el slice 3 reemplaza por el
// precio único de _landing/precios.ts (ver design, tabla "File Changes").
const CTA_URL = '/chat'

// El poster viene de scripts/capturar-posters.ts (slice 1): viewport móvil
// 390×844 con deviceScaleFactor 2 → PNG de 780×1688px.
const HERO_DEMO_SUBDOMINIO = 'demo-restaurante'
const HERO_DEMO_URL = urlPreviewDesdeEnv(HERO_DEMO_SUBDOMINIO)
const HERO_DEMO_POSTER = '/demo-restaurante-poster.png'
const HERO_DEMO_POSTER_ANCHO = 780
const HERO_DEMO_POSTER_ALTO = 1688
const HERO_DEMO_TITULO = 'Sitio real publicado — demo de restaurante'

const PLANES = [
  {
    nombre: 'Presencia',
    precio: '$29.990',
    periodo: 'CLP/mes',
    desc: 'La base de todo. Para PyMEs que quieren estar online.',
    popular: false,
    features: [
      'Sitio generado por IA en menos de 3 min',
      'Dominio propio (tú haces el CNAME)',
      'Hasta 6 páginas',
      '2 actualizaciones/mes vía chat',
      'SSL, hosting y backups incluidos',
      'Soporte por WhatsApp · 24h',
    ],
  },
  {
    nombre: 'Presencia Pro',
    precio: '$49.990',
    periodo: 'CLP/mes',
    desc: 'Todo resuelto sin tocar nada. El más popular.',
    popular: true,
    features: [
      'Todo lo de Presencia, más:',
      'Devalpo gestiona tu dominio',
      'Actualizaciones ilimitadas',
      'Formulario de contacto',
      'SEO básico con IA',
      'Soporte prioritario · mismo día',
    ],
  },
  {
    nombre: 'Agencia',
    precio: '$149.990',
    periodo: 'CLP/mes · 10 sitios',
    desc: 'La palanca de crecimiento para diseñadores y agencias.',
    popular: false,
    features: [
      'Todo lo de Presencia Pro, más:',
      'Panel white-label',
      'API access',
      'SLA garantizado',
      'Onboarding personalizado',
      'Hasta 10 sitios activos',
    ],
  },
  {
    nombre: 'Landing única',
    precio: '$249.000',
    periodo: 'pago único',
    desc: 'Para quien ya tiene hosting o desarrollador propio.',
    popular: false,
    features: [
      'Sitio generado con tus datos',
      'Código fuente (Next.js) entregado',
      '1 revisión post-entrega',
      'Sin hosting ni soporte incluidos',
      'Sin actualizaciones vía bot',
    ],
  },
]

const COMPARE_COLS = [
  { nombre: 'Presencia', precio: '$29.990/mes' },
  { nombre: 'Presencia Pro', precio: '$49.990/mes' },
  { nombre: 'Agencia', precio: '$149.990/mes' },
  { nombre: 'Landing única', precio: '$249.000 único' },
]

const COMPARE_ROWS = [
  { label: 'Sitio generado por IA', vals: ['✓', '✓', '✓', '✓'] },
  { label: 'Dominio propio', vals: ['Cliente hace CNAME', 'Devalpo gestiona', 'Devalpo gestiona', 'Cliente gestiona'] },
  { label: 'Páginas', vals: ['Hasta 6', 'Hasta 6', 'Hasta 6 × 10 sitios', '1 sitio'] },
  { label: 'Actualizaciones/mes', vals: ['2', 'Ilimitadas', 'Ilimitadas por sitio', '1 revisión'] },
  { label: 'Formulario de contacto', vals: ['—', '✓', '✓', '—'] },
  { label: 'SEO con IA', vals: ['—', '✓', '✓', '—'] },
  { label: 'Reporte de visitas por WA', vals: ['—', '✓', '✓', '—'] },
  { label: 'Soporte', vals: ['24h WhatsApp', 'Mismo día', 'SLA garantizado', 'No incluye'] },
  { label: 'White-label', vals: ['—', '—', '✓', '—'] },
  { label: 'API access', vals: ['—', '—', '✓', '—'] },
  { label: 'Hosting Devalpo', vals: ['✓', '✓', '✓', '—'] },
]

const FAQS = [
  { q: '¿Cómo funciona la demo gratis?', a: 'Responde 8 preguntas sobre tu negocio y mira un sitio de ejemplo de tu rubro, sin costo y sin tokens de IA involucrados.' },
  { q: '¿Cuándo se genera mi sitio real?', a: 'Recién después de pagar. Ahí la IA genera el sitio con tus datos reales, en menos de 3 minutos.' },
  { q: '¿Qué pasa si dejo de pagar?', a: 'El sitio se pausa. Mientras tu suscripción esté activa, tu sitio existe, vive y se actualiza.' },
  { q: '¿Puedo cambiar de plan más adelante?', a: 'Sí. Puedes subir de Presencia a Presencia Pro o Agencia cuando lo necesites, sin perder tu sitio.' },
  { q: '¿Necesito saber de tecnología?', a: 'No. Todo se gestiona por chat con el bot y soporte humano en español vía WhatsApp.' },
  { q: '¿Qué incluye el plan Landing única?', a: 'Un sitio generado una sola vez, con el código fuente completo (Next.js) para que lo alojes donde quieras. No incluye hosting ni soporte continuo.' },
]

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

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Nav />
      <Hero />
      <EjemplosReales />
      <ComoFunciona />

      <section id="planes" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>PLANES</div>
          <h2 className={styles.sectionTitle}>Un plan para cada etapa de tu negocio</h2>
          <p className={styles.sectionSubtitle}>Pagado mensualmente. Sin permanencia. Sube de plan cuando lo necesites.</p>
        </div>
        <div className={styles.planesGrid}>
          {PLANES.map((plan) => (
            <div key={plan.nombre} className={`${styles.planCard} ${plan.popular ? styles.planCardPopular : ''}`}>
              {plan.popular && <div className={styles.planBadge}>MÁS POPULAR</div>}
              <div className={styles.planName}>{plan.nombre}</div>
              <div className={styles.planPriceRow}>
                <span className={styles.planPrice}>{plan.precio}</span>
                <span className={styles.planPeriod}>{plan.periodo}</span>
              </div>
              <div className={styles.planDesc}>{plan.desc}</div>
              <div className={styles.planDivider} />
              <div className={styles.planFeatures}>
                {plan.features.map((f) => (
                  <div key={f} className={styles.planFeature}>
                    <span className={styles.planCheck}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href={CTA_URL} className={styles.planButton}>Elegir plan</Link>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionMuted}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitleSmall}>Comparativa completa</h2>
        </div>
        <div className={styles.compareWrapper}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th className={styles.compareFeatureHeader}>CARACTERÍSTICA</th>
                {COMPARE_COLS.map((col) => (
                  <th key={col.nombre}>
                    <div className={styles.compareColName}>{col.nombre}</div>
                    <div className={styles.compareColPrice}>{col.precio}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <td className={styles.compareRowLabel}>{row.label}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className={styles.compareCell}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="faq" className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>FAQ</div>
          <h2 className={styles.sectionTitle}>Preguntas frecuentes</h2>
        </div>
        <LandingFAQ items={FAQS} />
      </section>

      <section className={styles.ctaFinal}>
        <div className={styles.ctaFinalBlob} />
        <div className={styles.ctaFinalInner}>
          <h2 className={styles.ctaFinalTitle}>¿Listo para tener tu sitio online en 3 minutos?</h2>
          <p className={styles.ctaFinalSubtitle}>Demo gratis · el pago activa a la IA · sitio online en 3 minutos</p>
          <Link href={CTA_URL} className={styles.ctaPrimary}>Probar demo gratis</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <Image src="/devalpo-logo.png" alt="Devalpo" width={100} height={37} className={styles.footerLogo} />
        <div className={styles.footerText}>
          Agustín Nicolás Romero Salazar · CEO &amp; Co-Founder · agustin.romero@devalpo.cl · +56 9 7642 4587
        </div>
        <div className={styles.footerCopy}>© 2026 Devalpo · Soluciones Tecnológicas</div>
      </footer>
    </div>
  )
}
