import { ResultadoSubirImagenSitio, CampoImagenSitio } from '@/application/use-cases/SubirImagenSitio.usecase'

// Módulo puro, sin 'use server' — mismo motivo que formularioPago.ts: un
// archivo con esa directiva solo puede exportar funciones async (son
// Server Actions), así que este mapeo síncrono vive aparte para poder
// testearlo sin el runtime de Server Actions.

const ETIQUETA_CAMPO: Record<CampoImagenSitio, string> = {
  logo: 'Logo',
  hero: 'Foto principal',
  imagenes: 'Foto de galería',
}

const OK_POR_CAMPO: Record<CampoImagenSitio, string> = {
  logo: 'logo',
  hero: 'imagen_hero',
  imagenes: 'imagen_galeria',
}

// Traduce el resultado tipado de SubirImagenSitioUseCase a los params `ok`/
// `error` que ya usan el resto de las acciones de esta página (ver
// MENSAJES_OK en page.tsx e irA() en actions.ts).
export function parametrosSubidaImagen(resultado: ResultadoSubirImagenSitio, campo: CampoImagenSitio): Record<string, string> {
  switch (resultado.tipo) {
    case 'ok':
      return { ok: OK_POR_CAMPO[campo] }
    case 'formato_no_soportado':
      return { error: `${ETIQUETA_CAMPO[campo]}: formato no soportado. Solo se aceptan JPEG, PNG o WebP.` }
    case 'archivo_muy_grande':
      return { error: `${ETIQUETA_CAMPO[campo]}: el archivo supera el máximo de 5 MB.` }
    case 'no_configurado':
      return { error: 'El almacenamiento de imágenes no está configurado en este entorno.' }
    case 'error':
      return { error: `${ETIQUETA_CAMPO[campo]}: ${resultado.detalle}` }
  }
}
