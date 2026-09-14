import {
  clampAcento,
  hexALineal,
  linealAHex,
  linealAOklch,
  luminanciaRelativa,
  oklchALineal,
  razonContraste,
  OBJETIVO_NO_TEXTO,
  OBJETIVO_TEXTO,
} from '@/domain/color/contraste'

// Fondos reales de las plantillas (docs/design_handoff_plantillas_webbot/).
const BLANCO = '#ffffff'
const FONDO_RESTAURANTE = '#171310'
const FONDO_PORTFOLIO = '#080056'

describe('round-trip sRGB → OKLCH → sRGB', () => {
  // Tolerancia: 0 pasos de 8 bits. El ida y vuelta con el par directo de Ottosson
  // es exacto tras cuantizar a hex; si una constante quedara mal transcrita, el
  // color reconstruido se corre y esto falla.
  it.each([
    ['negro puro', '#000000'],
    ['blanco puro', '#ffffff'],
    ['acento por defecto (cian)', '#15defa'],
    ['azul Devalpo', '#080056'],
    ['rojo saturado', '#ff0000'],
    ['verde saturado', '#00ff00'],
    ['amarillo pálido', '#f2e14c'],
    ['gris neutro', '#808080'],
    ['azul apagado', '#123456'],
  ])('%s vuelve idéntico', (_descripcion, hex) => {
    expect(linealAHex(oklchALineal(linealAOklch(hexALineal(hex)!)))).toBe(hex)
  })

  it('el blanco cae en L=1 con croma ~0, como exige la definición de OKLab', () => {
    const blanco = linealAOklch(hexALineal(BLANCO)!)

    expect(blanco.l).toBeCloseTo(1, 6)
    expect(blanco.c).toBeCloseTo(0, 6)
  })
})

describe('anclas de valor conocido', () => {
  // Cada primario contra negro aísla UN coeficiente de luminancia: (K+0.05)/0.05.
  // Si alguno estuviera mistranscrito, solo falla su fila y se ve cuál es.
  it.each([
    ['rojo → coeficiente 0.2126', '#ff0000', 5.252],
    ['verde → coeficiente 0.7152', '#00ff00', 15.304],
    ['azul → coeficiente 0.0722', '#0000ff', 2.444],
  ])('%s: contraste contra negro = %s', (_descripcion, hex, esperado) => {
    expect(razonContraste(hex, '#000000')).toBeCloseTo(esperado as number, 10)
  })

  // Estas dos dependen además de la linealización (umbral 0.04045), no solo de
  // los coeficientes.
  it.each([
    ['acento por defecto contra blanco', '#15defa', BLANCO, 1.632866],
    ['acento por defecto contra negro', '#15defa', '#000000', 12.860822],
    ['azul Devalpo contra blanco', FONDO_PORTFOLIO, BLANCO, 18.345387],
    ['fondo restaurante contra blanco', FONDO_RESTAURANTE, BLANCO, 18.468638],
  ])('%s = %s', (_descripcion, a, b, esperado) => {
    expect(razonContraste(a as string, b as string)).toBeCloseTo(esperado as number, 6)
  })

  it('la razón es simétrica y el mínimo posible es 1:1', () => {
    expect(razonContraste(BLANCO, '#000000')).toBeCloseTo(21, 10)
    expect(razonContraste('#000000', BLANCO)).toBeCloseTo(21, 10)
    expect(razonContraste('#808080', '#808080')).toBeCloseTo(1, 10)
  })

  it('la luminancia de negro y blanco son los extremos 0 y 1', () => {
    expect(luminanciaRelativa(hexALineal('#000000')!)).toBeCloseTo(0, 10)
    expect(luminanciaRelativa(hexALineal(BLANCO)!)).toBeCloseTo(1, 10)
  })
})

describe('clampAcento alcanza el objetivo', () => {
  // El aserto se hace SOBRE EL COLOR DEVUELTO, no sobre los números OKLCH
  // intermedios: es la única forma de probar que el gamut y la cuantización a 8
  // bits no se comieron el margen.
  it.each([
    ['amarillo pálido sobre blanco (íconos, 3:1)', '#f2e14c', BLANCO, OBJETIVO_NO_TEXTO],
    ['amarillo pálido sobre blanco (texto, 4.5:1)', '#f2e14c', BLANCO, OBJETIVO_TEXTO],
    ['cian sobre blanco (3:1)', '#15defa', BLANCO, OBJETIVO_NO_TEXTO],
    ['azul oscuro sobre fondo restaurante', FONDO_PORTFOLIO, FONDO_RESTAURANTE, OBJETIVO_NO_TEXTO],
    ['azul oscuro sobre fondo portfolio', FONDO_PORTFOLIO, FONDO_PORTFOLIO, OBJETIVO_NO_TEXTO],
    ['negro sobre fondo restaurante (texto)', '#000000', FONDO_RESTAURANTE, OBJETIVO_TEXTO],
    ['gris medio sobre gris medio (texto)', '#808080', '#808080', OBJETIVO_TEXTO],
    ['magenta sobre fondo portfolio (texto)', '#8b0f6e', FONDO_PORTFOLIO, OBJETIVO_TEXTO],
  ])('%s', (_descripcion, acento, fondo, objetivo) => {
    const resultado = clampAcento(acento as string, fondo as string, objetivo as number)

    expect(razonContraste(resultado, fondo as string)).toBeGreaterThanOrEqual(objetivo as number)
  })

  it('por defecto apunta a 3:1 (SC 1.4.11), no a 4.5:1', () => {
    const conDefecto = clampAcento('#f2e14c', BLANCO)

    expect(conDefecto).toBe(clampAcento('#f2e14c', BLANCO, OBJETIVO_NO_TEXTO))
    expect(razonContraste(conDefecto, BLANCO)).toBeLessThan(OBJETIVO_TEXTO)
  })
})

describe('clampAcento conserva la identidad del color', () => {
  // Tolerancia: 1 grado de tono. Solo se mueve la L, así que lo único que corre el
  // tono es la cuantización a 8 bits; medido, el peor caso queda bajo 0.6°.
  it.each([
    ['amarillo sobre blanco', '#f2e14c', BLANCO],
    ['cian sobre blanco', '#15defa', BLANCO],
    ['azul oscuro sobre fondo restaurante', FONDO_PORTFOLIO, FONDO_RESTAURANTE],
    ['magenta sobre fondo portfolio', '#8b0f6e', FONDO_PORTFOLIO],
  ])('%s mantiene el tono dentro de 1°', (_descripcion, acento, fondo) => {
    const original = linealAOklch(hexALineal(acento)!).h
    const clampeado = linealAOklch(hexALineal(clampAcento(acento, fondo, OBJETIVO_TEXTO))!).h

    expect(Math.abs(clampeado - original)).toBeLessThan(1)
  })

  it.each([
    ['cian sobre el fondo oscuro de portfolio', '#15defa', FONDO_PORTFOLIO, OBJETIVO_NO_TEXTO],
    ['azul Devalpo sobre blanco', FONDO_PORTFOLIO, BLANCO, OBJETIVO_TEXTO],
    ['mayúsculas se respetan tal cual vinieron', '#15DEFA', FONDO_PORTFOLIO, OBJETIVO_NO_TEXTO],
  ])('%s: ya cumple, se devuelve intacto', (_descripcion, acento, fondo, objetivo) => {
    expect(clampAcento(acento as string, fondo as string, objetivo as number)).toBe(acento)
  })
})

describe('clampAcento degrada sin lanzar', () => {
  it.each([
    ['texto que no es color', 'no-es-color', BLANCO, '#000000'],
    ['hex con letras inválidas', '#zzz', FONDO_RESTAURANTE, '#ffffff'],
    ['string vacío', '', FONDO_PORTFOLIO, '#ffffff'],
    ['hex de largo inválido', '#12345', BLANCO, '#000000'],
    ['nombre CSS, que no se soporta', 'rebeccapurple', FONDO_PORTFOLIO, '#ffffff'],
    ['valor nulo colado desde configJson', null as unknown as string, BLANCO, '#000000'],
  ])('%s → fallback documentado', (_descripcion, acento, fondo, esperado) => {
    expect(() => clampAcento(acento as string, fondo as string)).not.toThrow()
    expect(clampAcento(acento as string, fondo as string)).toBe(esperado)
  })

  it('un fondo inválido se trata como blanco, que es el de 4 de las 6 plantillas', () => {
    expect(clampAcento('#f2e14c', 'fondo-roto', OBJETIVO_TEXTO)).toBe(clampAcento('#f2e14c', BLANCO, OBJETIVO_TEXTO))
  })

  it('acepta hex de 3 dígitos y sin numeral', () => {
    expect(hexALineal('#fff')).toEqual(hexALineal('#ffffff'))
    expect(hexALineal('15defa')).toEqual(hexALineal('#15defa'))
    expect(hexALineal('  #FFF  ')).toEqual(hexALineal('#ffffff'))
  })

  it('un hex inválido da razón 1, el peor contraste, en vez de NaN o excepción', () => {
    expect(razonContraste('roto', BLANCO)).toBe(1)
    expect(hexALineal('roto')).toBeNull()
  })

  // La guarda de convergencia: ningún color alcanza 21:1 contra un gris medio, así
  // que el clamp debe caer al fallback y NO devolver algo que falla en silencio.
  it('si el objetivo es inalcanzable devuelve el fallback, no un color que falla', () => {
    const resultado = clampAcento('#15defa', '#808080', 21)

    expect(['#000000', '#ffffff']).toContain(resultado)
    expect(razonContraste(resultado, '#808080')).toBeGreaterThan(razonContraste('#15defa', '#808080'))
  })
})
