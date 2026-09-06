import { NextRequest, NextResponse } from 'next/server'
import { resolverDestino } from '@/infrastructure/routing/resolverDestino'

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'webbot.devalpo.cl'

// Adaptador delgado: toda la clasificación del host vive en resolverDestino
// (pura, con tests unitarios). Las cabeceras X-Forwarded-Host y
// X-WebBot-Worker-Secret las agrega el Worker de Cloudflare
// (infra/cloudflare/worker) para los dominios propios de clientes (WB-26);
// en dev local WORKER_SHARED_SECRET va vacío y la cabecera se acepta tal cual.
export function proxy(req: NextRequest) {
  const destino = resolverDestino({
    host: req.headers.get('host'),
    forwardedHost: req.headers.get('x-forwarded-host'),
    secretRecibido: req.headers.get('x-webbot-worker-secret'),
    secretEsperado: process.env.WORKER_SHARED_SECRET,
    baseDomain: BASE_DOMAIN,
    appDomain: APP_DOMAIN,
    pathname: req.nextUrl.pathname,
  })

  if (destino.tipo === 'app') {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = destino.rutaInterna
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)',
  ],
}
