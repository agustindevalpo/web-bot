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
  logoLabel: 'Devalpo, inicio',
  navLabel: 'Secciones',
}

const HERO_TITULO = {
  antes: 'Tu sitio web listo',
  destacado: 'en 1 día.',
  despues: 'Con tu dominio. Pago único.',
}

export const HERO = {
  badge: { marca: 'DEVALPO', texto: 'Hecho en Valparaíso' },
  // El H1 se parte para subrayar `destacado`; `titulo` es el texto plano completo.
  tituloPartes: HERO_TITULO,
  titulo: `${HERO_TITULO.antes} ${HERO_TITULO.destacado} ${HERO_TITULO.despues}`,
  subtitulo:
    'Cuéntanos de tu negocio en un chat, revisas tu sitio y lo publicamos en tu propio dominio. Sin mensualidades ni contratos.',
  ctaPrimario: { label: 'Ver mi sitio gratis', href: '/chat' } satisfies EnlaceCta,
  ctaSecundario: { label: 'Ver ejemplos reales', href: '#ejemplos' } satisfies EnlaceCta,
  confianza: ['Pago único', 'Publicado en 1 día hábil', 'Dominio a tu nombre'],
}

// Franja de beneficios bajo el hero (se duplica para el bucle del marquee).
export const BENEFICIOS_LABEL = 'Lo que incluye'
export const BENEFICIOS = [
  'Pago único',
  'Publicado en 1 día hábil',
  'Dominio a tu nombre',
  'Hosting y SSL el primer año',
  'Una ronda de ajustes',
  'Hecho en Chile',
]

// Diálogo ilustrativo de la tarjeta de chat flotante del hero.
export interface MensajeChat {
  quien: 'bot' | 'persona'
  texto: string
}

export const HERO_CHAT = {
  nombre: 'WebBot',
  enLinea: 'en línea',
  guion: [
    { quien: 'bot', texto: '¡Hola! ¿Cómo se llama tu negocio?' },
    { quien: 'persona', texto: 'El Rincón del Sabor' },
    { quien: 'bot', texto: '¿A qué se dedica?' },
    { quien: 'persona', texto: 'Comida chilena casera' },
    { quien: 'bot', texto: 'Listo. Estoy armando tu sitio…' },
  ] satisfies MensajeChat[],
}

// Mini-maquetas de la ventana del hero: los tres sitios demo reales, con los
// datos de prisma/seed-demo.ts (nombre, color de acento, servicios, destacado).
export type Maqueta =
  | {
      tipo: 'carta'
      subdominio: string
      iniciales: string
      nombre: string
      titulo: string[]
      descripcion: string
      cta: string
      acento: string
      textoAcento: string
      etiqueta: string
      filas: { texto: string; valor?: string }[]
    }
  | {
      tipo: 'catalogo'
      subdominio: string
      iniciales: string
      nombre: string
      titulo: string[]
      descripcion: string
      cta: string
      acento: string
      textoAcento: string
      productos: string[]
      pie: string
    }
  | {
      tipo: 'servicios'
      subdominio: string
      iniciales: string
      nombre: string
      titulo: string[]
      descripcion: string
      cta: string
      acento: string
      textoAcento: string
      servicios: string[]
      franja: { etiqueta: string; valor: string }
    }

export const HERO_MAQUETAS: Maqueta[] = [
  {
    tipo: 'carta',
    subdominio: 'demo-restaurante',
    iniciales: 'RS',
    nombre: 'El Rincón del Sabor',
    titulo: ['El Rincón', 'del Sabor'],
    descripcion: 'Comida casera chilena con ingredientes frescos del mercado.',
    cta: 'Reservar mesa',
    acento: '#FF6B35',
    textoAcento: '#ffffff',
    etiqueta: 'LA CARTA',
    filas: [
      { texto: 'Menú del día', valor: '$4.500' },
      { texto: 'Almuerzo ejecutivo' },
      { texto: 'Cenas y eventos privados' },
    ],
  },
  {
    tipo: 'catalogo',
    subdominio: 'demo-tienda',
    iniciales: 'LN',
    nombre: 'Boutique Luna Nueva',
    titulo: ['Moda femenina,', 'del XS al XXL'],
    descripcion: 'Diseños exclusivos con despacho a todo Chile.',
    cta: 'Ver catálogo',
    acento: '#F39C12',
    textoAcento: '#2A1800',
    productos: ['Ropa casual', 'Ropa de trabajo', 'Accesorios'],
    pie: 'Envío gratis sobre $30.000',
  },
  {
    tipo: 'servicios',
    subdominio: 'demo-dentista',
    iniciales: 'CS',
    nombre: 'Clínica Dental Sonrisas',
    titulo: ['Tu sonrisa,', 'en buenas manos'],
    descripcion: 'Atención dental familiar y personalizada.',
    cta: 'Agendar hora',
    acento: '#0891B2',
    textoAcento: '#ffffff',
    servicios: ['Limpieza dental', 'Ortodoncia invisible'],
    franja: { etiqueta: 'PRIMERA CONSULTA', valor: 'Evaluación sin costo' },
  },
]

export const EJEMPLOS_INTRO = {
  eyebrow: 'Ejemplos',
  titulo: 'Sitios que ya están publicados',
  subtitulo: 'Son sitios reales en línea, no maquetas. Ábrelos y revísalos.',
  linkTarjeta: 'Ver sitio →',
}

export const COMO_FUNCIONA = {
  eyebrow: 'Cómo funciona',
  titulo: 'Tres pasos, sin vueltas',
  texto: 'No pagas nada hasta ver tu sitio armado con los datos de tu negocio.',
  cta: { label: 'Empezar el chat', href: '/chat' } satisfies EnlaceCta,
  // Ilustraciones de interfaz de cada paso (decorativas).
  ilustraciones: {
    chat: [
      { quien: 'bot', texto: '¿Qué servicios ofreces?' },
      { quien: 'persona', texto: 'Limpieza, ortodoncia y blanqueamiento' },
    ] satisfies MensajeChat[],
    sitioListo: { titulo: 'Tu sitio está listo', texto: 'Revísalo antes de pagar' },
    enLinea: { dominio: 'tunegocio.cl', etiqueta: 'En línea' },
  },
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
  eyebrow: 'Precio',
  titulo: 'Un pago. Un sitio. Sin mensualidades.',
  nombreTarjeta: 'Sitio web de una página',
  etiquetaPagoUnico: 'Pago único',
  incluyeTitulo: 'Incluye',
  incluye: [
    'Diseño con los datos de tu negocio',
    'Tu dominio .cl o .com, a tu nombre y configurado',
    'Hosting y certificado SSL el primer año',
    'Textos e imágenes listos para publicar',
    'Una ronda de ajustes antes de publicar',
  ],
  lanzamiento: {
    prefijo: 'Precio de lanzamiento',
    primeros: (total: number) => `para los primeros ${total}`,
    cupos: (restantes: number) => `quedan ${restantes} cupos`,
  },
  agotado: {
    etiqueta: 'Cupos agotados',
    nota: (precioNormal: string) => `precio normal ${precioNormal}`,
  },
  // Tarjetas bajo el bloque navy; los montos salen de precios.ts.
  extras: {
    multipagina: 'Sitio de varias páginas',
    renovacion: 'Renovación anual de dominio y hosting, desde el segundo año',
  },
  cta: { label: 'Ver mi sitio gratis', href: '/chat' } satisfies EnlaceCta,
}

export const POR_QUE_DEVALPO = {
  eyebrow: 'Por qué Devalpo',
  titulo: 'Por qué trabajar con nosotros',
  // Pie de la tarjeta "¿Quiénes somos?" y píldoras de "Lo publicamos nosotros".
  firma: {
    iniciales: 'AR',
    frase: 'Hablas con una persona, no con un ticket.',
    persona: 'Agustín Romero · CEO & Co-Founder',
  },
  pastillas: ['Dominio', 'Hosting', 'Certificado SSL'],
  puntos: [
    {
      titulo: '¿Quiénes somos?',
      desc: 'Empresa chilena de transformación digital fundada en 2020 en Valparaíso. Hacemos la tecnología accesible para empresas que buscan optimizar operaciones.',
    },
    {
      titulo: 'Lo publicamos nosotros',
      desc: 'Nos hacemos cargo del dominio, el hosting y el certificado. Tú revisas y apruebas.',
    },
    {
      titulo: '¿Te piden un sitio web?',
      desc: 'Si estás activando Webpay o Mercado Pago y te piden un sitio, te lo entregamos listo para mostrar: los datos de tu negocio, cómo contactarte y la descripción de lo que ofreces.',
    },
  ],
}

// Exactamente 6 preguntas (R9): cada tema requerido aparece una sola vez. El
// orden prioriza al lector (una FAQ de landing no debería abrir con la
// facturación del segundo año) — ver design, sección "FAQ".
export const FAQ = {
  eyebrow: 'Preguntas',
  titulo: 'Preguntas frecuentes',
  otraDuda: {
    prefijo: '¿Otra duda? Escríbenos al',
    telefono: '+56 9 7642 4587',
    href: 'https://wa.me/56976424587',
  },
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
      a: 'Sirve igual. Si ya tienes un dominio registrado, lo configuramos para que apunte a tu sitio nuevo; solo necesitamos acceso al panel donde lo registraste. El dominio queda a nombre de tu negocio y sigue siendo tuyo, trabajes con nosotros o no. Si aún no tienes uno, el precio incluye un dominio .cl o .com estándar; si quieres uno premium o de mayor costo, pagas solo la diferencia.',
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

const CTA_FINAL_TITULO = { antes: 'Tu sitio puede estar publicado', destacado: 'mañana.' }

export const CTA_FINAL = {
  // El H2 se parte para pintar `destacado` en cyan; `titulo` es el texto plano completo.
  tituloPartes: CTA_FINAL_TITULO,
  titulo: `${CTA_FINAL_TITULO.antes} ${CTA_FINAL_TITULO.destacado}`,
  subtitulo: 'Empieza la conversación ahora. No pagas nada hasta ver tu sitio listo.',
  cta: { label: 'Ver mi sitio gratis', href: '/chat' } satisfies EnlaceCta,
}

// Footer (README del handoff §10). Se conserva cada dato del footer anterior;
// el teléfono enlaza a WhatsApp igual que el de las preguntas frecuentes.
export const FOOTER = {
  glosa: 'Sitios web para pymes, publicados en tu dominio en 1 día hábil.',
  contacto: {
    titulo: 'Contacto',
    nombre: 'Agustín Nicolás Romero Salazar',
    cargo: 'CEO & Co-Founder',
    correo: { label: 'agustin.romero@devalpo.cl', href: 'mailto:agustin.romero@devalpo.cl' },
    telefono: { label: '+56 9 7642 4587', href: 'https://wa.me/56976424587' },
  },
  empresa: {
    titulo: 'Empresa',
    lineas: ['Devalpo Soluciones Tecnológicas SpA', 'RUT 77.119.936-4', 'Reñaca Norte 265, of. 510, Viña del Mar'],
  },
  copyright: '© 2026 Devalpo · Soluciones Tecnológicas',
  enlaces: [
    { label: 'Términos y condiciones', href: '/terminos' },
    { label: 'Privacidad', href: '/privacidad' },
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
