import type { NextConfig } from "next";

// Fotos de los sitios de cliente (config.imagenes, config.logo,
// config.imagenHero): Unsplash para el seed de demo, más el host público de
// R2 (subida de imágenes desde /admin, ver
// odd/tasks/subida-imagenes-admin.md) cuando R2_PUBLIC_URL está configurada.
// Sin la env var no se agrega el segundo pattern — R2AlmacenamientoArchivos
// tampoco se activa sin ella (ver container.ts), así que no hace falta.
export function remotePatternsImagenes(): NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> {
  const patterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [
    { hostname: 'images.unsplash.com' },
  ]

  const urlPublicaR2 = process.env.R2_PUBLIC_URL
  if (urlPublicaR2) {
    try {
      const url = new URL(urlPublicaR2)
      patterns.push({ protocol: url.protocol.replace(':', '') as 'http' | 'https', hostname: url.hostname })
    } catch {
      // R2_PUBLIC_URL mal formada: se ignora en vez de romper el boot: el
      // admin va a ver los uploads fallar recién al intentar usarlos.
    }
  }

  return patterns
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: remotePatternsImagenes(),
  },
  experimental: {
    // Los uploads de imagen (logo/hero/galería) van como multipart en el
    // body del Server Action; el default de 1 MB se queda corto para un
    // archivo de hasta 5 MB (ver Decisión 2026-09-27 del feature de subida
    // de imágenes). 6mb deja margen para el overhead de multipart.
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
