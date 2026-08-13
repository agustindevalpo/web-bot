import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
import { LandingFAQ } from './LandingFAQ'

const CTA_URL = '/chat'

const MODELO = [
  {
    n: 1,
    color: '#080056',
    title: 'Prueba gratis, sin riesgo',
    desc: 'Chatea con nosotros y mira un sitio de ejemplo de tu rubro. Sin costo, sin tarjeta, sin compromiso.',
  },
  {
    n: 2,
    color: '#5B46F8',
    title: 'Al pagar, se hace realidad',
    desc: 'Cuando decides suscribirte, la IA genera tu sitio real con tus datos, listo para mostrar al mundo.',
  },
  {
    n: 3,
    color: '#FFAF4D',
    dark: true,
    title: 'Siempre cuidado, siempre online',
    desc: 'Hosting, seguridad, respaldos y soporte humano en español, todo incluido mientras tu plan esté activo.',
  },
]

const FLUJO = [
  { n: 1, color: '#080056', title: 'Cuéntanos de tu negocio', desc: 'Responde unas preguntas simples en el chat. Gratis, sin compromiso.' },
  { n: 2, color: '#5B46F8', title: 'Mira tu sitio al instante', desc: 'Te mostramos cómo se vería tu sitio, con el estilo de tu rubro.' },
  { n: 3, color: '#FFAF4D', title: 'Actívalo con tu pago', desc: 'Si te gusta, eliges un plan y listo. Sin contratos largos.' },
  { n: 4, color: '#15DEFA', title: 'Tu sitio real, online', desc: 'La IA lo genera con tus datos reales y queda publicado en minutos.' },
]

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

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Image src="/devalpo-logo.png" alt="Devalpo" width={120} height={44} className={styles.navLogo} priority />
        <div className={styles.navLinks}>
          <a href="#como-funciona" className={styles.navLink}>Cómo funciona</a>
          <a href="#planes" className={styles.navLink}>Planes</a>
          <a href="#faq" className={styles.navLink}>FAQ</a>
          <Link href={CTA_URL} className={styles.navCta}>Probar demo gratis</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroBlobTop} />
        <div className={styles.heroBlobBottom} />
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>WEBBOT · GENERADO POR IA</div>
          <h1 className={styles.heroTitle}>Presencia digital activa para cada PyME chilena</h1>
          <p className={styles.heroSubtitle}>
            Un sitio generado por IA con tus datos reales, en menos de 3 minutos. Vivo mientras
            pagas: hosting, soporte y actualizaciones incluidos.
          </p>
          <div className={styles.heroCtas}>
            <Link href={CTA_URL} className={styles.ctaPrimary}>Probar demo gratis · $0</Link>
            <a href="#planes" className={styles.ctaSecondary}>Ver planes</a>
          </div>
          <div className={styles.heroTrust}>
            <span>✓ Sin tokens en la demo</span>
            <span>✓ Sitio en menos de 3 min</span>
            <span>✓ Soporte real en español</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>EL MODELO</div>
          <h2 className={styles.sectionTitle}>WebBot en tres líneas</h2>
          <p className={styles.sectionSubtitle}>
            No vendemos un sitio web que se hace una vez. Vendemos un servicio que existe, vive y
            se actualiza mientras el cliente paga.
          </p>
        </div>
        <div className={styles.modeloGrid}>
          {MODELO.map((item) => (
            <div key={item.n} className={styles.modeloCard}>
              <div
                className={styles.numberBadge}
                style={{ background: item.color, color: item.dark ? '#080056' : '#ffffff' }}
              >
                {item.n}
              </div>
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardText}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className={`${styles.section} ${styles.sectionMuted}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>EL FLUJO</div>
          <h2 className={styles.sectionTitle}>Así de fácil es tener tu sitio online</h2>
        </div>
        <div className={styles.flujoGrid}>
          {FLUJO.map((step) => (
            <div key={step.n} className={styles.flujoCard}>
              <div className={styles.numberBadgeSmall} style={{ background: step.color }}>
                {step.n}
              </div>
              <div className={styles.cardTitleSmall}>{step.title}</div>
              <div className={styles.cardTextSmall}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

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
