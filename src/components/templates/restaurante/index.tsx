import type { CSSProperties, ReactNode } from 'react'
import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import SeccionesSPA from '@/components/templates/shared/SeccionesSPA'
import { filtrarSecciones, type SeccionSPA } from '@/components/templates/shared/navegacion'
import Monograma from '@/components/templates/shared/Monograma'
import BandaDatos from '@/components/templates/shared/BandaDatos'
import BloqueNosotros from '@/components/templates/shared/BloqueNosotros'
import FooterBloques from '@/components/templates/shared/FooterBloques'
import SeccionContacto from '@/components/templates/shared/SeccionContacto'
import ContactoDatos from '@/components/templates/shared/ContactoDatos'
import Lugar from '@/components/templates/servicios/Lugar'
import { getAlmacenamientoArchivos } from '@/infrastructure/container'
import { soloDigitos } from '@/components/templates/shared/enlaces'
import Carta from './Carta'
import FormReserva from './FormReserva'
import HeroRestaurante from './HeroRestaurante'
import { copyReserva } from './copy'
import {
  buildMarca,
  buildInicio,
  buildNosotros,
  buildContacto,
  buildHorariosBanda,
  buildCarta,
  buildLocal,
  buildDatosHero,
  buildAccionesHero,
  fotoHeroPropia,
  ubicacionLocal,
  ROTULO_HORARIOS,
} from './sections'
import styles from './Restaurante.module.css'

const ID_TITULO_RESERVAS = 'reservas-titulo'

// RESTAURANTE sobre el shell de Bloques (S4): las mismas piezas que LANDING y
// SERVICIOS (header, Nosotros, contacto, pie, banda de horarios) más la carta
// tipográfica y el hero con dos formas. Server Component async; los únicos
// clientes son `SeccionesSPA` y el formulario de reserva (`FormReserva`).
export default async function Restaurante({ config }: TemplateProps) {
  // `bloques: true` clampea `--acento` a >= 4.5:1 contra blanco (T2).
  const estiloRaiz: CSSProperties = buildPaletteStyle(config, { bloques: true })
  // Fotos propias = servidas desde el bucket público de R2; sin R2 configurado
  // (Noop → null) no hay fotos propias: hero tipográfico y sin "El local".
  const urlPublica = getAlmacenamientoArchivos().urlPublicaBase()

  const copy = copyReserva(config.rubro)
  const marca = buildMarca(config)
  const inicio = buildInicio(config)
  const horarios = buildHorariosBanda(config)
  const carta = buildCarta(config)
  const local = buildLocal(config, urlPublica)
  const ubicacion = ubicacionLocal(carta !== null, local !== null)
  const nosotros = buildNosotros(config)
  const contacto = buildContacto(config)
  const acciones = buildAccionesHero(config, carta, copy)

  // Sin teléfono utilizable no hay formulario (no hay a dónde abrir WhatsApp):
  // la columna izquierda lleva el título y la invitación a escribir por correo.
  const formulario: ReactNode = soloDigitos(contacto.telefono ?? '') ? (
    <FormReserva telefono={contacto.telefono ?? ''} copy={copy} tituloId={ID_TITULO_RESERVAS} />
  ) : null
  const parrafo = formulario ? copy.parrafo : copy.sinTelefono

  const eyebrowInicio = [inicio.rubro, inicio.ciudad].filter((valor): valor is string => valor !== null).join(' · ')

  const secciones: SeccionSPA[] = filtrarSecciones([
    {
      id: 'inicio',
      etiqueta: 'Inicio',
      contenido: (
        <>
          <HeroRestaurante
            eyebrow={eyebrowInicio || null}
            nombre={inicio.nombre}
            descripcion={inicio.descripcion}
            foto={fotoHeroPropia(config.imagenes, urlPublica)}
            datos={buildDatosHero(config, carta, copy)}
            primaria={acciones.primaria}
            secundaria={acciones.secundaria}
          />
          {/* Banda de horarios: no es una sección del nav, vive dentro de
              'inicio' tras el hero. Con 0 o más de 3 horarios no renderiza
              (los horarios siguen en la tarjeta de Reservas). */}
          <BandaDatos items={horarios} rotulo={ROTULO_HORARIOS} variante="horarios" />
          {local && ubicacion === 'inicio' && <Lugar {...local} />}
        </>
      ),
    },
    {
      id: 'carta',
      etiqueta: 'Carta',
      // "El local" no es una sección del nav (una etiqueta condicional descoloca):
      // vive en el fragmento de "Carta", tras ella. Sin carta, ver `ubicacionLocal`.
      contenido: carta ? (
        <>
          <Carta carta={carta} />
          {local && ubicacion === 'carta' && <Lugar {...local} />}
        </>
      ) : null,
    },
    {
      id: 'nosotros',
      etiqueta: 'Nosotros',
      contenido: <BloqueNosotros {...nosotros} />,
    },
    {
      // El ancla es siempre `#reservas`; la etiqueta cambia con el rubro
      // ("Encargos" en panadería, P3).
      id: 'reservas',
      etiqueta: copy.etiquetaNav,
      contenido: (
        <SeccionContacto
          eyebrow={copy.eyebrow}
          titulo={copy.titulo}
          tituloId={ID_TITULO_RESERVAS}
          parrafo={parrafo}
          formulario={formulario}
          datos={<ContactoDatos horarios={contacto.horarios} telefono={contacto.telefono} email={contacto.email} direccion={contacto.direccion} variante="reserva" />}
        />
      ),
    },
  ])

  // Logo del cliente en el mismo espacio que ocupa el monograma (regla 04); un
  // logotipo (proporción >= 1.6) reemplaza también al nombre visible.
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

  // El CTA del header lleva al formulario de la misma página, no a WhatsApp.
  const accionHeader = (
    <a href="#reservas" className={styles.botonReservar}>
      {copy.ctaHeader}
    </a>
  )

  const pie = <FooterBloques config={config} secciones={secciones.map(({ id, etiqueta }) => ({ id, etiqueta }))} anio={new Date().getFullYear()} glosaConPreposicion />

  return (
    <div data-template="RESTAURANTE" style={estiloRaiz}>
      <SeccionesSPA
        secciones={secciones}
        marca={marcaSlot}
        accionHeader={accionHeader}
        pie={pie}
        className={styles.page}
        whatsappFlotanteUrl={inicio.whatsappUrl}
        seccionOcultaFlotante="reservas"
      />
    </div>
  )
}
