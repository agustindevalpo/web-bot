import type { CSSProperties } from 'react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { sitioRepo } from '@/infrastructure/container'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Template } from '@/domain/value-objects/Template'
import styles from './page.module.css'

const ETIQUETA_SERVICIOS: Record<string, string> = {
  [Template.RESTAURANTE]: 'Menú',
  [Template.TIENDA]: 'Productos',
  [Template.SERVICIOS]: 'Servicios',
  [Template.PORTFOLIO]: 'Trabajos',
  [Template.LANDING]: 'Qué ofrecemos',
}

function soloDigitos(telefono: string): string {
  return telefono.replace(/[^\d]/g, '')
}

export default async function SitioCliente({
  params,
}: {
  params: Promise<{ subdominio: string }>
}) {
  const { subdominio } = await params

  const sitio = await sitioRepo.findBySubdominio(subdominio)

  if (!sitio || !sitio.estaActivo()) return notFound()

  const config = sitio.configJson as unknown as SiteConfigDTO
  const colores = config.colores ?? { primario: '#080056', secundario: '#5B46F8', acento: '#15DEFA', texto: '#ffffff' }
  const imagenes = config.imagenes ?? []
  const [imagenHero, ...imagenesGaleria] = imagenes
  const etiquetaServicios = ETIQUETA_SERVICIOS[sitio.template] ?? 'Servicios'
  const whatsapp = config.contacto?.telefono ? soloDigitos(config.contacto.telefono) : null

  return (
    <div
      className={styles.page}
      style={
        {
          '--primario': colores.primario,
          '--secundario': colores.secundario,
          '--acento': colores.acento,
          '--texto': colores.texto,
        } as CSSProperties
      }
    >
      <section className={styles.hero}>
        <div className={styles.heroBlobA} />
        <div className={styles.heroBlobB} />
        <div className={styles.heroContent}>
          {config.rubro && config.rubro !== 'demo' && <div className={styles.badge}>{config.rubro.toUpperCase()}</div>}
          {imagenHero && (
            <div className={styles.heroImagen}>
              <Image src={imagenHero} alt={config.nombre} fill sizes="420px" className={styles.heroImagenImg} priority />
            </div>
          )}
          <h1 className={styles.nombre}>{config.nombre}</h1>
          {config.descripcion && <p className={styles.descripcion}>{config.descripcion}</p>}

          <div className={styles.ctas}>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimaria}>
                Escribir por WhatsApp
              </a>
            )}
            {config.contacto?.telefono && (
              <a href={`tel:${config.contacto.telefono}`} className={styles.ctaSecundaria}>
                Llamar · {config.contacto.telefono}
              </a>
            )}
          </div>
        </div>
      </section>

      {config.highlight && (
        <div className={styles.highlight}>
          <span>★</span> {config.highlight}
        </div>
      )}

      {config.servicios && config.servicios.length > 0 && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>{etiquetaServicios}</h2>
          <div className={styles.serviciosGrid}>
            {config.servicios.map((servicio) => (
              <div key={servicio} className={styles.servicioCard}>
                {servicio}
              </div>
            ))}
          </div>
        </section>
      )}

      {imagenesGaleria.length > 0 && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Galería</h2>
          <div className={styles.galeria}>
            {imagenesGaleria.map((img) => (
              <div key={img} className={styles.galeriaImagen}>
                <Image src={img} alt={config.nombre} fill sizes="(max-width: 560px) 100vw, 33vw" className={styles.galeriaImagenImg} />
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <div className={styles.footerInfo}>
          {config.ciudad && <span>{config.ciudad}</span>}
          {config.contacto?.telefono && <span>{config.contacto.telefono}</span>}
          {config.contacto?.email && <span>{config.contacto.email}</span>}
        </div>
        <div className={styles.footerRedes}>
          {config.redes?.instagram && (
            <a
              href={`https://instagram.com/${config.redes.instagram.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {config.redes.instagram}
            </a>
          )}
          {config.redes?.facebook && <span>{config.redes.facebook}</span>}
        </div>
        <div className={styles.footerCredito}>Hecho con WebBot · Devalpo</div>
      </footer>
    </div>
  )
}
