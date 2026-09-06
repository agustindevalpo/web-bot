// Herramienta manual de desarrollo (WB-42, design D11) — NO se importa desde
// la app ni se ejecuta en CI. Genera el poster estático que usa HeroDemo
// (slice 2) para la sección de ejemplos reales de la landing, fotografiando
// un sitio de demo con Playwright en un viewport de teléfono.
//
// El tsconfig del proyecto usa module/moduleResolution "bundler" (pensado
// para Next.js), por eso este script se ejecuta con el mismo bootstrap
// ts-node + tsconfig-paths que prisma/seed-demo.ts (ver prisma/seed-register.js):
//
//   node -r ./prisma/seed-register.js scripts/capturar-posters.ts [subdominio] [url]
//
// Sin argumentos, fotografía demo-restaurante contra la URL que resuelve
// construirUrlPreview (local si NEXT_PUBLIC_APP_URL apunta a localhost,
// producción en caso contrario). Un segundo argumento fuerza la URL —
// útil para apuntar directo a producción sin depender del entorno local.
import { chromium } from '@playwright/test'
import { construirUrlPreview } from '@/app/admin/_lib/urlPreview'

const ANCHO_VIEWPORT = 390
const ALTO_VIEWPORT = 844
const ESCALA_DISPOSITIVO = 2

async function capturarPoster(subdominio: string, url: string): Promise<string> {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      viewport: { width: ANCHO_VIEWPORT, height: ALTO_VIEWPORT },
      deviceScaleFactor: ESCALA_DISPOSITIVO,
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    const destino = `public/${subdominio}-poster.png`
    await page.screenshot({ path: destino })
    return destino
  } finally {
    await browser.close()
  }
}

async function main(): Promise<void> {
  const subdominio = process.argv[2] || 'demo-restaurante'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
  const url = process.argv[3] || construirUrlPreview(subdominio, appUrl, baseDomain)

  const destino = await capturarPoster(subdominio, url)
  console.log(`Poster generado: ${destino} (fuente: ${url})`)
}

main().catch((error) => {
  console.error('Error generando el poster:', error)
  process.exit(1)
})
