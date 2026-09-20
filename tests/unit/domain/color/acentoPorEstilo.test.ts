import { derivarAcento, derivarColores, type ColoresRubro } from '@/domain/color/acentoPorEstilo'
import { linealAOklch, hexALineal } from '@/domain/color/contraste'
import { Estilo } from '@/domain/value-objects/Estilo'
import { resolverColores, OVERRIDES_ACENTO } from '@/infrastructure/demo/rubroDefaults'

const HEX_VALIDO = /^#[0-9a-f]{6}$/i

// Distancia circular a 70° (ámbar) — sirve para comprobar que `calido`
// efectivamente acerca el tono, sin acoplar el test a un valor de grados
// exacto que dependería de redondeos de cuantización a 8 bits.
function distanciaCircular(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

function distanciaAAmbar(h: number): number {
  return distanciaCircular(h, 70)
}

describe('derivarAcento — dirección de cada estilo', () => {
  it('moderno reduce el croma sin tocar la luminosidad', () => {
    const acento = '#0891B2'
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.MODERNO))!)

    expect(derivado.c).toBeLessThan(original.c)
    expect(derivado.l).toBeCloseTo(original.l, 2)
  })

  it('calido acerca al ámbar un acento que ya es cálido', () => {
    const acento = '#e94560'
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.CALIDO))!)

    expect(distanciaAAmbar(derivado.h)).toBeLessThan(distanciaAAmbar(original.h))
  })

  // El caso que motivó MAX_ROTACION_CALIDO: rotar estos dos daba verde menta por
  // un lado y lavanda por el otro. La regla ahora los deja donde están.
  it.each([
    ['#0891B2', 'turquesa de dentista'],
    ['#15DEFA', 'cian de consultora'],
  ])('calido NO rota un acento frío de raíz (%s, %s)', (acento) => {
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.CALIDO))!)

    // 2° de tolerancia: el tono no se toca, pero subir la L y cuantizar a 8 bits
    // lo corre una fracción de grado. Sin la tolerancia el test mide el
    // redondeo, no la regla. Rotar de verdad movería ~60°.
    expect(distanciaCircular(derivado.h, original.h)).toBeLessThan(2)
  })

  it('calido ablanda igual al acento frío que no rota', () => {
    const acento = '#0891B2'
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.CALIDO))!)

    expect(derivado.l).toBeGreaterThan(original.l)
  })

  it('colorido aumenta el croma cuando el pedido entra en gamut', () => {
    const acento = '#8B4513'
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.COLORIDO))!)

    expect(derivado.c).toBeGreaterThan(original.c)
    expect(derivado.l).toBeCloseTo(original.l, 2)
  })

  // La rama que arregló el "colorido lavado". Estos acentos ya están contra el
  // borde de sRGB: el croma pedido se recorta entero, así que la intensidad hay
  // que buscarla bajando la L hacia la cúspide del gamut. Con el +0.02 de L que
  // llevaba la primera versión salían MÁS pálidos que el base (`#FF4500` daba
  // `#ff572a`). La garantía es negativa: nunca menos croma, nunca más claro.
  it.each(['#FF8C00', '#FF4500', '#f0c040', '#f39c12', '#e94560', '#15DEFA'])(
    'colorido nunca devuelve un acento menos saturado ni más claro que el base (%s)',
    (acento) => {
      const original = linealAOklch(hexALineal(acento)!)
      const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.COLORIDO))!)

      expect(derivado.c).toBeGreaterThanOrEqual(original.c)
      // El épsilon absorbe la cuantización a 8 bits: cuando el croma pedido sí
      // entra en gamut la L no se toca, pero el ida y vuelta por hex la corre
      // hasta ~1e-3. Sin esto el test mide el redondeo, no la regla.
      expect(derivado.l).toBeLessThanOrEqual(original.l + 0.002)
    },
  )

  // Acentos oscuros: la búsqueda de cúspide barre 0.25 de L hacia abajo, así
  // que con L < 0.25 parte del barrido caería en luminosidades negativas si no
  // estuviera acotado. La garantía tiene que sostenerse igual.
  it.each(['#2b0b0f', '#1a1a2e', '#0f3460'])(
    'colorido sostiene la garantía con un acento oscuro (%s)',
    (acento) => {
      const original = linealAOklch(hexALineal(acento)!)
      const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.COLORIDO))!)

      expect(derivado.c).toBeGreaterThanOrEqual(original.c)
      expect(derivado.l).toBeLessThanOrEqual(original.l + 0.002)
      expect(derivado.l).toBeGreaterThanOrEqual(0)
    },
  )

  // `#f0c040` sí tiene margen: su cúspide está por debajo de su L, así que acá
  // la búsqueda tiene que encontrar croma de verdad, no empatar.
  it('colorido gana croma real cuando el tono tiene margen bajo su cúspide', () => {
    const acento = '#f0c040'
    const original = linealAOklch(hexALineal(acento)!)
    const derivado = linealAOklch(hexALineal(derivarAcento(acento, Estilo.COLORIDO))!)

    expect(derivado.c).toBeGreaterThan(original.c)
    expect(derivado.l).toBeLessThan(original.l)
  })
})

describe('derivarAcento — salida siempre en sRGB válido', () => {
  const ACENTOS = ['#FF8C00', '#e94560', '#0891B2', '#f0c040', '#15defa', '#fd79a8']
  const ESTILOS = [Estilo.MODERNO, Estilo.CALIDO, Estilo.COLORIDO]

  it.each(ACENTOS.flatMap((acento) => ESTILOS.map((estilo) => [acento, estilo] as const)))(
    '%s con estilo %s da un hex de 6 dígitos válido',
    (acento, estilo) => {
      expect(derivarAcento(acento, estilo)).toMatch(HEX_VALIDO)
    },
  )
})

describe('derivarAcento — degrada sin lanzar', () => {
  it.each([
    ['texto que no es color', 'no-es-color'],
    ['hex con letras inválidas', '#zzz'],
    ['string vacío', ''],
    ['valor nulo colado desde configJson', null as unknown as string],
  ])('%s → devuelve el mismo valor de entrada', (_descripcion, entrada) => {
    expect(() => derivarAcento(entrada as string, Estilo.CALIDO)).not.toThrow()
    expect(derivarAcento(entrada as string, Estilo.CALIDO)).toBe(entrada)
  })
})

describe('derivarColores', () => {
  // D-31 (camino 3): `ColoresRubro` quedó reducido a `acento` — ya no hay
  // `primario`/`secundario`/`texto` que dejar intactos, así que esto es
  // simplemente transformar el único campo.
  const colores = { acento: '#FF8C00' }

  it('transforma el acento con la misma regla que derivarAcento', () => {
    const resultado = derivarColores(colores, Estilo.COLORIDO)

    expect(resultado.acento).toBe(derivarAcento(colores.acento, Estilo.COLORIDO))
    expect(resultado.acento).not.toBe(colores.acento)
  })
})

describe('resolverColores — el override manual gana sobre la derivación', () => {
  const RUBRO_DE_PRUEBA = 'rubro-de-prueba-acento-estilo'

  afterEach(() => {
    delete OVERRIDES_ACENTO[RUBRO_DE_PRUEBA]
  })

  it('usa el hex de OVERRIDES_ACENTO en vez del derivado cuando hay entrada', () => {
    const colores = { acento: '#15defa' }
    OVERRIDES_ACENTO[RUBRO_DE_PRUEBA] = { [Estilo.MODERNO]: '#abcdef' }

    const resultado = resolverColores(RUBRO_DE_PRUEBA, colores, Estilo.MODERNO)

    expect(resultado).toEqual({ acento: '#abcdef' })
  })

  it('sin override cae en la derivación automática', () => {
    const colores = { acento: '#15defa' }

    const resultado = resolverColores(RUBRO_DE_PRUEBA, colores, Estilo.MODERNO)

    expect(resultado).toEqual(derivarColores(colores, Estilo.MODERNO))
  })

  // R3-resolverColores-descarta-entrada: `colores` tipa `ColoresRubro`
  // (`{ acento: string }`, D-31, camino 3), pero un objeto crudo en runtime
  // —por ejemplo si `configJson` todavía trae `primario`/`secundario`/`texto`
  // huérfanos de una fila vieja— puede traer más campos que el tipo permite.
  // `resolverColores` los descarta. Esto es DELIBERADO, no un descuido: la
  // decisión de D-31 fue justamente que esos tres campos dejan de leerse en
  // ningún punto del sistema (ver rubroDefaults.ts y paletaDerivada.ts), así
  // que reenviarlos sería resucitar dato muerto. Se fija acá como contrato
  // para las dos rutas de la función que construyen el objeto de salida a
  // mano (override y, más abajo en rubroDefaults.test.ts, "otro"); la ruta
  // general pasa por `derivarColores`, que también solo lee `colores.acento`.
  it('descarta cualquier campo extra de colores en la rama de override — comportamiento deliberado de D-31, no un olvido', () => {
    const coloresConCamposExtra = {
      acento: '#15defa',
      primario: '#000000',
      secundario: '#111111',
      texto: '#ffffff',
    } as unknown as ColoresRubro
    OVERRIDES_ACENTO[RUBRO_DE_PRUEBA] = { [Estilo.MODERNO]: '#abcdef' }

    const resultado = resolverColores(RUBRO_DE_PRUEBA, coloresConCamposExtra, Estilo.MODERNO)

    expect(resultado).toEqual({ acento: '#abcdef' })
    expect(Object.keys(resultado)).toEqual(['acento'])
  })

  it('descarta cualquier campo extra de colores en la rama general (sin override) — mismo contrato de D-31', () => {
    const coloresConCamposExtra = {
      acento: '#15defa',
      primario: '#000000',
      secundario: '#111111',
      texto: '#ffffff',
    } as unknown as ColoresRubro

    const resultado = resolverColores(RUBRO_DE_PRUEBA, coloresConCamposExtra, Estilo.MODERNO)

    expect(Object.keys(resultado)).toEqual(['acento'])
  })
})
