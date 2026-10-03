import type { CSSProperties } from 'react'
import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import SeccionesSPA from '@/components/templates/shared/SeccionesSPA'
import { filtrarSecciones, estiloCascada, type SeccionSPA } from '@/components/templates/shared/navegacion'
import { tramoDisplay, type TramoDisplay } from '@/components/templates/shared/displayHero'
import Monograma from '@/components/templates/shared/Monograma'
import BandaDatos from '@/components/templates/shared/BandaDatos'
import BloqueNosotros from '@/components/templates/shared/BloqueNosotros'
import { buildMarca, buildInicio, buildDestacados, buildServicios, buildNosotros, buildContacto } from './sections'
import FooterBloques from '@/components/templates/shared/FooterBloques'
import FormularioContacto from '@/components/templates/shared/FormularioContacto'
import SeccionContacto from '@/components/templates/shared/SeccionContacto'
import ContactoDatos from '@/components/templates/shared/ContactoDatos'
import styles from './Landing.module.css'

// Primer consumidor de `SeccionesSPA` (S0a, sin importador hasta acá) y de
// `clampAcento` (S0b, ídem). Server Component async — el único cliente de
// esta plantilla es `SeccionesSPA` (el switch de secciones) más el
// formulario de contacto (`FormularioContacto`), que no convierte el resto
// del árbol a cliente (README.md, "Implicancia arquitectónica").
const CLASE_TRAMO: Record<TramoDisplay, string> = {
  grande: styles.tramoGrande,
  medio: styles.tramoMedio,
  chico: styles.tramoChico,
}

export default async function Landing({ config }: TemplateProps) {
  // Con `bloques: true`, `buildPaletteStyle` emite `--acento` clampeado a
  // >= 4.5:1 contra blanco (T2): LANDING no clampea por su cuenta.
  const estiloRaiz: CSSProperties = buildPaletteStyle(config, { bloques: true })

  const marca = buildMarca(config)
  const inicio = buildInicio(config)
  const destacados = buildDestacados(config)
  const servicios = buildServicios(config)
  const nosotros = buildNosotros(config)
  const contacto = buildContacto(config)
  const formulario = contacto.formularioHabilitado && contacto.telefono ? <FormularioContacto telefono={contacto.telefono} /> : null

  const tramo = tramoDisplay(inicio.nombre)
  const eyebrowInicio = [inicio.rubro, inicio.ciudad].filter((valor): valor is string => valor !== null).join(' · ')

  const secciones: SeccionSPA[] = filtrarSecciones([
    {
      id: 'inicio',
      etiqueta: 'Inicio',
      contenido: (
        <>
          <section className={inicio.imagenHero ? styles.inicio : `${styles.inicio} ${styles.inicioSinFoto}`}>
            <div className={styles.inicioIzquierda}>
              {eyebrowInicio && (
                <div className={styles.eyebrowHero} data-dv-anim="up" style={estiloCascada(0)}>
                  {eyebrowInicio}
                </div>
              )}
              <h1 className={`${styles.inicioTitulo} ${CLASE_TRAMO[tramo.tramo]}`} data-dv-anim="up" style={estiloCascada(1)}>
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
            </div>

            {inicio.imagenHero && (
              <div className={styles.inicioFoto}>
                <Image src={inicio.imagenHero} alt={inicio.nombre} fill sizes="(max-width: 767px) 100vw, 50vw" className={styles.fotoImg} priority />
              </div>
            )}
          </section>
          {/* Banda de cifras (U5): no es una sección del nav, vive dentro de
              'inicio' justo después del hero. Sin destacados no renderiza. */}
          <BandaDatos items={destacados.map(({ valor, etiqueta }) => ({ valor, etiqueta }))} />
        </>
      ),
    },
    {
      id: 'servicios',
      etiqueta: 'Servicios',
      contenido: servicios && (
        <section>
          <div className={styles.serviciosEncabezado}>
            <div className={styles.eyebrowServicios}>Servicios</div>
            {/* `servicios.etiqueta` ("Qué ofrecemos") es el H2 que fija el e2e
                existente (templates_por_sitio.feature: 'la página muestra la
                sección "Qué ofrecemos"' → busca un <h2> con ese texto). */}
            <h2 className={styles.serviciosTitulo}>{servicios.etiqueta}</h2>
          </div>

          {servicios.bandas.map((banda, indice) => {
            const numero = String(banda.numero).padStart(2, '0')
            return (
              <div
                key={`${banda.numero}-${banda.nombre}`}
                className={indice % 2 === 0 ? styles.banda : `${styles.banda} ${styles.bandaHueso}`}
              >
                <div className={styles.bandaVisual} data-dv-anim="up" style={estiloCascada(0)}>
                  {banda.foto ? (
                    <Image src={banda.foto} alt={banda.nombre} fill sizes="(max-width: 767px) 100vw, 42vw" className={styles.fotoImg} />
                  ) : (
                    <span className={styles.bandaNumeroGigante} aria-hidden="true">
                      {numero}
                    </span>
                  )}
                </div>
                <div className={styles.bandaTexto}>
                  <div className={styles.bandaNumero} data-dv-anim="up" style={estiloCascada(1)}>
                    {numero}
                  </div>
                  <h3 className={styles.bandaTitulo} data-dv-anim="up" style={estiloCascada(2)}>
                    {banda.nombre}
                  </h3>
                  {banda.descripcion && (
                    <p className={styles.bandaDescripcion} data-dv-anim="up" style={estiloCascada(3)}>
                      {banda.descripcion}
                    </p>
                  )}
                  {banda.whatsappUrl && (
                    <a
                      href={banda.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.bandaEnlace}
                      data-dv-anim="up"
                      style={estiloCascada(4)}
                    >
                      {servicios.enlaceTexto}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      ),
    },
    {
      id: 'nosotros',
      etiqueta: 'Nosotros',
      contenido: <BloqueNosotros {...nosotros} />,
    },
    {
      id: 'contacto',
      etiqueta: 'Contacto',
      contenido: (
        <SeccionContacto
          titulo="Conversemos de tu proyecto"
          parrafo={formulario ? 'Cuéntanos qué necesitas y te respondemos por WhatsApp.' : null}
          formulario={formulario}
          datos={<ContactoDatos horarios={contacto.horarios} telefono={contacto.telefono} email={contacto.email} />}
        />
      ),
    },
  ])

  // Regla 04 del handoff (bloque 3c): cuando llega el logo, ocupa el mismo
  // espacio que el monograma — nada más se mueve alrededor. `.marcaLogoImg`
  // deja que el ancho siga la proporción del logo, sin recortarlo ni
  // deformarlo. Con `logoDimensiones` el servidor calcula los altos ópticos
  // (regla T3, `shared/logoOptico.ts`) y llegan como `--logo-alto` /
  // `--logo-alto-movil`; sin ellas, 44px / 34px de siempre. Un logotipo
  // (proporción >= 1.6) reemplaza también al nombre visible; el `alt` lo
  // conserva. Sin logo, `Monograma` (Sans pesado, T4) ocupa
  // ese mismo slot derivado de `marca.iniciales`.
  const marcaSlot = (
    <>
      {marca.logo ? (
        <Image
          src={marca.logo}
          alt={marca.nombre}
          width={marca.logoDimensiones?.ancho ?? 180}
          height={marca.logoDimensiones?.alto ?? 44}
          sizes="180px"
          className={styles.marcaLogoImg}
          style={
            marca.logoAltos
              ? ({ '--logo-alto': `${marca.logoAltos.escritorio}px`, '--logo-alto-movil': `${marca.logoAltos.movil}px` } as CSSProperties)
              : undefined
          }
        />
      ) : (
        <Monograma iniciales={marca.iniciales} />
      )}
      {marca.mostrarNombre && <span className={styles.marcaNombre}>{marca.nombre}</span>}
    </>
  )

  const accionHeader = inicio.whatsappUrl ? (
    <a href={inicio.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.botonHablemos}>
      Hablemos
    </a>
  ) : undefined

  // Mismas secciones que el nav: el pie las lista tal cual.
  const pie = <FooterBloques config={config} secciones={secciones.map(({ id, etiqueta }) => ({ id, etiqueta }))} anio={new Date().getFullYear()} />


  return (
    <div data-template="LANDING" style={estiloRaiz}>
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
