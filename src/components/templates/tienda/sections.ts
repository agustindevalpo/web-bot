import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { buildWhatsAppUrl, buildTelUrl, buildInstagramUrl, buildMailtoUrl } from '@/components/templates/shared/enlaces'

// Constructores puros de props por sección (Decisión D4 en design.md) —
// ninguno hace fetch ni toca el DOM, todos toleran un config que solo trae
// `{ nombre }` (fixture del e2e existente, Hard constraint D4) sin lanzar.
// TIENDA usa la primera imagen como banner del header compacto (igual que
// RESTAURANTE con su hero) y el resto como grid de productos, cada card con
// su propio CTA de WhatsApp (Decisión D6: "3-up product card grid with
// per-card WhatsApp CTA"). Contacto expone whatsappUrl además del form, para
// la barra de contacto sticky (solo CSS, sin JS).

export type HeroProps = {
  rubro: string | null
  imagenHero: string | null
  nombre: string
  descripcion: string | null
  whatsappUrl: string | null
  telUrl: string | null
  telefonoDisplay: string | null
  highlight: string | null
}

export type AboutProps = { texto: string }

export type ProductoItem = { imagen: string; texto: string | null; whatsappUrl: string | null }

export type ProductosProps = { etiqueta: string; items: ProductoItem[] }

export type ContactoSeccionProps = {
  telefono: string | null
  email: string | null
  formularioHabilitado: boolean
  mailtoUrl: string | null
  whatsappUrl: string | null
}

export type FooterProps = {
  ciudad: string | null
  telefono: string | null
  email: string | null
  instagramUrl: string | null
  instagramHandle: string | null
  facebook: string | null
}

const ETIQUETA_PRODUCTOS = 'Productos'

export function buildHero(config: SiteConfigDTO): HeroProps {
  const telefono = config.contacto?.telefono || null
  const [imagenHero] = config.imagenes ?? []
  const rubro = config.rubro && config.rubro !== 'demo' ? config.rubro.toUpperCase() : null

  return {
    rubro,
    imagenHero: imagenHero ?? null,
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

// Grid 3-up (D6): excluye la primera imagen (usada en el banner del header)
// y empareja el resto con `servicios` en el mismo índice como nombre de
// producto opcional — una imagen sin nombre igual entra al grid, igual que
// `buildGaleria`/`buildTrabajos` en los otros templates. Cada card lleva su
// propio CTA de WhatsApp, construido desde el mismo teléfono del sitio.
export function buildProductos(config: SiteConfigDTO): ProductosProps | null {
  const [, ...resto] = config.imagenes ?? []
  if (resto.length === 0) return null

  const servicios = config.servicios ?? []
  const telefono = config.contacto?.telefono || null
  const whatsappUrl = telefono ? buildWhatsAppUrl(telefono) : null

  const items: ProductoItem[] = resto.map((imagen, indice) => ({
    imagen,
    texto: servicios[indice] ?? null,
    whatsappUrl,
  }))

  return { etiqueta: ETIQUETA_PRODUCTOS, items }
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
    whatsappUrl: telefono ? buildWhatsAppUrl(telefono) : null,
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
