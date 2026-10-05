import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Momento2 } from '@/app/chat/completar/Momento2'
import { EstadoMomento2 } from '@/app/chat/completar/EstadosMomento2'
import { construirVistaMomento2, valoresIniciales } from '@/application/shared/momento2'

// Las acciones importan `next/headers` y el contenedor de Prisma: fuera de una
// petición no existen, y el render de servidor no las ejecuta.
jest.mock('@/app/chat/completar/actions', () => ({
  guardarTareaAction: jest.fn(),
  omitirTareaAction: jest.fn(),
}))

// Mismo enfoque que DemoCTA.render.test.ts: el proyecto "unit" corre en
// 'node', así que se verifica el HTML de la pantalla inicial (el render de
// servidor usa la vista móvil), no la interacción.

function render(config: Record<string, unknown>, template: string): string {
  return renderToStaticMarkup(
    React.createElement(Momento2, {
      template,
      urlSitio: 'http://localhost:3000/sites/demo-1',
      vistaInicial: construirVistaMomento2(config, template),
      iniciales: valoresIniciales(config),
    }),
  )
}

describe('Momento2: pantalla de tarea (móvil)', () => {
  const servicios = render(
    { template: 'SERVICIOS', servicios: ['Corte', 'Color'] },
    'SERVICIOS',
  )

  it('abre en el paso 1 de 4 con el copy de la spec', () => {
    expect(servicios).toContain('Paso 1 de 4')
    expect(servicios).toContain('Describe tus servicios')
    expect(servicios).toContain('Una línea por servicio y, si quieres, el precio desde. Lo que dejes vacío no aparece en tu sitio.')
    expect(servicios).toContain('Completar tu sitio')
    expect(servicios).toContain('35 %')
  })

  it('un campo por servicio con descripción y precio, con los largos máximos', () => {
    expect(servicios).toContain('Corte')
    expect(servicios).toContain('Color')
    expect(servicios).toContain('placeholder="Qué incluye, en una línea"')
    expect(servicios).toContain('placeholder="Precio desde"')
    expect(servicios).toContain('maxLength="90"')
    expect(servicios).toContain('maxLength="20"')
  })

  it('Guardar queda deshabilitado sin respuestas y Omitir está disponible', () => {
    expect(servicios).toMatch(/<button[^>]*disabled=""[^>]*>Guardar y ver cómo queda<\/button>/)
    expect(servicios).toMatch(/<button[^>]*>Omitir este paso<\/button>/)
    expect(servicios).not.toMatch(/<button[^>]*disabled=""[^>]*>Omitir este paso<\/button>/)
  })

  it('el botón de cerrar vuelve al sitio con el nombre accesible de la spec', () => {
    expect(servicios).toContain('aria-label="Cerrar y volver a mi sitio"')
    expect(servicios).toContain('href="/chat?vista=sitio"')
  })

  it('LANDING pide tres tareas y no ofrece precio', () => {
    const landing = render({ template: 'LANDING', servicios: ['Corte'] }, 'LANDING')
    expect(landing).toContain('Paso 1 de 3')
    expect(landing).toContain('Una línea por servicio. Lo que dejes vacío no aparece en tu sitio.')
    expect(landing).not.toContain('Precio desde')
  })

  it('con servicios ya respondidos abre en el siguiente paso pendiente', () => {
    const html = render(
      { template: 'SERVICIOS', servicios: [{ nombre: 'Corte', descripcion: 'Corte de pelo' }] },
      'SERVICIOS',
    )
    expect(html).toContain('Paso 2 de 4')
    expect(html).toContain('¿Cuándo atiendes?')
    expect(html).toContain('Agregar otro horario')
    expect(html).toContain('Lunes a viernes')
  })
})

describe('Momento2: resumen', () => {
  it('con todo omitido muestra "Lo omitiste", "Responder" y la antesala sin candado', () => {
    const html = render(
      { template: 'LANDING', servicios: ['Corte'], momento2Omitidas: ['servicios', 'nosotros', 'frase'] },
      'LANDING',
    )
    expect(html).toContain('Tu sitio está al 35 %')
    expect(html).toContain('Lo omitiste · suma 20 %')
    expect(html).toContain('Responder')
    expect(html).toContain('Después del pago')
    expect(html).toContain('Una foto por servicio')
    expect(html).toContain('Volver a mi sitio')
    expect(html).not.toContain('Ver mi sitio y continuar')
    expect(html).not.toMatch(/bloquead|candado/i)
  })

  it('al 80 % el titular es el de logro y el botón es "Ver mi sitio y continuar"', () => {
    const html = render(
      {
        template: 'LANDING',
        servicios: [{ nombre: 'Corte', descripcion: 'x' }],
        sobreNosotrosPartes: { quien: 'Ana' },
        highlight: 'Excelente',
      },
      'LANDING',
    )
    expect(html).toContain('Completaste todo lo que se puede antes del pago')
    expect(html).toContain('Ver mi sitio y continuar')
    expect(html).toContain('Nos los mandas por WhatsApp cuando pagues, y los agregamos antes de publicar.')
    expect(html).toContain('1 de 1 descritos')
  })
})

describe('EstadoMomento2 (E2)', () => {
  it('momento 2 cerrado', () => {
    const html = renderToStaticMarkup(React.createElement(EstadoMomento2, { motivo: 'cerrado' }))
    expect(html).toContain('Tu sitio ya está en preparación')
    expect(html).toContain('Para cambiar algo, escríbenos por WhatsApp y lo hacemos por ti.')
    expect(html).toContain('Escribir por WhatsApp')
    expect(html).toContain('https://wa.me/56976424587')
  })

  it('sesión vencida', () => {
    const html = renderToStaticMarkup(React.createElement(EstadoMomento2, { motivo: 'sesion_vencida' }))
    expect(html).toContain('No encontramos tu sitio de prueba')
    expect(html).toContain('Puede que haya pasado mucho tiempo desde que lo armaste. Escríbenos y lo recuperamos.')
    expect(html).toContain('https://wa.me/56976424587')
  })
})
