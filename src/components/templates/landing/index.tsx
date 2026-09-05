import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import Footer from '@/components/templates/shared/Footer'
import { buildHero, buildAbout, buildServicios, buildGaleria, buildContacto, buildFooter } from './sections'
import styles from './Landing.module.css'

// Layout de hoy migrado verbatim (Decisión D6: LANDING = base visual de
// referencia). Server Component async — sin 'use client', sin next/dynamic
// (Constraints C2/C3 en design.md). Agrega las secciones About y Contact
// (form) nuevas por Requirement "Mandatory Sections and Labels", que el
// page.tsx anterior no tenía.
export default async function Landing({ config }: TemplateProps) {
  const hero = buildHero(config)
  const about = buildAbout(config)
  const servicios = buildServicios(config)
  const galeria = buildGaleria(config)
  const contacto = buildContacto(config)
  const footer = buildFooter(config)

  return (
    <div className={styles.page} style={buildPaletteStyle(config)} data-template="LANDING">
      <section className={styles.hero}>
        <div className={styles.heroBlobA} />
        <div className={styles.heroBlobB} />
        <div className={styles.heroContent}>
          {hero.rubro && <div className={styles.badge}>{hero.rubro}</div>}
          {hero.imagenHero && (
            <div className={styles.heroImagen}>
              <Image src={hero.imagenHero} alt={hero.nombre} fill sizes="420px" className={styles.heroImagenImg} priority />
            </div>
          )}
          <h1 className={styles.nombre}>{hero.nombre}</h1>
          {hero.descripcion && <p className={styles.descripcion}>{hero.descripcion}</p>}

          <div className={styles.ctas}>
            {hero.whatsappUrl && (
              <a href={hero.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimaria}>
                Escribir por WhatsApp
              </a>
            )}
            {hero.telUrl && (
              <a href={hero.telUrl} className={styles.ctaSecundaria}>
                Llamar · {hero.telefonoDisplay}
              </a>
            )}
          </div>
        </div>
      </section>

      {hero.highlight && (
        <div className={styles.highlight}>
          <span>★</span> {hero.highlight}
        </div>
      )}

      {about && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Sobre nosotros</h2>
          <p className={styles.descripcion}>{about.texto}</p>
        </section>
      )}

      {servicios && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>{servicios.etiqueta}</h2>
          <div className={styles.serviciosGrid}>
            {servicios.items.map((servicio) => (
              <div key={servicio} className={styles.servicioCard}>
                {servicio}
              </div>
            ))}
          </div>
        </section>
      )}

      {galeria && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Galería</h2>
          <div className={styles.galeria}>
            {galeria.imagenes.map((img) => (
              <div key={img} className={styles.galeriaImagen}>
                <Image src={img} alt={hero.nombre} fill sizes="(max-width: 560px) 100vw, 33vw" className={styles.galeriaImagenImg} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.seccion}>
        <h2 className={styles.seccionTitulo}>Contacto</h2>
        <div className={styles.contactoInfo}>
          {contacto.telefono && <span>{contacto.telefono}</span>}
          {contacto.email && <span>{contacto.email}</span>}
        </div>
        {contacto.formularioHabilitado && contacto.mailtoUrl && (
          <form action={contacto.mailtoUrl} method="post" encType="text/plain" className={styles.contactoForm}>
            <input type="text" name="nombre" placeholder="Tu nombre" required className={styles.contactoInput} />
            <input type="email" name="email" placeholder="Tu email" required className={styles.contactoInput} />
            <textarea name="mensaje" placeholder="Tu mensaje" required className={styles.contactoTextarea} />
            <button type="submit" className={styles.ctaPrimaria}>
              Enviar mensaje
            </button>
          </form>
        )}
      </section>

      <Footer footer={footer} />
    </div>
  )
}
