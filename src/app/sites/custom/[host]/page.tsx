import { sitioRepo } from '@/infrastructure/container'
import { renderizarSitio } from '@/app/sites/renderizarSitio'
import { variantesDominio } from '@/infrastructure/routing/resolverDestino'

// Ruta interna a la que src/proxy.ts reescribe cualquier host que no sea la
// app ni un subdominio de sitios.devalpo.cl (WB-26, dominio propio). El
// `host` llega tal como lo dejó el proxy (ya normalizado cuando viene del
// Worker) y puede venir URL-encoded por el rewrite.
export default async function SitioDominioPropio({
  params,
}: {
  params: Promise<{ host: string }>
}) {
  const { host } = await params

  const sitio = await buscarPorDominio(decodificar(host))

  return renderizarSitio(sitio)
}

function decodificar(host: string): string {
  try {
    return decodeURIComponent(host)
  } catch {
    // Secuencia % inválida: se busca con el valor crudo y, si no existe,
    // renderizarSitio responde 404.
    return host
  }
}

// Se intenta primero el dominio exacto y, si empieza con `www.`, también sin
// el prefijo: el cliente puede haber registrado `panaderia.cl` en el Sitio y
// apuntar solo `www` a Cloudflare (ver docs/DOMINIO_PROPIO.md).
async function buscarPorDominio(dominio: string) {
  for (const candidato of variantesDominio(dominio)) {
    const sitio = await sitioRepo.findByDominioPropio(candidato)
    if (sitio) return sitio
  }
  return null
}
