// Seed de sitios demo para el Demo Mode — ver docs/WEBBOT_DEMO_MODE.md.
// Crea un cliente demo (activo=true para que el sitio se sirva como
// cualquier otro, pero nunca se le factura nada) y 10 sitios prefabricados,
// uno por rubro, que se muestran cuando un usuario sin cuenta paga
// completa el chat de demo.
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const CLIENTE_DEMO_ID = 'cliente-demo-webbot-devalpo'
const CLIENTE_DEMO_EMAIL = 'demo@webbot.devalpo.cl'

const SITIOS_DEMO = [
  {
    subdominio: 'demo-panaderia',
    template: 'RESTAURANTE' as const,
    rubro: 'panaderia',
    configJson: {
      nombre: 'Panadería El Trigal',
      rubro: 'panaderia',
      descripcion: 'Panadería artesanal con más de 20 años de tradición familiar en Viña del Mar.',
      servicios: ['Pan artesanal', 'Tortas personalizadas', 'Hallullas y marraquetas', 'Delivery a domicilio'],
      ciudad: 'Viña del Mar',
      contacto: { telefono: '+56 9 1234 5678', email: 'contacto@eltrigal.cl' },
      redes: { instagram: '@panaderiaeltrigal', facebook: 'Panadería El Trigal' },
      estilo: 'calido',
      highlight: 'Horneamos tres veces al día para que siempre tengas pan fresco.',
      imagenes: [
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
        'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800',
        'https://images.unsplash.com/photo-1556217477-d325251ece38?w=800',
      ],
      colores: { primario: '#8B4513', secundario: '#D2691E', acento: '#FF8C00', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-peluqueria',
    template: 'SERVICIOS' as const,
    rubro: 'peluqueria',
    configJson: {
      nombre: 'Estudio de Belleza Valeria',
      rubro: 'peluqueria',
      descripcion: 'Salón de belleza profesional especializado en colorimetría y tratamientos capilares.',
      servicios: ['Corte y peinado', 'Colorimetría', 'Tratamientos capilares', 'Manicure y pedicure'],
      ciudad: 'Santiago, Providencia',
      contacto: { telefono: '+56 9 8765 4321', email: 'reservas@estudiobeaute.cl' },
      redes: { instagram: '@estudiobeaute_cl', facebook: null },
      estilo: 'moderno',
      highlight: 'Reserva online y recibe un descuento del 10% en tu primera visita.',
      imagenes: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
      ],
      colores: { primario: '#1a1a2e', secundario: '#16213e', acento: '#e94560', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-dentista',
    template: 'SERVICIOS' as const,
    rubro: 'dentista',
    configJson: {
      nombre: 'Clínica Dental Sonrisas',
      rubro: 'dentista',
      descripcion: 'Clínica dental familiar con tecnología de última generación y atención personalizada.',
      servicios: ['Limpieza dental', 'Blanqueamiento', 'Ortodoncia invisible', 'Urgencias 24h'],
      ciudad: 'Concepción',
      contacto: { telefono: '+56 9 5555 1234', email: 'agenda@clinicasonrisas.cl' },
      redes: { instagram: '@clinicasonrisas', facebook: 'Clínica Dental Sonrisas' },
      estilo: 'moderno',
      highlight: 'Primera consulta de evaluación sin costo para nuevos pacientes.',
      imagenes: [
        'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200',
        'https://images.unsplash.com/photo-1588776814546-1ffbb9b3754e?w=800',
      ],
      colores: { primario: '#0f3460', secundario: '#16213e', acento: '#0891B2', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-restaurante',
    template: 'RESTAURANTE' as const,
    rubro: 'restaurante',
    configJson: {
      nombre: 'El Rincón del Sabor',
      rubro: 'restaurante',
      descripcion: 'Restaurante de comida casera chilena con ingredientes frescos del mercado.',
      servicios: ['Almuerzo ejecutivo', 'Cenas', 'Eventos privados', 'Delivery'],
      ciudad: 'Valparaíso',
      contacto: { telefono: '+56 9 3333 7777', email: 'reservas@rincondelsabor.cl' },
      redes: { instagram: '@rincondelsabor_valpo', facebook: 'El Rincón del Sabor' },
      estilo: 'calido',
      highlight: 'Menú del día a $4.500. Cocinamos como en casa, con el amor de siempre.',
      imagenes: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      ],
      colores: { primario: '#7B2D00', secundario: '#A0522D', acento: '#FF6B35', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-consultora',
    template: 'SERVICIOS' as const,
    rubro: 'consultora',
    configJson: {
      nombre: 'Asesorías ContaExpert',
      rubro: 'consultora',
      descripcion: 'Consultora contable y tributaria para PyMEs y emprendedores. Simplificamos tu contabilidad.',
      servicios: ['Contabilidad mensual', 'Declaración de impuestos', 'Asesoría tributaria', 'Constitución de empresas'],
      ciudad: 'Santiago, Las Condes',
      contacto: { telefono: '+56 9 2222 8888', email: 'contacto@contaexpert.cl' },
      redes: { instagram: null, facebook: 'ContaExpert Asesorías' },
      estilo: 'moderno',
      highlight: 'Primera consulta gratuita. Más de 200 PyMEs confían en nosotros.',
      imagenes: [
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
      ],
      colores: { primario: '#1e3a5f', secundario: '#2d5986', acento: '#15DEFA', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-taller',
    template: 'SERVICIOS' as const,
    rubro: 'taller',
    configJson: {
      nombre: 'Taller Mecánico Don Pedro',
      rubro: 'taller',
      descripcion: 'Taller mecánico automotriz con 15 años de experiencia. Todas las marcas.',
      servicios: ['Mantención preventiva', 'Frenos y suspensión', 'Diagnóstico electrónico', 'Cambio de aceite express'],
      ciudad: 'Quilpué',
      contacto: { telefono: '+56 9 4444 2222', email: 'tallerpedro@gmail.com' },
      redes: { instagram: null, facebook: 'Taller Don Pedro Quilpué' },
      estilo: 'moderno',
      highlight: 'Presupuesto sin costo y garantía de 6 meses en todos los trabajos.',
      imagenes: [
        'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1200',
        'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800',
      ],
      colores: { primario: '#1a1a1a', secundario: '#2d2d2d', acento: '#FF4500', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-yoga',
    template: 'SERVICIOS' as const,
    rubro: 'yoga',
    configJson: {
      nombre: 'Centro de Yoga Serenidad',
      rubro: 'yoga',
      descripcion: 'Estudio de yoga y meditación para todos los niveles. Encuentra tu equilibrio.',
      servicios: ['Yoga para principiantes', 'Yoga avanzado', 'Meditación guiada', 'Clases online'],
      ciudad: 'Providencia, Santiago',
      contacto: { telefono: '+56 9 6666 3333', email: 'hola@yogaserenidad.cl' },
      redes: { instagram: '@yoga_serenidad', facebook: 'Yoga Serenidad' },
      estilo: 'calido',
      highlight: 'Primera clase gratis. Grupos reducidos de máximo 8 personas.',
      imagenes: [
        'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1200',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      ],
      colores: { primario: '#4a7c59', secundario: '#6b9e79', acento: '#f0c040', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-ferreteria',
    template: 'TIENDA' as const,
    rubro: 'ferreteria',
    configJson: {
      nombre: 'Ferretería Los Maestros',
      rubro: 'ferreteria',
      descripcion: 'Ferretería completa con más de 5.000 productos. Atención a constructores y particulares.',
      servicios: ['Herramientas manuales', 'Materiales de construcción', 'Pinturas y barnices', 'Gasfitería y electricidad'],
      ciudad: 'San Antonio',
      contacto: { telefono: '+56 9 7777 5555', email: 'ventas@ferreterialosmaestros.cl' },
      redes: { instagram: null, facebook: 'Ferretería Los Maestros San Antonio' },
      estilo: 'moderno',
      highlight: 'Despacho a obra en toda la región. Precios de mayorista para constructores.',
      imagenes: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
        'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
      ],
      colores: { primario: '#1a1a2e', secundario: '#16213e', acento: '#FFAF4D', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-veterinaria',
    template: 'SERVICIOS' as const,
    rubro: 'veterinaria',
    configJson: {
      nombre: 'Clínica Veterinaria Huellitas',
      rubro: 'veterinaria',
      descripcion: 'Clínica veterinaria con atención de urgencias. Cuidamos a tu mascota como si fuera nuestra.',
      servicios: ['Consultas y vacunas', 'Cirugías', 'Peluquería canina', 'Urgencias 24h'],
      ciudad: 'Ñuñoa, Santiago',
      contacto: { telefono: '+56 9 8888 1111', email: 'atencion@huellitas.cl' },
      redes: { instagram: '@huellitas_vet', facebook: 'Veterinaria Huellitas' },
      estilo: 'colorido',
      highlight: 'Urgencias las 24 horas. Tu mascota siempre tendrá atención cuando más lo necesita.',
      imagenes: [
        'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200',
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
      ],
      colores: { primario: '#6C5CE7', secundario: '#a29bfe', acento: '#fd79a8', texto: '#ffffff' },
    },
  },
  {
    subdominio: 'demo-tienda',
    template: 'TIENDA' as const,
    rubro: 'tienda',
    configJson: {
      nombre: 'Boutique Luna Nueva',
      rubro: 'tienda',
      descripcion: 'Tienda de ropa femenina con diseños exclusivos y tallas del XS al XXL.',
      servicios: ['Ropa casual', 'Ropa de trabajo', 'Accesorios', 'Despacho a todo Chile'],
      ciudad: 'Santiago (venta online)',
      contacto: { telefono: '+56 9 9999 0000', email: 'hola@boutiquelunanueva.cl' },
      redes: { instagram: '@boutiquelunanueva', facebook: 'Boutique Luna Nueva' },
      estilo: 'colorido',
      highlight: 'Envío gratis sobre $30.000. Cambios y devoluciones en 15 días.',
      imagenes: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
      ],
      colores: { primario: '#c0392b', secundario: '#e74c3c', acento: '#f39c12', texto: '#ffffff' },
    },
  },
]

async function main() {
  console.log('Seeding sitios demo...')

  const clienteDemo = await prisma.cliente.upsert({
    where: { id: CLIENTE_DEMO_ID },
    create: {
      id: CLIENTE_DEMO_ID,
      email: CLIENTE_DEMO_EMAIL,
      nombre: 'WebBot Demo',
      plan: 'STARTER',
      activo: true,
    },
    update: {},
  })

  console.log(`Cliente demo: ${clienteDemo.id}`)

  for (const sitio of SITIOS_DEMO) {
    const { rubro, ...datosSitio } = sitio
    await prisma.sitio.upsert({
      where: { subdominio: sitio.subdominio },
      create: {
        clienteId: CLIENTE_DEMO_ID,
        ...datosSitio,
      },
      update: {
        configJson: datosSitio.configJson,
      },
    })
    console.log(`  ✓ demo-${rubro} → ${sitio.subdominio}.sitios.devalpo.cl`)
  }

  console.log('Seed completado.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
