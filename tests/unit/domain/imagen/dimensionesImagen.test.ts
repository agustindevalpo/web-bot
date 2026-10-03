import { leerDimensionesImagen } from '@/domain/imagen/dimensionesImagen'

function png(ancho: number, alto: number): Uint8Array {
  const b = new Uint8Array(33)
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  const v = new DataView(b.buffer)
  v.setUint32(16, ancho)
  v.setUint32(20, alto)
  return b
}

// JPEG con un APP0 de relleno antes del SOF para ejercitar el salto de segmentos.
function jpeg(ancho: number, alto: number, sof = 0xc0): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
    0xff, sof, 0x00, 0x0b, 0x08, alto >> 8, alto & 0xff, ancho >> 8, ancho & 0xff, 0x01, 0x11, 0x00,
  ])
}

function riff(chunk: string, cuerpo: number[]): Uint8Array {
  const texto = (s: string) => [...s].map((c) => c.charCodeAt(0))
  return new Uint8Array([...texto('RIFF'), 0, 0, 0, 0, ...texto('WEBP'), ...texto(chunk), 0, 0, 0, 0, ...cuerpo])
}

function webpLossy(ancho: number, alto: number): Uint8Array {
  // 3 bytes de frame tag + código de inicio + ancho/alto de 16 bits LE
  return riff('VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, ancho & 0xff, ancho >> 8, alto & 0xff, alto >> 8])
}

function webpLossless(ancho: number, alto: number): Uint8Array {
  const bits = ((ancho - 1) | ((alto - 1) << 14)) >>> 0
  return riff('VP8L', [0x2f, bits & 0xff, (bits >>> 8) & 0xff, (bits >>> 16) & 0xff, (bits >>> 24) & 0xff])
}

function webpExtendido(ancho: number, alto: number): Uint8Array {
  const w = ancho - 1
  const h = alto - 1
  return riff('VP8X', [0, 0, 0, 0, w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff, h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff])
}

describe('leerDimensionesImagen', () => {
  it('lee PNG (IHDR)', () => {
    expect(leerDimensionesImagen(png(640, 480))).toEqual({ ancho: 640, alto: 480 })
  })

  it.each([0xc0, 0xc1, 0xc2])('lee JPEG con SOF %i saltando segmentos previos', (sof) => {
    expect(leerDimensionesImagen(jpeg(300, 1200, sof))).toEqual({ ancho: 300, alto: 1200 })
  })

  it('lee WebP lossy (VP8)', () => {
    expect(leerDimensionesImagen(webpLossy(320, 200))).toEqual({ ancho: 320, alto: 200 })
  })

  it('lee WebP lossless (VP8L)', () => {
    expect(leerDimensionesImagen(webpLossless(1000, 250))).toEqual({ ancho: 1000, alto: 250 })
  })

  it('lee WebP extendido (VP8X)', () => {
    expect(leerDimensionesImagen(webpExtendido(4000, 90))).toEqual({ ancho: 4000, alto: 90 })
  })

  it('devuelve null para buffers truncados', () => {
    expect(leerDimensionesImagen(png(10, 10).slice(0, 20))).toBeNull()
    expect(leerDimensionesImagen(jpeg(10, 10).slice(0, 12))).toBeNull()
    expect(leerDimensionesImagen(webpLossy(10, 10).slice(0, 20))).toBeNull()
    expect(leerDimensionesImagen(webpLossless(10, 10).slice(0, 22))).toBeNull()
    expect(leerDimensionesImagen(webpExtendido(10, 10).slice(0, 26))).toBeNull()
  })

  it('devuelve null para dimensiones cero', () => {
    expect(leerDimensionesImagen(png(0, 10))).toBeNull()
  })

  it('devuelve null para JPEG sin SOF antes del SOS y para formatos desconocidos', () => {
    expect(leerDimensionesImagen(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02]))).toBeNull()
    expect(leerDimensionesImagen(new TextEncoder().encode('<svg></svg>'))).toBeNull()
    expect(leerDimensionesImagen(new Uint8Array([]))).toBeNull()
  })

  it('devuelve null (sin lanzar) ante un JPEG con largo de segmento corrupto', () => {
    expect(leerDimensionesImagen(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xff, 0x00]))).toBeNull()
  })
})
