import type { CSSProperties } from 'react'
import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import SeccionesSPA from '@/components/templates/shared/SeccionesSPA'
import { filtrarSecciones, estiloCascada, type SeccionSPA } from '@/components/templates/shared/navegacion'
import { instrumentSerif } from '@/components/templates/shared/fuentes'
import { clampAcento, OBJETIVO_TEXTO } from '@/domain/color/contraste'
import { buildMarca, buildInicio, buildServicios, buildNosotros, buildContacto, buildFooter } from './sections'
import FormularioContacto from './FormularioContacto'
import styles from './Landing.module.css'

const FONDO_LANDING = '#FFFFFF'

// Primer consumidor de `SeccionesSPA` (S0a, sin importador hasta acá) y de
// `clampAcento` (S0b, ídem). Server Component async — el único cliente de
// esta plantilla es `SeccionesSPA` (el switch de secciones) más el
// formulario de contacto (`FormularioContacto`), que no convierte el resto
// del árbol a cliente (README.md, "Implicancia arquitectónica").
export default async function Landing({ config }: TemplateProps) {
  const paletteStyle = buildPaletteStyle(config)
  // LANDING pinta el acento sobre blanco (README.md:94): necesita el techo,
  // no el piso — bajar `L` si el acento del cliente viene demasiado claro
  // para cumplir 4.5:1 de texto. Se sobreescribe `--acento` con el valor ya
  // clampeado: es la única variable de acento que esta plantilla consume
  // (no depende de `--primario`/`--secundario`/`--texto`), así que un solo
  // punto de cableado alcanza para eyebrows, botones, subrayado del nav,
  // cifras, check-icons, pin del mapa y enlaces.
  const acentoBase = (paletteStyle as Record<string, string>)['--acento']
  const acentoTexto = clampAcento(acentoBase, FONDO_LANDING, OBJETIVO_TEXTO)
  const estiloRaiz = { ...paletteStyle, '--acento': acentoTexto } as CSSProperties

  const marca = buildMarca(config)
  const inicio = buildInicio(config)
  const servicios = buildServicios(config)
  const nosotros = buildNosotros(config)
  const contacto = buildContacto(config)
  const footer = buildFooter(config)

  const eyebrowInicio = [inicio.rubro, inicio.ciudad].filter((valor): valor is string => valor !== null).join(' · ')

  const secciones: SeccionSPA[] = filtrarSecciones([
    {
      id: 'inicio',
      etiqueta: 'Inicio',
      contenido: (
        <section className={styles.inicio}>
          <div className={styles.inicioIzquierda}>
            {eyebrowInicio && (
              <div className={styles.eyebrow} data-dv-anim="up" style={estiloCascada(0)}>
                {eyebrowInicio}
              </div>
            )}
            <h1 className={styles.inicioTitulo} data-dv-anim="up" style={estiloCascada(1)}>
              {inicio.nombre}
            </h1>
            {inicio.descripcion && (
              <p className={styles.inicioParrafo} data-dv-anim="up" style={estiloCascada(2)}>
                {inicio.descripcion}
              </p>
            )}
            <div className={styles.ctas} data-dv-anim="up" style={estiloCascada(3)}>
              {inicio.whatsappUrl && (
                <a href={inicio.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimaria}>
                  Escribir por WhatsApp
                </a>
              )}
              {inicio.telUrl && (
                <a href={inicio.telUrl} className={styles.ctaSecundaria}>
                  Llamar · {inicio.telefonoDisplay}
                </a>
              )}
            </div>
            {inicio.destacados.length > 0 && (
              <div className={styles.statsRow} data-dv-anim="up" style={estiloCascada(4)}>
                {inicio.destacados.map((destacado) => (
                  <div key={destacado.etiqueta} className={styles.statItem}>
                    <div className={styles.statValor}>{destacado.valor}</div>
                    <div className={styles.statEtiqueta}>{destacado.etiqueta}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.inicioDerecha}>
            <div className={styles.fotoPlaceholder}>
              {inicio.imagenHero && (
                <Image src={inicio.imagenHero} alt={inicio.nombre} fill sizes="420px" className={styles.fotoImg} priority />
              )}
              <span className={styles.fotoEtiqueta}>{inicio.etiquetaFoto}</span>
            </div>

            {inicio.highlight && (
              <div className={styles.tarjetaDestacado}>
                <div className={styles.tarjetaEyebrow}>Destacado</div>
                <p className={styles.tarjetaFrase}>{inicio.highlight}</p>
              </div>
            )}
          </div>
        </section>
      ),
    },
    {
      id: 'servicios',
      etiqueta: 'Servicios',
      contenido: servicios && (
        <section className={styles.servicios}>
          <div className={styles.eyebrow}>Servicios</div>
          {/* `servicios.etiqueta` ("Qué ofrecemos") es el H2 que fija el e2e
              existente (templates_por_sitio.feature: 'la página muestra la
              sección "Qué ofrecemos"' → busca un <h2> con ese texto). */}
          <h2 className={styles.serviciosTitulo}>{servicios.etiqueta}</h2>

          <div className={styles.serviciosGrid}>
            {servicios.items.map((item, indice) => (
              <div
                key={item.titulo}
                className={styles.servicioCelda}
                data-dv-anim="up"
                style={estiloCascada(indice)}
              >
                <div className={styles.servicioNumero}>{String(item.numero).padStart(2, '0')}</div>
                <div className={styles.servicioTitulo}>{item.titulo}</div>
                {item.descripcion && <p className={styles.servicioDescripcion}>{item.descripcion}</p>}
              </div>
            ))}
            <div
              className={styles.servicioCtaCelda}
              data-dv-anim="up"
              style={{ ...estiloCascada(servicios.items.length), gridColumn: `span ${servicios.ctaSpan}` }}
            >
              <p className={styles.servicioCtaFrase}>{servicios.ctaFrase}</p>
              {servicios.whatsappUrl && (
                <a
                  href={servicios.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.servicioCtaEnlace}
                >
                  {servicios.ctaEnlaceTexto}
                </a>
              )}
            </div>
          </div>
        </section>
      ),
    },
    {
      id: 'nosotros',
      etiqueta: 'Nosotros',
      contenido: nosotros && (
        <section className={styles.nosotros}>
          <div className={styles.nosotrosIzquierda}>
            <div className={styles.eyebrow} data-dv-anim="up" style={estiloCascada(0)}>
              Nosotros
            </div>
            <h2 className={styles.nosotrosTitulo} data-dv-anim="up" style={estiloCascada(1)}>
              {nosotros.titulo}
            </h2>
            {nosotros.texto && (
              <p className={styles.nosotrosTexto} data-dv-anim="up" style={estiloCascada(2)}>
                {nosotros.texto}
              </p>
            )}
          </div>

          <div className={styles.nosotrosGrid}>
            {nosotros.imagenes.map((imagen, indice) => (
              <div
                key={indice}
                className={indice === 0 ? `${styles.nosotrosImgCelda} ${styles.nosotrosImgPrincipal}` : styles.nosotrosImgCelda}
                data-dv-anim="up"
                style={estiloCascada(indice + 1)}
              >
                {imagen ? (
                  <Image src={imagen} alt={marca.nombre} fill sizes="(max-width: 767px) 50vw, 25vw" className={styles.fotoImg} />
                ) : (
                  <div className={styles.nosotrosImgPlaceholder} />
                )}
              </div>
            ))}
          </div>
        </section>
      ),
    },
    {
      id: 'contacto',
      etiqueta: 'Contacto',
      contenido: (
        <section className={styles.contacto}>
          <div className={styles.contactoIzquierda}>
            <div className={styles.eyebrow}>Contacto</div>
            <h2 className={styles.contactoTitulo}>Conversemos de tu proyecto</h2>
            {contacto.formularioHabilitado && contacto.telefono && <FormularioContacto telefono={contacto.telefono} />}
          </div>

          <div className={styles.contactoDerecha}>
            <div className={styles.mapaPlaceholder}>
              <div className={styles.mapaPin} />
            </div>
            {(contacto.telefono || contacto.email) && (
              <div className={styles.datosGrid}>
                {contacto.telefono && (
                  <div className={styles.datoCard}>
                    <div className={styles.datoEtiqueta}>Teléfono</div>
                    <div className={styles.datoValor}>{contacto.telefono}</div>
                  </div>
                )}
                {contacto.email && (
                  <div className={styles.datoCard}>
                    <div className={styles.datoEtiqueta}>Correo</div>
                    <div className={styles.datoValor}>{contacto.email}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      ),
    },
  ])

  const marcaSlot = (
    <>
      <span className={styles.marcaInicial}>{marca.inicial}</span>
      <span className={styles.marcaNombre}>{marca.nombre}</span>
    </>
  )

  const accionHeader = inicio.whatsappUrl ? (
    <a href={inicio.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.botonHablemos}>
      Hablemos
    </a>
  ) : undefined

  const pie = (
    <footer className={styles.footer}>
      <div className={styles.footerNombre}>{footer.nombre}</div>
      <div className={styles.footerDatos}>
        {footer.ciudad && <span>{footer.ciudad}</span>}
        {footer.telefono && <span>{footer.telefono}</span>}
        {footer.email && <span>{footer.email}</span>}
      </div>
      <div className={styles.footerCredito}>Hecho con WebBot · Devalpo</div>
    </footer>
  )

  return (
    <div data-template="LANDING" className={instrumentSerif.variable} style={estiloRaiz}>
      <SeccionesSPA secciones={secciones} marca={marcaSlot} accionHeader={accionHeader} pie={pie} className={styles.page} />

      {inicio.whatsappUrl && (
        <a
          href={inicio.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
          className={styles.whatsappFlotante}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a13 13 0 0 1-5.6-4.9c-.4-.6-.9-1.5-.9-2.4 0-.9.5-1.4.7-1.6.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.2.1.4.1.6-.1l.7-.8c.2-.2.3-.2.5-.1l2 .9c.2.1.3.2.3.3v.5Z" />
          </svg>
        </a>
      )}
    </div>
  )
}
