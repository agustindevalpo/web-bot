// Resuelve a dónde lleva el CTA "Quiero mi sitio real" (WB-43). Módulo puro,
// sin leer env: DemoCTA.tsx le pasa NEXT_PUBLIC_MERCADOPAGO_LINK_URL. Mientras la variable
// no esté configurada, el CTA sigue llevando a /login como hasta ahora.

export interface EnlacePago {
  href: string
  externo: boolean
}

export const HREF_PAGO_FALLBACK = '/login'

export function resolverEnlacePago(url: string | undefined): EnlacePago {
  const limpia = url?.trim() ?? ''
  if (limpia.startsWith('https://')) {
    return { href: limpia, externo: true }
  }
  return { href: HREF_PAGO_FALLBACK, externo: false }
}
