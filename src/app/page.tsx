import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
import { CtaMovil } from './_landing/CtaMovil'
import { FaqAcordeon } from './_landing/FaqAcordeon'
import { HeroVisual } from './_landing/HeroVisual'
import { MaquetaSitio } from './_landing/MaquetaSitio'
import { PasosRiel } from './_landing/PasosRiel'
import { Reveal } from './_landing/Reveal'
import { SiteHeader } from './_landing/SiteHeader'
import {
  BENEFICIOS,
  BENEFICIOS_LABEL,
  COMO_FUNCIONA,
  CTA_FINAL,
  EJEMPLOS_INTRO,
  FAQ,
  FOOTER,
  HERO,
  HERO_MAQUETAS,
  POR_QUE_DEVALPO,
  PRECIO,
} from './_landing/copy'
import { EJEMPLOS } from './_landing/ejemplos'
import { estadoPromo } from './_landing/precios'
import { vistaPrecio } from './_landing/vistaPrecio'

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
    <Reveal id="ejemplos" className={styles.ejemplos}>
      <div className={styles.seccionInner}>
        <div className={styles.ejemplosCabecera}>
          <div>
            <div className={styles.eyebrow} data-r>{EJEMPLOS_INTRO.eyebrow}</div>
            <h2 className={`${styles.titulo2} ${styles.ejemplosTitulo}`} data-r>{EJEMPLOS_INTRO.titulo}</h2>
          </div>
          <p className={styles.ejemplosIntro} data-r>{EJEMPLOS_INTRO.subtitulo}</p>
        </div>
        <div className={styles.ejemplosGrid}>
          {EJEMPLOS.map((ejemplo) => {
            const maqueta = HERO_MAQUETAS.find((m) => m.subdominio === ejemplo.subdominio)
            return (
              <a
                key={ejemplo.subdominio}
                href={ejemplo.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ejemploCard}
                data-r
              >
                <div className={styles.ejemploPrevia} aria-hidden="true">
                  {maqueta && <MaquetaSitio m={maqueta} />}
                </div>
                <div className={styles.ejemploPie}>
                  <div>
                    <div className={styles.ejemploRubro}>{ejemplo.rubro}</div>
                    <p className={styles.ejemploDescripcion}>{ejemplo.descripcion}</p>
                  </div>
                  <span className={styles.ejemploFlecha} aria-hidden="true">↗</span>
                  <span className={styles.soloLectores}>{EJEMPLOS_INTRO.linkTarjeta}</span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </Reveal>
  )
}

function ComoFunciona() {
  return (
    <Reveal id="como-funciona" className={styles.comoFunciona}>
      <div className={`${styles.seccionInner} ${styles.comoGrid}`}>
        <div className={styles.comoIzquierda}>
          <div className={styles.eyebrow} data-r>{COMO_FUNCIONA.eyebrow}</div>
          <h2 className={`${styles.titulo2} ${styles.comoTitulo}`} data-r>{COMO_FUNCIONA.titulo}</h2>
          <p className={styles.comoTexto} data-r>{COMO_FUNCIONA.texto}</p>
          <Link href={COMO_FUNCIONA.cta.href} className={styles.comoCta} data-r>
            {COMO_FUNCIONA.cta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <PasosRiel />
      </div>
    </Reveal>
  )
}

function Precio() {
  const vista = vistaPrecio(estadoPromo())

  return (
    <Reveal id="precio" className={styles.precio}>
      <div className={styles.seccionInner}>
        <div className={styles.precioCabecera}>
          <div className={styles.eyebrow} data-r>{PRECIO.eyebrow}</div>
          <h2 className={styles.titulo2} data-r>{PRECIO.titulo}</h2>
        </div>
        <div className={styles.precioBloque} data-r>
          <div className={styles.precioMancha1} aria-hidden="true" />
          <div className={styles.precioMancha2} aria-hidden="true" />
          <div className={styles.precioIzquierda}>
            <div className={styles.precioNombre}>{PRECIO.nombreTarjeta}</div>
            {vista.etiquetaPromo && <div className={styles.precioEtiqueta}>{vista.etiquetaPromo}</div>}
            <div className={styles.precioMontoFila}>
              <span className={styles.precioMonto}>{vista.monto}</span>
              {vista.montoTachado && <span className={styles.precioTachado}>{vista.montoTachado}</span>}
            </div>
            <div className={styles.precioLinea}>{vista.lineaPagoUnico}</div>
            {vista.notaAgotado && <p className={styles.precioAgotado}>{vista.notaAgotado}</p>}
            <Link href={PRECIO.cta.href} className={styles.precioCta}>
              {PRECIO.cta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.precioDerecha}>
            <h3 className={styles.precioIncluyeTitulo}>{PRECIO.incluyeTitulo}</h3>
            <ul className={styles.precioLista}>
              {PRECIO.incluye.map((item) => (
                <li key={item} className={styles.precioItem}>
                  <span className={styles.precioCheck} aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={styles.precioExtras} data-r>
          <div className={styles.precioExtra}>
            <span className={styles.precioExtraTexto}>{PRECIO.extras.multipagina}</span>
            <span className={styles.precioExtraMonto}>{vista.multipagina}</span>
          </div>
          <div className={styles.precioExtra}>
            <span className={styles.precioExtraTexto}>{PRECIO.extras.renovacion}</span>
            <span className={styles.precioExtraMonto}>{vista.renovacion}</span>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

function PorQueDevalpo() {
  const [quienes, publicamos, piden] = POR_QUE_DEVALPO.puntos
  const { firma } = POR_QUE_DEVALPO

  return (
    <Reveal className={styles.porque}>
      <div className={styles.seccionInner}>
        <div className={styles.porqueCabecera}>
          <div className={styles.eyebrow} data-r>{POR_QUE_DEVALPO.eyebrow}</div>
          <h2 className={`${styles.titulo2} ${styles.porqueTitulo}`} data-r>{POR_QUE_DEVALPO.titulo}</h2>
        </div>
        <div className={styles.porqueGrid}>
          <div className={styles.porqueGrande} data-r>
            <div>
              <h3 className={styles.porqueRotulo}>{quienes.titulo}</h3>
              <p className={styles.porqueTextoGrande}>{quienes.desc}</p>
            </div>
            <div className={styles.porqueFirma}>
              <span className={styles.porqueAvatar} aria-hidden="true">{firma.iniciales}</span>
              <div>
                <div className={styles.porqueFirmaFrase}>{firma.frase}</div>
                <div className={styles.porqueFirmaPersona}>{firma.persona}</div>
              </div>
            </div>
          </div>
          <div className={`${styles.porqueTarjeta} ${styles.porqueGris}`} data-r>
            <h3 className={styles.porqueTitulo3}>{publicamos.titulo}</h3>
            <p className={styles.porqueTexto}>{publicamos.desc}</p>
            <ul className={styles.porquePastillas}>
              {POR_QUE_DEVALPO.pastillas.map((pastilla) => (
                <li key={pastilla} className={styles.porquePastilla}>{pastilla}</li>
              ))}
            </ul>
          </div>
          <div className={`${styles.porqueTarjeta} ${styles.porqueCyan}`} data-r>
            <h3 className={styles.porqueTitulo3}>{piden.titulo}</h3>
            <p className={`${styles.porqueTexto} ${styles.porqueTextoCyan}`}>{piden.desc}</p>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

function Faq() {
  return (
    <Reveal id="faq" className={styles.faq}>
      <div className={`${styles.seccionInner} ${styles.faqGrid}`}>
        <div>
          <div className={styles.eyebrow} data-r>{FAQ.eyebrow}</div>
          <h2 className={`${styles.titulo2} ${styles.faqTitulo}`} data-r>{FAQ.titulo}</h2>
          <p className={styles.faqOtraDuda} data-r>
            {FAQ.otraDuda.prefijo}{' '}
            <a href={FAQ.otraDuda.href} className={styles.faqEnlace}>{FAQ.otraDuda.telefono}</a>.
          </p>
        </div>
        <div data-r>
          <FaqAcordeon items={FAQ.items} />
        </div>
      </div>
    </Reveal>
  )
}

function CtaFinal() {
  const { antes, destacado } = CTA_FINAL.tituloPartes

  return (
    <Reveal className={styles.ctaFinal}>
      <div className={styles.ctaFinalTarjeta}>
        <div className={styles.ctaFinalCuadricula} aria-hidden="true" />
        <div className={styles.ctaFinalMancha} aria-hidden="true" />
        <div className={styles.ctaFinalContenido}>
          <h2 className={styles.ctaFinalTitle} data-r>
            {antes} <span className={styles.ctaFinalDestacado}>{destacado}</span>
          </h2>
          <p className={styles.ctaFinalSubtitle} data-r>{CTA_FINAL.subtitulo}</p>
          <Link href={CTA_FINAL.cta.href} className={styles.ctaFinalBoton} data-r>
            {CTA_FINAL.cta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </Reveal>
  )
}

function Footer() {
  const { contacto, empresa } = FOOTER

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerColumnas}>
          <div>
            <Image src="/devalpo-logo.png" alt="Devalpo" width={120} height={44} className={styles.footerLogo} />
            <p className={styles.footerGlosa}>{FOOTER.glosa}</p>
          </div>
          <div>
            <h2 className={styles.footerRotulo}>{contacto.titulo}</h2>
            <div className={styles.footerLista}>
              <span>{contacto.nombre}</span>
              <span>{contacto.cargo}</span>
              <a href={contacto.correo.href} className={`${styles.footerEnlace} ${styles.footerSinCorte}`}>
                {contacto.correo.label}
              </a>
              <a href={contacto.telefono.href} className={`${styles.footerEnlace} ${styles.footerSinCorte}`}>
                {contacto.telefono.label}
              </a>
            </div>
          </div>
          <div>
            <h2 className={styles.footerRotulo}>{empresa.titulo}</h2>
            <div className={styles.footerLista}>
              {empresa.lineas.map((linea) => (
                <span key={linea}>{linea}</span>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.footerInferior}>
          <span>{FOOTER.copyright}</span>
          <div className={styles.footerLinks}>
            {FOOTER.enlaces.map((enlace) => (
              <Link key={enlace.href} href={enlace.href} className={styles.footerEnlace}>
                {enlace.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
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
      <CtaMovil />
    </div>
  )
}
