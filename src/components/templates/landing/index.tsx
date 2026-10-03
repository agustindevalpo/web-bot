import type { CSSProperties } from 'react'
import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import SeccionesSPA from '@/components/templates/shared/SeccionesSPA'
import { filtrarSecciones, estiloCascada, type SeccionSPA } from '@/components/templates/shared/navegacion'
import HeroBloques from '@/components/templates/shared/HeroBloques'
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

  const eyebrowInicio = [inicio.rubro, inicio.ciudad].filter((valor): valor is string => valor !== null).join(' · ')

  const secciones: SeccionSPA[] = filtrarSecciones([
    {
      id: 'inicio',
      etiqueta: 'Inicio',
      contenido: (
        <>
          <HeroBloques
            eyebrow={eyebrowInicio || null}
            nombre={inicio.nombre}
            descripcion={inicio.descripcion}
            foto={inicio.imagenHero}
            ctaPrimario={inicio.whatsappUrl ? { texto: 'Escribir por WhatsApp', href: inicio.whatsappUrl } : null}
            ctaSecundario={inicio.telUrl ? { texto: `Llamar · ${inicio.telefonoDisplay}`, href: inicio.telUrl } : null}
          />
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
          <div className={servicios.unico ? `${styles.serviciosEncabezado} ${styles.serviciosEncabezadoUnico}` : styles.serviciosEncabezado}>
            <div className={styles.eyebrowServicios}>{servicios.eyebrow}</div>
            {/* `servicios.etiqueta` ("Qué ofrecemos") es el H2 que fija el e2e
                existente (templates_por_sitio.feature: 'la página muestra la
                sección "Qué ofrecemos"' → busca un <h2> con ese texto). Con un
                solo servicio no hay H2 de sección: el nombre del servicio es
                el encabezado (h2 más abajo). */}
            {servicios.etiqueta && <h2 className={styles.serviciosTitulo}>{servicios.etiqueta}</h2>}
          </div>

          {servicios.bandas.map((banda, indice) => {
            const numero = String(banda.numero).padStart(2, '0')
            const claseBanda = [
              styles.banda,
              indice % 2 === 0 ? '' : styles.bandaHueso,
              servicios.unico ? styles.bandaUnica : '',
              servicios.unico && banda.foto ? styles.bandaUnicaFoto : '',
            ]
              .filter(Boolean)
              .join(' ')
            // Sin número en ningún lado con un solo servicio (un "01" sin "02"
            // anuncia una serie que no existe); sin foto tampoco hay celda visual.
            const celdaVisual = servicios.unico ? banda.foto !== null : true
            const Titulo = servicios.unico ? 'h2' : 'h3'
            const claseTitulo = !servicios.unico
              ? styles.bandaTitulo
              : banda.descripcion
                ? styles.bandaTituloUnico
                : `${styles.bandaTituloUnico} ${styles.bandaTituloUnicoSolo}`
            return (
              <div key={`${banda.numero}-${banda.nombre}`} className={claseBanda}>
                {celdaVisual && (
                  <div className={styles.bandaVisual} data-dv-anim="up" style={estiloCascada(0)}>
                    {banda.foto ? (
                      <Image src={banda.foto} alt={banda.nombre} fill sizes="(max-width: 767px) 100vw, 42vw" className={styles.fotoImg} />
                    ) : (
                      <span className={styles.bandaNumeroGigante} aria-hidden="true">
                        {numero}
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.bandaTexto}>
                  {!servicios.unico && (
                    <div className={styles.bandaNumero} data-dv-anim="up" style={estiloCascada(1)}>
                      {numero}
                    </div>
                  )}
                  <Titulo className={claseTitulo} data-dv-anim="up" style={estiloCascada(2)}>
                    {banda.nombre}
                  </Titulo>
                  {banda.descripcion && (
                    <p
                      className={servicios.unico ? styles.bandaDescripcionUnica : styles.bandaDescripcion}
                      data-dv-anim="up"
                      style={estiloCascada(3)}
                    >
                      {banda.descripcion}
                    </p>
                  )}
                  {banda.whatsappUrl && (
                    <a
                      href={banda.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={servicios.unico ? `${styles.bandaEnlace} ${styles.bandaEnlaceUnico}` : styles.bandaEnlace}
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
      <SeccionesSPA
        secciones={secciones}
        marca={marcaSlot}
        accionHeader={accionHeader}
        pie={pie}
        className={styles.page}
        whatsappFlotanteUrl={inicio.whatsappUrl}
      />
    </div>
  )
}
