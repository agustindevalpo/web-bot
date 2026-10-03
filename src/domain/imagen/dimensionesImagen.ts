// Lee el ancho y alto intrínsecos de una imagen JPEG, PNG o WebP desde su
// cabecera, sin decodificarla ni agregar dependencias. Función pura: ante
// cualquier buffer truncado, corrupto o de otro formato devuelve `null`, nunca
// lanza (que no se puedan leer las dimensiones no es un error de subida).
export interface DimensionesImagen {
  ancho: number
  alto: number
}

export function leerDimensionesImagen(bytes: Uint8Array): DimensionesImagen | null {
  try {
    if (esPng(bytes)) return dimensionesPng(bytes)
    if (esJpeg(bytes)) return dimensionesJpeg(bytes)
    if (esWebp(bytes)) return dimensionesWebp(bytes)
  } catch {
    return null
  }
  return null
}

function valido(ancho: number, alto: number): DimensionesImagen | null {
  return Number.isInteger(ancho) && Number.isInteger(alto) && ancho > 0 && alto > 0 ? { ancho, alto } : null
}

function ascii(bytes: Uint8Array, desde: number, largo: number): string {
  let texto = ''
  for (let i = desde; i < desde + largo; i++) texto += String.fromCharCode(bytes[i])
  return texto
}

const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1]
const u32be = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8)
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)

function esPng(b: Uint8Array): boolean {
  return b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)
}

function esJpeg(b: Uint8Array): boolean {
  return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
}

function esWebp(b: Uint8Array): boolean {
  return b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP'
}

// PNG: la firma de 8 bytes va seguida del chunk IHDR (largo, "IHDR", ancho, alto).
function dimensionesPng(b: Uint8Array): DimensionesImagen | null {
  if (b.length < 24 || ascii(b, 12, 4) !== 'IHDR') return null
  return valido(u32be(b, 16), u32be(b, 20))
}

// JPEG: recorre los segmentos hasta el primer marcador SOF (C0-CF salvo
// C4 = DHT, C8 = JPG, CC = DAC), que trae alto y ancho de 16 bits.
function dimensionesJpeg(b: Uint8Array): DimensionesImagen | null {
  let i = 2
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) return null
    const marcador = b[i + 1]
    if (marcador === 0xff) {
      i += 1 // relleno
      continue
    }
    if (marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd8)) {
      i += 2 // marcadores sin cuerpo
      continue
    }
    if (marcador === 0xd9 || marcador === 0xda) return null // EOI / SOS: ya no hay SOF
    const esSof = marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc
    if (esSof) {
      if (i + 8 >= b.length) return null
      return valido(u16be(b, i + 7), u16be(b, i + 5))
    }
    i += 2 + u16be(b, i + 2)
  }
  return null
}

// WebP: contenedor RIFF; el primer chunk dice el subformato.
function dimensionesWebp(b: Uint8Array): DimensionesImagen | null {
  if (b.length < 16) return null
  const chunk = ascii(b, 12, 4)
  if (chunk === 'VP8 ') {
    // Lossy: tag de frame (3 bytes), código de inicio 9d 01 2a, ancho/alto de 14 bits.
    if (b.length < 30 || b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null
    return valido(u16le(b, 26) & 0x3fff, u16le(b, 28) & 0x3fff)
  }
  if (chunk === 'VP8L') {
    // Lossless: firma 0x2f y 28 bits empaquetados (ancho-1, alto-1) de 14 bits.
    if (b.length < 25 || b[20] !== 0x2f) return null
    const bits = (b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24)) >>> 0
    return valido((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1)
  }
  if (chunk === 'VP8X') {
    // Extendido: lienzo de 24 bits por lado, guardado como valor-1.
    if (b.length < 30) return null
    return valido(u24le(b, 24) + 1, u24le(b, 27) + 1)
  }
  return null
}
