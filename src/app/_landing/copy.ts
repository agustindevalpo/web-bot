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

// Precio, "por qué Devalpo", FAQ y CTA final (slice 3) — ver design
// Interfaces/Contracts y la sección "Copy" (obs #300 rev2). Los montos
// dinámicos (precio de lanzamiento, cupos restantes) los calcula page.tsx a
// partir de `_landing/precios.ts`; acá solo va el texto fijo.

export const PRECIO = {
  titulo: 'Un pago. Un sitio. Sin mensualidades.',
  nombreTarjeta: 'Sitio web de una página',
  etiquetaPagoUnico: 'pago único',
  incluye: [
    'Diseño con los datos de tu negocio',
    'Tu dominio configurado (.cl o .com)',
    'Hosting y certificado SSL el primer año',
    'Textos e imágenes listos para publicar',
    'Una ronda de ajustes antes de publicar',
  ],
  lanzamiento: {
    prefijo: 'Precio de lanzamiento',
    primeros: 'para los primeros 10',
    cupos: (restantes: number) => `quedan ${restantes} cupos`,
  },
  agotado: {
    etiqueta: 'Cupos agotados',
    nota: (precioNormal: string) => `precio normal ${precioNormal}`,
  },
  letraChica:
    'Sitio de varias páginas: $249.990. Renovación anual de dominio y hosting: $39.990 desde el segundo año.',
  cta: { label: 'Ver mi sitio gratis', href: '/chat' } satisfies EnlaceCta,
}

export const POR_QUE_DEVALPO = {
  titulo: 'Por qué trabajar con nosotros',
  puntos: [
    {
      titulo: 'Somos de Valparaíso',
      desc: 'Hablas con una persona, no con un ticket. Coordinamos por WhatsApp y respondemos el mismo día.',
    },
    {
      titulo: 'Lo publicamos nosotros',
      desc: 'Nos hacemos cargo del dominio, el hosting y el certificado. Tú revisas y apruebas.',
    },
    {
      titulo: '¿Te piden un sitio web?',
      desc: 'Si estás activando Webpay o Mercado Pago y te piden un sitio, te lo entregamos con lo que exige la ley chilena del consumidor: datos del negocio, contacto, descripción y precios, y tus términos y condiciones.',
    },
  ],
}

// Exactamente 6 preguntas (R9): cada tema requerido aparece una sola vez. El
// orden prioriza al lector (una FAQ de landing no debería abrir con la
// facturación del segundo año) — ver design, sección "FAQ".
export const FAQ = {
  titulo: 'Preguntas frecuentes',
  items: [
    {
      q: '¿Qué incluye el precio?',
      a: 'El diseño del sitio con los datos de tu negocio, tu dominio configurado, el hosting y el certificado SSL del primer año, los textos e imágenes listos para publicar y una ronda de ajustes antes de publicar. Es un pago único: no hay mensualidad.',
    },
    {
      q: '¿Cuánto tarda?',
      a: 'Un día hábil desde que recibimos tu pago, siempre que ya nos hayas entregado la información de tu negocio. Si el dominio es nuevo, su registro puede tardar algunas horas adicionales en propagarse.',
    },
    {
      q: '¿Y si ya tengo dominio?',
      a: 'Sirve igual. Si ya tienes un dominio registrado, lo configuramos para que apunte a tu sitio nuevo; solo necesitamos acceso al panel donde lo registraste. El dominio queda a nombre de tu negocio y sigue siendo tuyo, trabajes con nosotros o no.',
    },
    {
      q: '¿Puedo pedir cambios?',
      a: 'Sí. Antes de publicar tienes una ronda de ajustes incluida: si el sitio no te convence, lo corregimos. Después de publicado nos escribes los cambios de textos, fotos o datos de contacto y los aplicamos durante el primer año.',
    },
    {
      q: '¿Necesito saber de tecnología?',
      a: 'No. Conversas con el bot, revisas el sitio y nosotros nos encargamos del dominio, el hosting y el certificado. Si prefieres hablar con una persona, coordinamos por WhatsApp.',
    },
    {
      q: '¿Qué pasa desde el segundo año?',
      a: 'Desde el segundo año se cobra una renovación anual de $39.990 que cubre el hosting y el dominio por doce meses más. Es el único cobro recurrente y te avisamos antes de que venza.',
    },
  ],
}

export const CTA_FINAL = {
  titulo: 'Tu sitio puede estar publicado mañana.',
  subtitulo: 'Empieza la conversación ahora. No pagas nada hasta ver tu sitio listo.',
  cta: { label: 'Ver mi sitio gratis', href: '/chat' } satisfies EnlaceCta,
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
