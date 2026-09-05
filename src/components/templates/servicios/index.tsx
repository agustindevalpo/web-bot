import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import Footer from '@/components/templates/shared/Footer'
import { buildHero, buildAbout, buildServicios, buildContacto, buildFooter } from './sections'
import styles from './Servicios.module.css'

// Identidad visual SERVICIOS (Decisión D6): hero partido (copia a la
// izquierda / imagen a la derecha), lista de servicios vertical numerada con
// líneas divisorias, CTA de reserva por WhatsApp, sin galería. Server
// Component async — sin 'use client', sin next/dynamic (Constraints C2/C3
// en design.md). Aplica la paleta (D6) sobre su propio elemento raíz.
export default async function Servicios({ config }: TemplateProps) {
  const hero = buildHero(config)
  const about = buildAbout(config)
  const servicios = buildServicios(config)
  const contacto = buildContacto(config)
  const footer = buildFooter(config)

  return (
    <div className={styles.page} style={buildPaletteStyle(config)} data-template="SERVICIOS">
      <section className={styles.hero}>
        <div className={styles.heroCopia}>
          {hero.rubro && <div className={styles.badge}>{hero.rubro}</div>}
          <h1 className={styles.nombre}>{hero.nombre}</h1>
          {hero.descripcion && <p className={styles.descripcion}>{hero.descripcion}</p>}

          <div className={styles.ctas}>
            {hero.whatsappUrl && (
              <a href={hero.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimaria}>
                Reservar por WhatsApp
              </a>
            )}
            {hero.telUrl && (
              <a href={hero.telUrl} className={styles.ctaSecundaria}>
                Llamar · {hero.telefonoDisplay}
              </a>
            )}
          </div>
        </div>

        {hero.imagenHero && (
          <div className={styles.heroImagen}>
            <Image src={hero.imagenHero} alt={hero.nombre} fill sizes="(max-width: 720px) 100vw, 50vw" className={styles.heroImagenImg} priority />
          </div>
        )}
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
          <ol className={styles.serviciosLista}>
            {servicios.items.map((item) => (
              <li key={item.numero} className={styles.servicioItem}>
                <span className={styles.servicioNumero}>{String(item.numero).padStart(2, '0')}</span>
                <span className={styles.servicioTexto}>{item.texto}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className={styles.seccion}>
        <h2 className={styles.seccionTitulo}>Contacto</h2>
        <div className={styles.contactoInfo}>
          {contacto.telefono && <span>{contacto.telefono}</span>}
          {contacto.email && <span>{contacto.email}</span>}
        </div>
        {contacto.whatsappUrl && (
          <a href={contacto.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.ctaReserva}>
            Reservar una hora
          </a>
        )}
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
