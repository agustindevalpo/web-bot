// Lo que el visitante escribió cuando ninguna categoría del chat le calzó
// (SiteConfigDTO.rubroDescrito). `configJson` no se valida en runtime y el
// editor JSON de /admin permite cualquier forma, así que se lee defensivo:
// solo un string con texto cuenta; cualquier otra cosa es "no hay".
export function rubroDescritoDe(configJson: Record<string, unknown>): string | null {
  const valor = configJson.rubroDescrito
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  return limpio === '' ? null : limpio
}
