// Copy público de la landing (WB-42), como datos puros — ver design D5. Nada
// de texto va inline en JSX: page.tsx solo renderiza lo que se exporta acá,
// así la regla de frases prohibidas (R8) se prueba con un test unitario en
// vez de depender de una revisión manual.
//
// Esta primera parte cubre nav, hero, la intro de "ejemplos reales" y "cómo
// funciona" (slice 2). Precio, "por qué Devalpo", FAQ y el CTA final se
// agregan en el slice 3.

interface EnlaceCta {
  label: string
  href: string
}

export const NAV = {
  ejemplos: { label: 'Ejemplos', href: '#ejemplos' } satisfies EnlaceCta,
  comoFunciona: { label: 'Cómo funciona', href: '#como-funciona' } satisfies EnlaceCta,
  precio: { label: 'Precio', href: '#precio' } satisfies EnlaceCta,
  preguntas: { label: 'Preguntas', href: '#faq' } satisfies EnlaceCta,
  cta: { label: 'Ver mi sitio gratis', href: '/chat' } satisfies EnlaceCta,
}

export const HERO = {
  badge: 'DEVALPO · VALPARAÍSO',
  titulo: 'Tu sitio web listo en 1 día. Con tu dominio. Pago único.',
  subtitulo:
    'Cuéntanos de tu negocio en un chat, revisas tu sitio y lo publicamos en tu propio dominio. Sin mensualidades ni contratos.',
  ctaPrimario: { label: 'Ver mi sitio gratis', href: '/chat' } satisfies EnlaceCta,
  ctaSecundario: { label: 'Ver ejemplos reales', href: '#ejemplos' } satisfies EnlaceCta,
  confianza: ['Pago único', 'Publicado en 1 día hábil', 'Dominio a tu nombre'],
  demo: {
    etiqueta: 'Sitio real publicado',
    botonAbrir: 'Ver el sitio funcionando',
    enlaceVerEnVivo: 'Ver en vivo →',
  },
}

export const EJEMPLOS_INTRO = {
  titulo: 'Sitios que ya están publicados',
  subtitulo: 'Son sitios reales en línea, no maquetas. Ábrelos y revísalos.',
  linkTarjeta: 'Ver sitio →',
}

export const COMO_FUNCIONA = {
  titulo: 'Tres pasos, sin vueltas',
  pasos: [
    {
      n: 1,
      titulo: 'Conversas con el bot',
      desc: 'Nos cuentas qué haces, tus servicios y tus datos de contacto.',
    },
    {
      n: 2,
      titulo: 'Revisas tu sitio',
      desc: 'Te mostramos el sitio armado antes de que pagues.',
    },
    {
      n: 3,
      titulo: 'Pagas y queda publicado',
      desc: 'Lo dejamos en línea con tu dominio en un día hábil.',
    },
  ],
}

// Unión de las 4 frases exigidas por R8 (spec obs #299) y las heredadas de la
// revisión 1, ya en minúsculas y sin tildes — ver design D-copy (obs #300,
// Interfaces/Contracts). `contieneFraseProhibida` normaliza ambos lados antes
// de comparar, así que estas entradas deben quedar ya normalizadas acá.
export const FRASES_PROHIBIDAS = [
  'te aprueban',
  'garantizamos la aprobacion',
  'aprobacion garantizada',
  'las paginas que te piden para aprobarte',
  'integracion con webpay',
  'checklist de transbank',
  'requisitos de transbank',
  'aprobado por transbank',
  'cumple con transbank',
  'certificado por mercado pago',
]

const MARCAS_DIACRITICAS = /[̀-ͯ]/g

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(MARCAS_DIACRITICAS, '')
}

/**
 * Guarda de contenido: `true` si `texto` contiene, sin distinguir mayúsculas
 * ni tildes, alguna de las frases de `FRASES_PROHIBIDAS` (R8).
 */
export function contieneFraseProhibida(texto: string): boolean {
  const normalizado = normalizar(texto)
  return FRASES_PROHIBIDAS.some((frase) => normalizado.includes(frase))
}
