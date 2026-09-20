import {
  detectarRubro,
  detectarRubroDetallado,
  resolverColores,
  RUBRO_DEFAULTS,
  RUBRO_OTRO,
} from '@/infrastructure/demo/rubroDefaults'
import { Estilo } from '@/domain/value-objects/Estilo'
import { razonContraste } from '@/domain/color/contraste'

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

// Antes de este cambio, un rubro no reconocido caía en RUBRO_DEFAULT
// ("panaderia") con total confianza: un negocio sin ninguna palabra clave
// terminaba con colores y plantilla de panadería sin ninguna relación real
// (ver Pieza 3 del cambio). Estas dos aserciones existían con `RUBRO_DEFAULT`
// como valor esperado — se actualizan a RUBRO_OTRO porque contradicen
// directamente el comportamiento nuevo, que es el que pidió el usuario: no
// se debilita la cobertura, se corrige la expectativa. `RUBRO_DEFAULT` sigue
// existiendo (ver rubroDefaults.ts) pero ya no es lo que `detectarRubro`
// devuelve.
describe('detectarRubro — el fallback neutro', () => {
  it('cae en "otro" cuando no reconoce nada, y RUBRO_DEFAULTS tiene una entrada neutra para eso', () => {
    expect(detectarRubro('Lorem ipsum dolor sit amet')).toBe(RUBRO_OTRO)
    expect(RUBRO_DEFAULTS[RUBRO_OTRO]).toBeDefined()
  })

  it('un texto vacío no revienta y cae en "otro"', () => {
    expect(detectarRubro('')).toBe(RUBRO_OTRO)
  })
})

describe('detectarRubroDetallado — puntaje por cantidad de keywords, no primer match', () => {
  // El caso real que motivó la Pieza 1: antes `detectarRubro` recorría
  // DETECCION_RUBRO en orden de declaración y devolvía el PRIMER rubro con
  // algún match. "peluqueria" está declarada antes que "veterinaria", así
  // que una sola palabra suelta ("peluquería canina") le ganaba a dos
  // palabras genuinamente del rubro correcto ("veterinaria" + "clínica
  // veterinaria"/"veterinar").
  it('"Patitas / clinica veterinaria / vacunas, consultas, peluqueria canina" → veterinaria, no peluqueria', () => {
    const texto = 'Patitas / clinica veterinaria / vacunas, consultas, peluqueria canina'
    const resultado = detectarRubroDetallado(texto)

    expect(resultado.rubro).toBe('veterinaria')
    expect(resultado.hits).toBeGreaterThan(1)
    expect(detectarRubro(texto)).toBe('veterinaria')
  })

  it('un empate real entre rubros distintos se reporta en candidatosEmpatados, en orden de declaración', () => {
    // "salón" (peluqueria, declarada 2ª) y "taller" (declarada 6ª) matchean
    // una sola keyword cada uno: empate 1 a 1. Gana el primero en orden de
    // declaración (peluqueria), y el empate queda expuesto para que
    // DemoChatService decida preguntar (Pieza 4).
    const resultado = detectarRubroDetallado('atendemos en el salón y también el taller')

    expect(resultado.hits).toBe(1)
    expect(resultado.candidatosEmpatados).toEqual(['peluqueria', 'taller'])
    expect(resultado.rubro).toBe('peluqueria')
  })

  it('sin empate, candidatosEmpatados queda vacío aunque el rubro haya ganado con un solo match', () => {
    const resultado = detectarRubroDetallado('vendemos pan recién horneado')

    expect(resultado.candidatosEmpatados).toEqual([])
  })

  it('cuando nada matchea, hits es 0 y candidatosEmpatados queda vacío (no es un empate, es ausencia de señal)', () => {
    const resultado = detectarRubroDetallado('Lorem ipsum dolor sit amet')

    expect(resultado.rubro).toBe(RUBRO_OTRO)
    expect(resultado.hits).toBe(0)
    expect(resultado.candidatosEmpatados).toEqual([])
  })
})

describe('detectarRubro — insensible a tildes', () => {
  // El cliente escribe sin tildes con frecuencia. Antes de la Pieza 2, el
  // patrón compilado llevaba la tilde de la keyword tal cual ("clínica
  // dental", "cafetería", "relajación") y un texto sin tilde no matcheaba.
  it.each([
    ['clinica dental Sonrisas, atencion sin dolor', 'dentista'],
    ['venta de materiales de construccion y pintura', 'ferreteria'],
    ['sesiones de relajacion y meditacion guiada', 'yoga'],
    ['atendemos cafeteria y menu del dia', 'restaurante'],
  ])('"%s" → %s', (texto, esperado) => {
    expect(detectarRubro(texto)).toBe(esperado)
  })
})

describe('detectarRubro — la ñ no rompe nada', () => {
  // La normalización de la Pieza 2 (NFD + descarte de marcas combinantes)
  // pliega la ñ a n de paso, porque 'ñ' se descompone en 'n' + tilde
  // combinante — no hay forma de normalizar tildes sin normalizar también
  // la ñ con el mismo mecanismo. Se comprobó que eso no genera colisiones
  // con el vocabulario de DETECCION_RUBRO (ningún par tipo "año"/"ano"), y
  // estos casos fuera del vocabulario tampoco matchean nada por accidente.
  it('"Ñandú" en un texto de panadería sigue detectando panaderia (por "pan"/"hallulla", no por Ñandú)', () => {
    expect(detectarRubro('Panadería Ñandú, hallullas y marraquetas')).toBe('panaderia')
  })

  it('palabras con ñ fuera del vocabulario no matchean ningún rubro por accidente', () => {
    expect(detectarRubro('abrimos mañana a las 9')).toBe(RUBRO_OTRO)
    expect(detectarRubro('un negocio pequeño de barrio')).toBe(RUBRO_OTRO)
  })
})

describe('resolverColores — acento neutro exclusivo de "otro"', () => {
  // Para un rubro conocido, resolverColores transforma el acento DEL RUBRO
  // (derivarAcento, D-27). "otro" no tiene esa identidad que preservar, así
  // que el estilo decide el acento directamente — ver el comentario de
  // ACENTO_OTRO_POR_ESTILO en rubroDefaults.ts. Cada uno se mide acá contra
  // blanco (razonContraste) porque la plantilla LANDING (TEMPLATE_FALLBACK)
  // usa fondo blanco y este acento nunca pasa por clampAcento.
  const colores = RUBRO_DEFAULTS[RUBRO_OTRO].colores

  it.each([
    [Estilo.MODERNO, '#556270'],
    [Estilo.CALIDO, '#b06a3b'],
    [Estilo.COLORIDO, '#0f8b8d'],
  ])('estilo %s → acento %s, con contraste ≥3:1 contra blanco', (estilo, acentoEsperado) => {
    const resultado = resolverColores(RUBRO_OTRO, colores, estilo)

    expect(resultado.acento).toBe(acentoEsperado)
    expect(razonContraste(resultado.acento, '#ffffff')).toBeGreaterThanOrEqual(3)
  })

  it('un rubro conocido NO usa el acento neutro: sigue transformando el acento del propio rubro', () => {
    const resultado = resolverColores('panaderia', RUBRO_DEFAULTS.panaderia.colores, Estilo.MODERNO)

    expect(resultado.acento).not.toBe('#556270')
  })

  // R3-resolverColores-descarta-entrada: igual que la rama de override (ver
  // acentoPorEstilo.test.ts), la rama de "otro" construye el objeto de
  // salida a mano (`{ acento: ... }`) y descarta cualquier otro campo que
  // traiga `colores`. Deliberado por D-31 (camino 3): esos campos ya no los
  // lee nadie del sistema — no es un olvido de esta rama en particular.
  it('descarta cualquier campo extra de colores también en la rama de "otro" — mismo contrato de D-31', () => {
    const coloresConCamposExtra = {
      acento: '#15defa',
      primario: '#000000',
      secundario: '#111111',
      texto: '#ffffff',
    } as unknown as (typeof RUBRO_DEFAULTS)[typeof RUBRO_OTRO]['colores']

    const resultado = resolverColores(RUBRO_OTRO, coloresConCamposExtra, Estilo.MODERNO)

    expect(Object.keys(resultado)).toEqual(['acento'])
  })
})
