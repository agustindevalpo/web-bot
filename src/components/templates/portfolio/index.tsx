import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import { buildHero, buildAbout, buildTrabajos, buildContacto, buildFooter } from './sections'
import styles from './Portfolio.module.css'

// Identidad visual PORTFOLIO (Decisión D6): hero editorial oscuro solo con
// tipografía (sin imagen — la fotografía vive en el grid de Trabajos),
// tipografía sobredimensionada, grid masonry "gallery-first" (CSS columns,
// sin JS) para Trabajos, y un footer mínimo. Server Component async — sin
// 'use client', sin next/dynamic (Constraints C2/C3 en design.md). Aplica
// la paleta (D6) sobre su propio elemento raíz.
export default async function Portfolio({ config }: TemplateProps) {
  const hero = buildHero(config)
  const about = buildAbout(config)
  const trabajos = buildTrabajos(config)
  const contacto = buildContacto(config)
  const footer = buildFooter(config)

  return (
    <div className={styles.page} style={buildPaletteStyle(config)} data-template="PORTFOLIO">
      <section className={styles.hero}>
        <div className={styles.heroContenido}>
          {hero.rubro && <div className={styles.badge}>{hero.rubro}</div>}
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

      {trabajos && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>{trabajos.etiqueta}</h2>
          <div className={styles.trabajosGrid}>
            {trabajos.items.map((item) => (
              <figure key={item.imagen} className={styles.trabajoItem}>
                <Image
                  src={item.imagen}
                  alt={item.texto ?? hero.nombre}
                  width={640}
                  height={800}
                  sizes="(max-width: 720px) 100vw, 33vw"
                  className={styles.trabajoImagen}
                />
                {item.texto && <figcaption className={styles.trabajoTexto}>{item.texto}</figcaption>}
              </figure>
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
        <div className={styles.footerRedes}>
          {footer.instagramUrl && (
            <a href={footer.instagramUrl} target="_blank" rel="noopener noreferrer">
              {footer.instagramHandle}
            </a>
          )}
          {footer.facebook && <span>{footer.facebook}</span>}
          {footer.ciudad && <span>{footer.ciudad}</span>}
        </div>
        <div className={styles.footerCredito}>Hecho con WebBot · Devalpo</div>
      </footer>
    </div>
  )
}
