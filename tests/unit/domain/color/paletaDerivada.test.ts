import {
  derivarPaletaDesdeAcento,
  ganadorDeContraste,
  resolverPrimarioYTexto,
  L_PRIMARIO,
  L_SECUNDARIO,
} from '@/domain/color/paletaDerivada'
import { hexALineal, linealAHex, linealAOklch, mapearAGamut, razonContraste, OBJETIVO_TEXTO } from '@/domain/color/contraste'
import { RUBRO_DEFAULTS } from '@/infrastructure/demo/rubroDefaults'

const HEX_VALIDO = /^#[0-9a-f]{6}$/i

// Los 11 acentos reales de RUBRO_DEFAULTS (10 rubros + "otro"), tal cual están
// en la tabla — no se inventan valores nuevos.
const ACENTOS_RUBRO = Object.entries(RUBRO_DEFAULTS).map(([rubro, valores]) => [rubro, valores.colores.acento] as const)

describe('derivarPaletaDesdeAcento — contraste de texto', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): el texto derivado cumple 4.5:1 contra el primario derivado', (_rubro, acento) => {
    const { primario, texto } = derivarPaletaDesdeAcento(acento)

    expect(razonContraste(texto, primario)).toBeGreaterThanOrEqual(OBJETIVO_TEXTO)
  })

  it('texto es siempre blanco o negro', () => {
    for (const [, acento] of ACENTOS_RUBRO) {
      const { texto } = derivarPaletaDesdeAcento(acento)
      expect(['#ffffff', '#000000']).toContain(texto)
    }
  })
})

describe('derivarPaletaDesdeAcento — determinismo', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): misma entrada da siempre la misma salida', (_rubro, acento) => {
    expect(derivarPaletaDesdeAcento(acento)).toEqual(derivarPaletaDesdeAcento(acento))
  })
})

describe('derivarPaletaDesdeAcento — degrada sin lanzar', () => {
  it.each([
    ['texto que no es color', 'no-es-color'],
    ['hex con letras inválidas', '#zzz'],
    ['string vacío', ''],
    ['hex de largo inválido', '#12345'],
    ['nombre CSS, que no se soporta', 'rebeccapurple'],
    ['valor nulo colado desde configJson', null as unknown as string],
    ['valor undefined colado desde configJson', undefined as unknown as string],
  ])('%s → no lanza y devuelve una paleta válida', (_descripcion, acento) => {
    expect(() => derivarPaletaDesdeAcento(acento as string)).not.toThrow()

    const paleta = derivarPaletaDesdeAcento(acento as string)
    expect(paleta.primario).toMatch(HEX_VALIDO)
    expect(paleta.secundario).toMatch(HEX_VALIDO)
    expect(['#ffffff', '#000000']).toContain(paleta.texto)
  })

  it('un acento inválido no devuelve undefined en ningún campo', () => {
    const paleta = derivarPaletaDesdeAcento('no-es-color')

    expect(paleta.primario).toBeDefined()
    expect(paleta.secundario).toBeDefined()
    expect(paleta.texto).toBeDefined()
  })
})

describe('derivarPaletaDesdeAcento — salida siempre en sRGB válido', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): primario y secundario son hex de 6 dígitos', (_rubro, acento) => {
    const { primario, secundario } = derivarPaletaDesdeAcento(acento)

    expect(primario).toMatch(HEX_VALIDO)
    expect(secundario).toMatch(HEX_VALIDO)
  })
})

describe('derivarPaletaDesdeAcento — orden de luminosidad', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): primario es más oscuro que secundario', (_rubro, acento) => {
    const { primario, secundario } = derivarPaletaDesdeAcento(acento)

    const lPrimario = linealAOklch(hexALineal(primario)!).l
    const lSecundario = linealAOklch(hexALineal(secundario)!).l

    expect(lPrimario).toBeLessThan(lSecundario)
  })

  // Todos los acentos de RUBRO_DEFAULTS son claros (ver la tabla): con L de
  // origen mayor que L_SECUNDARIO, `secundario` (L_SECUNDARIO) queda más
  // oscuro o igual que el acento de partida.
  it.each(ACENTOS_RUBRO)('%s (%s): secundario es más oscuro o igual que el acento original', (_rubro, acento) => {
    const { secundario } = derivarPaletaDesdeAcento(acento)

    const lAcento = linealAOklch(hexALineal(acento)!).l
    const lSecundario = linealAOklch(hexALineal(secundario)!).l

    expect(lSecundario).toBeLessThanOrEqual(lAcento)
  })

  it('primario y secundario preservan la L nominal pedida (cuando el gamut no obliga a recortar croma)', () => {
    // #15defa (cian, acento por defecto) no está pegado al borde de sRGB en
    // L=0.22/0.45, así que el mapeo de gamut no debería moverle la L.
    const { primario, secundario } = derivarPaletaDesdeAcento('#15defa')

    expect(linealAOklch(hexALineal(primario)!).l).toBeCloseTo(L_PRIMARIO, 2)
    expect(linealAOklch(hexALineal(secundario)!).l).toBeCloseTo(L_SECUNDARIO, 2)
  })
})

// Distancia angular circular entre dos tonos OKLCH en grados: la resta
// directa (como usaba la versión anterior de este test, con un solo acento
// no cercano al límite 0°/360°) da un valor absurdo cuando los dos tonos
// caen a los dos lados de ese límite — ver "veterinaria" (#fd79a8) más abajo,
// hPrimario≈0.006°, hSecundario≈359.5°: la resta directa da ~359.5° en vez
// de los ~0.46° reales. No es aflojar el umbral, es medir la MISMA cantidad
// ("cuánto se separan dos tonos") correctamente para un círculo.
function distanciaAngular(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

// R3-prueba-de-tono-sobre-un-solo-acento: la versión anterior de este test
// solo ejercitaba '#15defa'. Al parametrizar sobre los 11 acentos reales
// (como el resto del archivo) aparecen dos que SÍ corren el tono más de 1°
// entre `primario` y `secundario` — ver el describe de abajo. No se sube el
// umbral para taparlos: se separan como hallazgo conocido y reportado, sin
// tocar la aserción de los otros 9.
const RUBROS_CON_DESVIO_DE_TONO_CONOCIDO = new Set(['dentista', 'yoga'])
const ACENTOS_SIN_DESVIO_DE_TONO = ACENTOS_RUBRO.filter(([rubro]) => !RUBROS_CON_DESVIO_DE_TONO_CONOCIDO.has(rubro))
const ACENTOS_CON_DESVIO_DE_TONO = ACENTOS_RUBRO.filter(([rubro]) => RUBROS_CON_DESVIO_DE_TONO_CONOCIDO.has(rubro))

describe('derivarPaletaDesdeAcento — preserva tono y croma entre primario y secundario', () => {
  it.each(ACENTOS_SIN_DESVIO_DE_TONO)('%s (%s): primario y secundario comparten tono (delta < 1°)', (_rubro, acento) => {
    const { primario, secundario } = derivarPaletaDesdeAcento(acento)

    const hPrimario = linealAOklch(hexALineal(primario)!).h
    const hSecundario = linealAOklch(hexALineal(secundario)!).h

    expect(distanciaAngular(hPrimario, hSecundario)).toBeLessThan(1)
  })

  // HALLAZGO REPORTADO (no oculto, no destensado): para 'dentista' (#0891B2)
  // y 'yoga' (#f0c040) el tono SÍ corre más de 1° entre `primario` (L=0.22)
  // y `secundario` (L=0.45) — delta medido ≈1.2231° y ≈1.4089° respectivamente
  // (valores exactos obtenidos corriendo `derivarPaletaDesdeAcento` sobre los
  // acentos reales de RUBRO_DEFAULTS, no inventados). Causa observada:
  // `mapearAGamut` recorta el croma pedido de forma distinta en cada L
  // (dentista: croma sobreviviente ≈0.0405 en primario contra ≈0.0830 en
  // secundario — casi el doble), y la cuantización a hex de 8 bits al volver
  // de OKLCH arrastra el tono más que en los otros 9 acentos, donde la
  // brecha de croma entre ambos L es menor.
  //
  // R3-invariante-de-tono-silenciada: en vez de dejar esto como `skip` (sin
  // señal) o de aflojar el umbral de 1° para todos (destensa el resto), el
  // desvío conocido queda PINEADO acá como cota superior justo por encima de
  // lo medido — cualquier cambio futuro que lo ensanche, o que empuje un
  // tercer rubro sobre el umbral, rompe el build.
  const DESVIO_MAXIMO_CONOCIDO: Record<string, number> = {
    dentista: 1.25,
    yoga: 1.45,
  }

  it.each(ACENTOS_CON_DESVIO_DE_TONO)(
    '%s (%s): el desvío de tono conocido no crece más allá de la cota pineada',
    (rubro, acento) => {
      const { primario, secundario } = derivarPaletaDesdeAcento(acento)

      const hPrimario = linealAOklch(hexALineal(primario)!).h
      const hSecundario = linealAOklch(hexALineal(secundario)!).h
      const delta = distanciaAngular(hPrimario, hSecundario)

      expect(delta).toBeGreaterThan(1) // sigue siendo el caso conocido, no una regresión que ya no aplica
      expect(delta).toBeLessThanOrEqual(DESVIO_MAXIMO_CONOCIDO[rubro])
    },
  )
})

// R3-fallback-de-contraste-sin-cobertura: `ganadorDeContraste` y la rama de
// reajuste de `resolverPrimarioYTexto` (paletaDerivada.ts) no tenían ningún
// test directo — los 11 acentos de RUBRO_DEFAULTS y el barrido de 720 puntos
// de más abajo son todos suficientemente oscuros en L_PRIMARIO (0.22) como
// para que blanco gane siempre y el reajuste nunca se dispare.
describe('ganadorDeContraste — ambas ramas del selector de texto', () => {
  it('con un primario oscuro, blanco gana', () => {
    expect(ganadorDeContraste('#001f28')).toBe('#ffffff')
  })

  it('con un primario claro, negro gana — rama nunca antes ejercitada', () => {
    expect(ganadorDeContraste('#dedede')).toBe('#000000')
  })
})

// Con el `objetivo` de producción (OBJETIVO_TEXTO = 4.5) el reajuste es
// matemáticamente inalcanzable para CUALQUIER fondo: el punto de empate
// entre el contraste con negro ((Y+0.05)/0.05) y con blanco (1.05/(Y+0.05))
// se da en Y≈0.1791, donde ambos valen ~4.583 — y alejarse de ese punto en
// cualquier dirección solo aumenta el contraste del ganador. Por eso ningún
// acento real puede disparar la rama con el objetivo real (ver también el
// comentario sobre `resolverPrimarioYTexto` en paletaDerivada.ts). Los casos
// de abajo pasan un `objetivo` explícito más exigente que 4.583 para forzar
// la rama de forma determinística y reproducible, y confirman igual que el
// resultado cumple `OBJETIVO_TEXTO` de sobra.
describe('resolverPrimarioYTexto — rama de reajuste de contraste', () => {
  it('con un primario ya claro y el objetivo de producción, negro gana sin pasar por el reajuste', () => {
    const oklch = { l: 0.9, c: 0, h: 0 }
    const { primario, texto } = resolverPrimarioYTexto(oklch, 0.9)

    expect(texto).toBe('#000000')
    expect(razonContraste(texto, primario)).toBeGreaterThanOrEqual(OBJETIVO_TEXTO)
    // La L del resultado queda prácticamente igual a la de entrada: prueba de
    // que NO pasó por `clampAcento` (si hubiera reajustado se habría movido
    // bastante más — ver los dos casos de abajo, donde sí se dispara).
    expect(linealAOklch(hexALineal(primario)!).l).toBeCloseTo(0.9, 2)
  })

  it('con negro como texto ganador y un objetivo que no se alcanza de entrada, el reajuste ACLARA el primario', () => {
    const oklch = { l: 0.6, c: 0, h: 0 }
    const objetivoExigente = 15 // por encima del contraste inicial: fuerza la rama

    const { primario, texto } = resolverPrimarioYTexto(oklch, 0.6, objetivoExigente)

    expect(texto).toBe('#000000')
    expect(razonContraste(texto, primario)).toBeGreaterThanOrEqual(objetivoExigente)
    expect(razonContraste(texto, primario)).toBeGreaterThanOrEqual(OBJETIVO_TEXTO)
    // Reajustó ACLARANDO: alejarse de negro (subir la L) es lo que aumenta el
    // contraste cuando el texto ganador es negro.
    expect(linealAOklch(hexALineal(primario)!).l).toBeGreaterThan(0.6)
  })

  it('con blanco como texto ganador y un objetivo que no se alcanza de entrada, el reajuste OSCURECE el primario', () => {
    const oklch = { l: 0.35, c: 0, h: 0 }
    const objetivoExigente = 15

    const { primario, texto } = resolverPrimarioYTexto(oklch, 0.35, objetivoExigente)

    expect(texto).toBe('#ffffff')
    expect(razonContraste(texto, primario)).toBeGreaterThanOrEqual(objetivoExigente)
    expect(razonContraste(texto, primario)).toBeGreaterThanOrEqual(OBJETIVO_TEXTO)
    // Reajustó OSCURECIENDO: alejarse de blanco (bajar la L) es lo que
    // aumenta el contraste cuando el texto ganador es blanco.
    expect(linealAOklch(hexALineal(primario)!).l).toBeLessThan(0.35)
  })
})

// R3-texto-contraste-no-garantizado: la tabla por rubro (ACENTOS_RUBRO,
// arriba) son solo 11 puntos del espacio de acentos posibles — no alcanzan
// para sostener la garantía de 4.5:1 que promete el header del módulo. Este
// barrido cubre muchos tonos, luminosidades y cromas de un acento de
// cliente ARBITRARIO (no solo los de la tabla) para que un futuro cambio que
// rompa la garantía falle acá, no en producción.
describe('derivarPaletaDesdeAcento — garantía de contraste para un acento arbitrario', () => {
  it('para un barrido amplio de tonos/luminosidades/cromas, el texto derivado siempre cumple 4.5:1 contra el primario', () => {
    const HUES = Array.from({ length: 18 }, (_, i) => i * 20) // 0..340, cada 20°
    const LUMINOSIDADES = Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.1) // 0.05..0.95
    const CROMAS = [0.05, 0.12, 0.19, 0.26]

    const incumplimientos: string[] = []

    for (const h of HUES) {
      for (const l of LUMINOSIDADES) {
        for (const c of CROMAS) {
          const acento = linealAHex(mapearAGamut({ l, c, h }))
          const { primario, texto } = derivarPaletaDesdeAcento(acento)
          const contraste = razonContraste(texto, primario)

          if (contraste < OBJETIVO_TEXTO) {
            incumplimientos.push(`h=${h} l=${l.toFixed(2)} c=${c} acento=${acento} → contraste=${contraste.toFixed(3)}`)
          }
        }
      }
    }

    expect(incumplimientos).toEqual([])
  })
})

// R3-regresion-visual-no-cubierta: valores esperados FIJOS (literales, no
// calculados dentro del test) para los 11 acentos reales de RUBRO_DEFAULTS —
// los mismos que ya usa ACENTOS_RUBRO arriba, leídos de la fuente, no
// inventados. Un ajuste futuro de `L_PRIMARIO`/`L_SECUNDARIO` o de la regla
// de derivación tiene que romper esta prueba de forma ruidosa.
const PALETA_ESPERADA_POR_RUBRO: Record<string, { primario: string; secundario: string; texto: string }> = {
  panaderia: { primario: '#2c1300', secundario: '#804300', texto: '#ffffff' },
  peluqueria: { primario: '#39000c', secundario: '#a10032', texto: '#ffffff' },
  dentista: { primario: '#001f28', secundario: '#005f76', texto: '#ffffff' },
  restaurante: { primario: '#340b00', secundario: '#932e00', texto: '#ffffff' },
  consultora: { primario: '#001f25', secundario: '#00606e', texto: '#ffffff' },
  taller: { primario: '#360700', secundario: '#992500', texto: '#ffffff' },
  yoga: { primario: '#231900', secundario: '#6b5100', texto: '#ffffff' },
  ferreteria: { primario: '#291600', secundario: '#784900', texto: '#ffffff' },
  veterinaria: { primario: '#380019', secundario: '#971752', texto: '#ffffff' },
  tienda: { primario: '#291600', secundario: '#774a00', texto: '#ffffff' },
  otro: { primario: '#111c27', secundario: '#4a5764', texto: '#ffffff' },
}

describe('derivarPaletaDesdeAcento — valores dorados por rubro (regresión visual)', () => {
  it.each(ACENTOS_RUBRO)('%s (%s): la paleta derivada coincide con el valor fijado', (rubro, acento) => {
    const esperado = PALETA_ESPERADA_POR_RUBRO[rubro]
    expect(esperado).toBeDefined()

    const { primario, secundario, texto } = derivarPaletaDesdeAcento(acento)

    expect({ primario, secundario, texto }).toEqual(esperado)
  })

  it('PALETA_ESPERADA_POR_RUBRO cubre exactamente los rubros de RUBRO_DEFAULTS', () => {
    expect(Object.keys(PALETA_ESPERADA_POR_RUBRO).sort()).toEqual(Object.keys(RUBRO_DEFAULTS).sort())
  })
})
