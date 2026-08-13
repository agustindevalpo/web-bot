import { Template } from '@/domain/value-objects/Template'

// Cliente "dueño" de los sitios generados en modo demo — no paga, no se
// factura, solo existe para satisfacer la FK de Sitio.clienteId. Creado por
// prisma/seed-demo.ts (correr una vez por entorno).
export const CLIENTE_DEMO_ID = 'cliente-demo-webbot-devalpo'

export interface RubroVisualDefaults {
  template: Template
  colores: { primario: string; secundario: string; acento: string; texto: string }
  imagenes: string[]
}

// Valores visuales por defecto por rubro (colores + fotos stock) — el
// contenido real (nombre, descripción, servicios, etc.) sale de las
// respuestas del usuario en el chat, ver DemoChatService.extraerDatos.
// Nota: los mismos colores/imágenes también viven en prisma/seed-demo.ts
// (sitios de ejemplo prefabricados) — duplicado a propósito para no acoplar
// el script de seed (fuera de src/, sin alias @/) a este módulo.
export const RUBRO_DEFAULTS: Record<string, RubroVisualDefaults> = {
  panaderia: {
    template: Template.RESTAURANTE,
    colores: { primario: '#8B4513', secundario: '#D2691E', acento: '#FF8C00', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
      'https://images.unsplash.com/photo-1556217477-d325251ece38?w=800',
    ],
  },
  peluqueria: {
    template: Template.SERVICIOS,
    colores: { primario: '#1a1a2e', secundario: '#16213e', acento: '#e94560', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    ],
  },
  dentista: {
    template: Template.SERVICIOS,
    colores: { primario: '#0f3460', secundario: '#16213e', acento: '#0891B2', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200',
      'https://images.unsplash.com/photo-1588776814546-1ffbb9b3754e?w=800',
    ],
  },
  restaurante: {
    template: Template.RESTAURANTE,
    colores: { primario: '#7B2D00', secundario: '#A0522D', acento: '#FF6B35', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    ],
  },
  consultora: {
    template: Template.SERVICIOS,
    colores: { primario: '#1e3a5f', secundario: '#2d5986', acento: '#15DEFA', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    ],
  },
  taller: {
    template: Template.SERVICIOS,
    colores: { primario: '#1a1a1a', secundario: '#2d2d2d', acento: '#FF4500', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1200',
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800',
    ],
  },
  yoga: {
    template: Template.SERVICIOS,
    colores: { primario: '#4a7c59', secundario: '#6b9e79', acento: '#f0c040', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1200',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    ],
  },
  ferreteria: {
    template: Template.TIENDA,
    colores: { primario: '#1a1a2e', secundario: '#16213e', acento: '#FFAF4D', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    ],
  },
  veterinaria: {
    template: Template.SERVICIOS,
    colores: { primario: '#6C5CE7', secundario: '#a29bfe', acento: '#fd79a8', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    ],
  },
  tienda: {
    template: Template.TIENDA,
    colores: { primario: '#c0392b', secundario: '#e74c3c', acento: '#f39c12', texto: '#ffffff' },
    imagenes: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
    ],
  },
}

export const RUBRO_DEFAULT = 'panaderia'

const DETECCION_RUBRO: Array<{ keywords: string[]; rubro: string }> = [
  { keywords: ['pan', 'panadería', 'panaderia', 'torta', 'repostería', 'horno', 'hallulla', 'marraqueta'], rubro: 'panaderia' },
  { keywords: ['pelo', 'peluquería', 'peluqueria', 'cabello', 'corte', 'colorimetría', 'salón', 'salon', 'beauty', 'estética'], rubro: 'peluqueria' },
  { keywords: ['diente', 'dental', 'dentista', 'odontólogo', 'odontologia', 'boca', 'ortodoncia', 'clínica dental'], rubro: 'dentista' },
  { keywords: ['restaurant', 'restorán', 'comida', 'menú', 'almuerzo', 'cena', 'cocina', 'café', 'cafetería', 'picada'], rubro: 'restaurante' },
  { keywords: ['contab', 'tributar', 'impuesto', 'renta', 'sii', 'asesor', 'consultor', 'contador'], rubro: 'consultora' },
  { keywords: ['auto', 'mecánic', 'taller', 'motor', 'freno', 'aceite', 'vehículo', 'camion'], rubro: 'taller' },
  { keywords: ['yoga', 'meditación', 'pilates', 'bienestar', 'mindfulness', 'zen', 'relajación'], rubro: 'yoga' },
  { keywords: ['ferretería', 'ferreteria', 'herramienta', 'construcción', 'pintura', 'gasfiter', 'electricidad'], rubro: 'ferreteria' },
  { keywords: ['veterinar', 'mascota', 'perro', 'gato', 'animal', 'clínica animal', 'veterinaria'], rubro: 'veterinaria' },
  { keywords: ['ropa', 'boutique', 'moda', 'vestido', 'tienda', 'indumentaria', 'calzado', 'accesorio'], rubro: 'tienda' },
]

export function detectarRubro(textoUsuario: string): string {
  const texto = textoUsuario.toLowerCase()
  for (const entrada of DETECCION_RUBRO) {
    if (entrada.keywords.some((kw) => texto.includes(kw))) {
      return entrada.rubro
    }
  }
  return RUBRO_DEFAULT
}
