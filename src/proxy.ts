import { NextRequest, NextResponse } from 'next/server'

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'webbot.devalpo.cl'

export function proxy(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const { pathname } = req.nextUrl

  if (host === APP_DOMAIN || host.startsWith('localhost') || host.endsWith('.up.railway.app')) {
    return NextResponse.next()
  }

  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const subdominio = host.replace(`.${BASE_DOMAIN}`, '')

    const url = req.nextUrl.clone()
    url.pathname = `/sites/${subdominio}${pathname}`
    return NextResponse.rewrite(url)
  }

  const url = req.nextUrl.clone()
  url.pathname = `/sites/custom/${host}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)',
  ],
}
