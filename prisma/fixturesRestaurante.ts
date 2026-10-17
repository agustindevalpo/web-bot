// Sitios de desarrollo para revisar RESTAURANTE a mano (S4, 1280px y 390px):
// completo, mínimo, mínimo con logo y panadería. Módulo puro (sin Prisma) para
// poder testearlo; los siembra `prisma/seed-fixtures-restaurante.ts`.
//
// Ninguno trae fotos: el hero con foto y "El local" exigen fotos propias
// (servidas desde R2) y en local el almacenamiento es Noop, así que esas dos
// piezas solo se ven con R2 configurado. Todo lo demás se ve sin él.

export const SUBDOMINIOS_FIXTURES_RESTAURANTE = [
  'dev-restaurante-completo',
  'dev-restaurante-minimo',
  'dev-restaurante-minimo-logo',
  'dev-panaderia',
] as const

// Logo cuadrado de 1:1 en data URI: no depende de la red ni de R2.
const LOGO_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#B4452B"/><text x="60" y="78" font-family="Arial" font-size="56" font-weight="700" text-anchor="middle" fill="#fff">LC</text></svg>',
  )

type FixtureRestaurante = {
  subdominio: (typeof SUBDOMINIOS_FIXTURES_RESTAURANTE)[number]
  configJson: Record<string, unknown>
}

export const FIXTURES_RESTAURANTE: FixtureRestaurante[] = [
  {
    subdominio: 'dev-restaurante-completo',
    configJson: {
      nombre: 'El Fogón del Puerto',
      rubro: 'restaurante',
      descripcion: 'Cocina de mar y campo frente a la bahía de Valparaíso.',
      sobreNosotros: 'Desde 2010 servimos recetas de familia junto al puerto, con productos de la caleta.',
      ciudad: 'Valparaíso',
      contacto: { telefono: '+56 9 5555 1234', email: 'reservas@elfogon.cl', direccion: 'Av. Errázuriz 1200, Valparaíso' },
      menu: [
        {
          categoria: 'Entradas',
          items: [
            { nombre: 'Ceviche de reineta', precio: '$8.900' },
            { nombre: 'Machas a la parmesana', precio: '$10.500' },
          ],
        },
        {
          categoria: 'Fondos',
          items: [
            { nombre: 'Congrio frito', precio: '$11.900' },
            { nombre: 'Pastel de choclo', precio: '$9.800' },
            { nombre: 'Plato del día' },
          ],
        },
        { categoria: 'Postres', items: [{ nombre: 'Leche asada', precio: '$4.500' }] },
      ],
      horarios: [
        { dia: 'Martes a sábado', rango: '12:30 a 23:00' },
        { dia: 'Domingo', rango: '12:30 a 17:00' },
        { dia: 'Lunes', rango: 'Cerrado' },
      ],
      sobreNosotrosPartes: {
        desde: 'Abrimos en 2010 en el cerro Alegre.',
        quien: 'Cocina la familia Soto.',
        distinto: 'Pescado del día, sin congelados.',
      },
      highlight: 'El mejor congrio frito del puerto.',
      highlightAutor: { nombre: 'Carolina Pérez', cargo: 'Clienta' },
      redes: { instagram: '@elfogondelpuerto' },
      legal: { razonSocial: 'Gastronomía El Fogón SpA', rut: '76.123.456-7' },
      estilo: 'calido',
      colores: { acento: '#B4452B' },
      imagenes: [],
    },
  },
  {
    subdominio: 'dev-restaurante-minimo',
    configJson: {
      nombre: 'La Cazuela',
      rubro: 'restaurante',
      descripcion: 'Comida casera de todos los días.',
      servicios: ['Cazuela de vacuno', 'Pastel de choclo', 'Empanadas de pino', 'Menú del día'],
      ciudad: 'Quilpué',
      contacto: { telefono: '+56 9 1111 2222', email: 'hola@lacazuela.cl' },
      estilo: 'calido',
      colores: { acento: '#B4452B' },
    },
  },
  {
    subdominio: 'dev-restaurante-minimo-logo',
    configJson: {
      nombre: 'La Cazuela',
      rubro: 'restaurante',
      descripcion: 'Comida casera de todos los días.',
      servicios: ['Cazuela de vacuno', 'Pastel de choclo', 'Empanadas de pino'],
      ciudad: 'Quilpué',
      contacto: { telefono: '+56 9 1111 2222', email: 'hola@lacazuela.cl' },
      logo: LOGO_SVG,
      logoDimensiones: { ancho: 120, alto: 120 },
      estilo: 'calido',
      colores: { acento: '#B4452B' },
    },
  },
  {
    subdominio: 'dev-panaderia',
    configJson: {
      nombre: 'Panadería El Trigal',
      rubro: 'panaderia',
      descripcion: 'Pan de masa madre y pastelería, horneados cada mañana.',
      menu: [{ items: [{ nombre: 'Pan de masa madre', precio: '$3.200' }, { nombre: 'Kuchen de manzana', precio: '$12.000' }, { nombre: 'Torta personalizada' }] }],
      ciudad: 'Viña del Mar',
      contacto: { telefono: '+56 9 8888 4444', email: 'pedidos@eltrigal.cl', direccion: 'Calle 1 Norte 840, Viña del Mar' },
      horarios: [
        { dia: 'Lunes a sábado', rango: '08:00 a 20:00' },
        { dia: 'Domingo', rango: '09:00 a 14:00' },
      ],
      estilo: 'calido',
      colores: { acento: '#C77A12' },
    },
  },
]
