import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import Footer from '@/components/templates/shared/Footer'
import { buildHero, buildAbout, buildProductos, buildContacto, buildFooter } from './sections'
import styles from './Tienda.module.css'

// Identidad visual TIENDA (Decisión D6): header compacto con banner ancho,
// grid de productos "3-up" con un CTA de WhatsApp por card, y una barra de
// contacto sticky (solo `position: sticky` en CSS, sin JS — Constraint del
// design). Server Component async — sin 'use client', sin next/dynamic
// (Constraints C2/C3 en design.md). Aplica la paleta (D6) sobre su propio
// elemento raíz.
export default async function Tienda({ config }: TemplateProps) {
  const hero = buildHero(config)
  const about = buildAbout(config)
  const productos = buildProductos(config)
  const contacto = buildContacto(config)
  const footer = buildFooter(config)

  return (
    <div className={styles.page} style={buildPaletteStyle(config)} data-template="TIENDA">
      <header className={styles.header}>
        {hero.rubro && <div className={styles.badge}>{hero.rubro}</div>}
        <h1 className={styles.nombre}>{hero.nombre}</h1>
        <div className={styles.ctas}>
          {hero.whatsappUrl && (
            <a href={hero.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimaria}>
              Comprar por WhatsApp
            </a>
          )}
          {hero.telUrl && (
            <a href={hero.telUrl} className={styles.ctaSecundaria}>
              Llamar · {hero.telefonoDisplay}
            </a>
          )}
        </div>
      </header>

      {hero.imagenHero && (
        <div className={styles.banner}>
          <Image src={hero.imagenHero} alt={hero.nombre} fill sizes="100vw" className={styles.bannerImagen} priority />
        </div>
      )}

      {hero.descripcion && (
        <p className={styles.descripcion}>{hero.descripcion}</p>
      )}

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

      {productos && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>{productos.etiqueta}</h2>
          <div className={styles.productosGrid}>
            {productos.items.map((item) => (
              <div key={item.imagen} className={styles.productoCard}>
                <div className={styles.productoImagenWrap}>
                  <Image
                    src={item.imagen}
                    alt={item.texto ?? hero.nombre}
                    fill
                    sizes="(max-width: 720px) 100vw, 33vw"
                    className={styles.productoImagen}
                  />
                </div>
                {item.texto && <p className={styles.productoTexto}>{item.texto}</p>}
                {item.whatsappUrl && (
                  <a href={item.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.productoCta}>
                    Consultar
                  </a>
                )}
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

      {contacto.whatsappUrl && (
        <div className={styles.contactoBarraSticky}>
          <a href={contacto.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.contactoBarraCta}>
            Escríbenos por WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
