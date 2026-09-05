import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import { buildHero, buildAbout, buildMenu, buildGaleria, buildContacto, buildFooter } from './sections'
import styles from './Restaurante.module.css'

// Identidad visual RESTAURANTE (Decisión D6): hero fotográfico a pantalla
// completa con overlay oscuro, lista de menú en dos columnas con líneas
// punteadas ("leaders") entre cada plato, y una franja cálida de galería en
// scroll horizontal. Server Component async — sin 'use client', sin
// next/dynamic (Constraints C2/C3 en design.md). Aplica la paleta (D6)
// sobre su propio elemento raíz.
export default async function Restaurante({ config }: TemplateProps) {
  const hero = buildHero(config)
  const about = buildAbout(config)
  const menu = buildMenu(config)
  const galeria = buildGaleria(config)
  const contacto = buildContacto(config)
  const footer = buildFooter(config)

  return (
    <div className={styles.page} style={buildPaletteStyle(config)}>
      <section className={styles.hero}>
        {hero.imagenHero && (
          <Image src={hero.imagenHero} alt={hero.nombre} fill sizes="100vw" className={styles.heroImagen} priority />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContenido}>
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

      {menu && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>{menu.etiqueta}</h2>
          <div className={styles.menu}>
            {menu.items.map((plato) => (
              <div key={plato} className={styles.menuItem}>
                <span className={styles.menuItemTexto}>{plato}</span>
                <span className={styles.menuItemLeader} />
              </div>
            ))}
          </div>
        </section>
      )}

      {galeria && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Galería</h2>
          <div className={styles.galeriaFranja}>
            {galeria.imagenes.map((img) => (
              <div key={img} className={styles.galeriaImagen}>
                <Image src={img} alt={hero.nombre} fill sizes="280px" className={styles.galeriaImagenImg} />
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
    </div>
  )
}
