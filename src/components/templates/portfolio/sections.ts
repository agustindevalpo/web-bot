import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { buildWhatsAppUrl, buildTelUrl, buildInstagramUrl, buildMailtoUrl } from '@/components/templates/shared/enlaces'

// Constructores puros de props por sección (Decisión D4 en design.md) —
// ninguno hace fetch ni toca el DOM, todos toleran un config que solo trae
// `{ nombre }` (fixture del e2e existente, Hard constraint D4) sin lanzar.
// PORTFOLIO no usa imagen de fondo en el hero (identidad "dark editorial",
// D6): toda la fotografía vive en el grid de Trabajos, imagen-primero.

export type HeroProps = {
  rubro: string | null
  nombre: string
  descripcion: string | null
  whatsappUrl: string | null
  telUrl: string | null
  telefonoDisplay: string | null
  highlight: string | null
}

export type AboutProps = { texto: string }

export type TrabajoItem = { imagen: string; texto: string | null }

export type TrabajosProps = { etiqueta: string; items: TrabajoItem[] }

export type ContactoSeccionProps = {
  telefono: string | null
  email: string | null
  formularioHabilitado: boolean
  mailtoUrl: string | null
}

export type FooterProps = {
  ciudad: string | null
  telefono: string | null
  email: string | null
  instagramUrl: string | null
  instagramHandle: string | null
  facebook: string | null
}

const ETIQUETA_TRABAJOS = 'Trabajos'

export function buildHero(config: SiteConfigDTO): HeroProps {
  const telefono = config.contacto?.telefono || null
  const rubro = config.rubro && config.rubro !== 'demo' ? config.rubro.toUpperCase() : null

  return {
    rubro,
    nombre: config.nombre,
    descripcion: config.descripcion || null,
    whatsappUrl: telefono ? buildWhatsAppUrl(telefono) : null,
    telUrl: telefono ? buildTelUrl(telefono) : null,
    telefonoDisplay: telefono,
    highlight: config.highlight || null,
  }
}

export function buildAbout(config: SiteConfigDTO): AboutProps | null {
  const texto = config.sobreNosotros || config.descripcion
  return texto ? { texto } : null
}

// Grid "gallery-first" (D6): la fotografía manda. Cada imagen es un ítem del
// grid y se empareja con el texto de `servicios` en el mismo índice como
// leyenda opcional — una imagen sin leyenda igual entra al grid.
export function buildTrabajos(config: SiteConfigDTO): TrabajosProps | null {
  const imagenes = config.imagenes ?? []
  if (imagenes.length === 0) return null

  const servicios = config.servicios ?? []
  const items: TrabajoItem[] = imagenes.map((imagen, indice) => ({
    imagen,
    texto: servicios[indice] ?? null,
  }))

  return { etiqueta: ETIQUETA_TRABAJOS, items }
}

export function buildContacto(config: SiteConfigDTO): ContactoSeccionProps {
  const telefono = config.contacto?.telefono || null
  const email = config.contacto?.email || null
  const formulario = config.contacto?.formulario
  const formularioHabilitado = formulario ? formulario.habilitado : true
  const destinatarioEmail = formulario?.destinatarioEmail || email

  return {
    telefono,
    email,
    formularioHabilitado,
    mailtoUrl: destinatarioEmail ? buildMailtoUrl(destinatarioEmail) : null,
  }
}

export function buildFooter(config: SiteConfigDTO): FooterProps {
  const instagram = config.redes?.instagram || null

  return {
    ciudad: config.ciudad || null,
    telefono: config.contacto?.telefono || null,
    email: config.contacto?.email || null,
    instagramUrl: instagram ? buildInstagramUrl(instagram) : null,
    instagramHandle: instagram,
    facebook: config.redes?.facebook || null,
  }
}
