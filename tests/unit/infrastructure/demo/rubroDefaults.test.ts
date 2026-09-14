import { detectarRubro, RUBRO_DEFAULT, RUBRO_DEFAULTS } from '@/infrastructure/demo/rubroDefaults'

describe('detectarRubro — el rubro está en lo que el cliente describe', () => {
  // El caso que motivó el cambio: el nombre de un negocio real no dice a qué
  // se dedica. Antes, los tres caían en panadería.
  it.each([
    ['Servicios Integrales SpA', 'Somos un taller mecánico', 'Cambio de aceite y frenos', 'taller'],
    ['Aurora', 'Clínica dental con ortodoncia', 'Limpieza, implantes', 'dentista'],
    ['Don Pepe', 'Vendemos ropa de moda', 'Vestidos, calzado', 'tienda'],
    ['Estudio Lientur', 'Asesoría contable', 'Renta, impuestos', 'consultora'],
  ])('deduce el rubro con nombre neutro: %s → %s', (nombre, descripcion, servicios, esperado) => {
    expect(detectarRubro([nombre, descripcion, servicios].join(' '))).toBe(esperado)
  })

  it('el nombre sigue alcanzando cuando sí nombra el rubro', () => {
    expect(detectarRubro('Panadería Aurora')).toBe('panaderia')
  })
})

describe('detectarRubro — palabras enteras, no subcadenas', () => {
  // Estas colisiones existían siempre, pero eran raras mientras solo se miraba
  // el nombre. Al sumar descripción y servicios pasan a ser habituales.
  // Cada caso trae el rubro verdadero Y la palabra tramposa. El rubro tramposo
  // se declara ANTES que el verdadero en DETECCION_RUBRO, así que si la
  // subcadena volviera a matchear, ganaría él: por eso basta con afirmar el
  // rubro correcto para probar que no matcheó.
  it.each([
    ['vendemos ropa: pantalones y vestidos', 'tienda', 'pan dentro de pantalones'],
    ['clínica dental con atención de cortesía', 'dentista', 'corte dentro de cortesía'],
    ['asesoría contable en modalidad remota', 'consultora', 'moda dentro de modalidad'],
  ])('%s → %s (%s)', (texto, esperado) => {
    expect(detectarRubro(texto)).toBe(esperado)
  })

  // Acá no hay rubro verdadero: la palabra tramposa está sola. Si `ropa`
  // matcheara dentro de "Europa", devolvería tienda en vez del fallback.
  it('una palabra tramposa sola no decide el rubro', () => {
    expect(detectarRubro('importado de Europa')).not.toBe('tienda')
    expect(detectarRubro('media docena de facturas')).not.toBe('restaurante')
  })

  it('la palabra entera sí matchea, y su plural también', () => {
    expect(detectarRubro('vendemos pan recién horneado')).toBe('panaderia')
    expect(detectarRubro('reparamos autos')).toBe('taller')
    expect(detectarRubro('cortes de pelo')).toBe('peluqueria')
  })

  it('los keywords largos siguen siendo prefijo, para cubrir derivados', () => {
    expect(detectarRubro('clínica veterinaria')).toBe('veterinaria')
    expect(detectarRubro('atendemos veterinarios')).toBe('veterinaria')
    expect(detectarRubro('servicio mecánico')).toBe('taller')
  })

  it('no se confunde con acentos ni con ñ', () => {
    expect(detectarRubro('peluquería y colorimetría')).toBe('peluqueria')
    expect(detectarRubro('Panadería Ñandú, hallullas y marraquetas')).toBe('panaderia')
  })
})

describe('detectarRubro — el fallback', () => {
  it('cae en RUBRO_DEFAULT cuando no reconoce nada, y ese rubro existe', () => {
    expect(detectarRubro('Lorem ipsum dolor sit amet')).toBe(RUBRO_DEFAULT)
    expect(RUBRO_DEFAULTS[RUBRO_DEFAULT]).toBeDefined()
  })

  it('un texto vacío no revienta', () => {
    expect(detectarRubro('')).toBe(RUBRO_DEFAULT)
  })
})
