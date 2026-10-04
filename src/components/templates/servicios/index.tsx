import type { CSSProperties } from 'react'
import Image from 'next/image'
import { TemplateProps } from '@/components/templates/shared/types'
import { buildPaletteStyle } from '@/components/templates/shared/palette'
import SeccionesSPA from '@/components/templates/shared/SeccionesSPA'
import { filtrarSecciones, type SeccionSPA } from '@/components/templates/shared/navegacion'
import HeroBloques from '@/components/templates/shared/HeroBloques'
import Monograma from '@/components/templates/shared/Monograma'
import BandaDatos from '@/components/templates/shared/BandaDatos'
import BloqueNosotros from '@/components/templates/shared/BloqueNosotros'
import FooterBloques from '@/components/templates/shared/FooterBloques'
import FormularioContacto from '@/components/templates/shared/FormularioContacto'
import SeccionContacto from '@/components/templates/shared/SeccionContacto'
import ContactoDatos from '@/components/templates/shared/ContactoDatos'
import ListaServicios from './ListaServicios'
import Lugar from './Lugar'
import { buildLugar } from './datosLugar'
import { getAlmacenamientoArchivos } from '@/infrastructure/container'
import {
  buildMarca,
  buildInicio,
  buildNosotros,
  buildContacto,
  buildHorariosBanda,
  buildListaServicios,
  nombresDeServicios,
  ROTULO_HORARIOS,
} from './sections'
import styles from './Servicios.module.css'

// SERVICIOS sobre el shell de Bloques (S2): mismas piezas que LANDING (header,
// hero, Nosotros, contacto, pie) más la banda de horarios y la lista de
// servicios con precio. Server Component async; los únicos clientes son
// `SeccionesSPA` y el formulario de contacto.
export default async function Servicios({ config }: TemplateProps) {
  // `bloques: true` clampea `--acento` a >= 4.5:1 contra blanco (T2).
  const estiloRaiz: CSSProperties = buildPaletteStyle(config, { bloques: true })

  const marca = buildMarca(config)
  const inicio = buildInicio(config)
  const horarios = buildHorariosBanda(config)
  const lista = buildListaServicios(config)
  // Fotos propias = servidas desde el bucket público de R2; sin R2 configurado
  // (Noop → null) no hay fotos propias y "El lugar" no se renderiza.
  const lugar = buildLugar(config, getAlmacenamientoArchivos().urlPublicaBase())
  const nosotros = buildNosotros(config)
  const contacto = buildContacto(config)
  const formulario =
    contacto.formularioHabilitado && contacto.telefono ? (
      <FormularioContacto telefono={contacto.telefono} servicios={nombresDeServicios(lista)} />
    ) : null

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
            ctaPrimario={inicio.whatsappUrl ? { texto: 'Agenda por WhatsApp', href: inicio.whatsappUrl } : null}
            ctaSecundario={inicio.telUrl ? { texto: `Llamar · ${inicio.telefonoDisplay}`, href: inicio.telUrl } : null}
          />
          {/* Banda de horarios: no es una sección del nav, vive dentro de
              'inicio' tras el hero. Con 0 o más de 3 horarios no renderiza
              (los horarios siguen en la tarjeta de Contacto). */}
          <BandaDatos items={horarios} rotulo={ROTULO_HORARIOS} variante="horarios" />
        </>
      ),
    },
    {
      id: 'servicios',
      etiqueta: 'Servicios',
      // "El lugar" no es una sección del nav (una etiqueta condicional descoloca):
      // vive en el fragmento de "Servicios", tras la lista, igual que la banda
      // de horarios dentro de 'inicio'. Sin lista pero con fotos propias, la
      // sección "Servicios" sigue existiendo para alojarlas.
      contenido:
        lista || lugar ? (
          <>
            {lista && <ListaServicios {...lista} />}
            {lugar && <Lugar {...lugar} />}
          </>
        ) : null,
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
          titulo="Agenda tu hora"
          parrafo={formulario ? 'Elige el servicio y cuéntanos qué día te acomoda: te respondemos por WhatsApp.' : null}
          formulario={formulario}
          datos={<ContactoDatos horarios={contacto.horarios} telefono={contacto.telefono} email={contacto.email} />}
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

  const accionHeader = inicio.whatsappUrl ? (
    <a href={inicio.whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.botonAgenda}>
      Agenda tu hora
    </a>
  ) : undefined

  const pie = <FooterBloques config={config} secciones={secciones.map(({ id, etiqueta }) => ({ id, etiqueta }))} anio={new Date().getFullYear()} />

  return (
    <div data-template="SERVICIOS" style={estiloRaiz}>
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
