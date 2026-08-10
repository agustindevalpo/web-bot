export const EXTRACTOR_PROMPT = `
Analiza la conversación y extrae los datos del negocio.
Devuelve SOLO JSON válido, sin texto adicional, sin markdown, sin backticks.

FORMATO EXACTO:
{
  "nombre": "nombre del negocio",
  "rubro": "panaderia|peluqueria|dentista|restaurante|consultora|taller|yoga|ferreteria|veterinaria|tienda|portfolio|landing",
  "descripcion": "descripción de 1-2 frases",
  "servicios": ["servicio 1", "servicio 2", "servicio 3"],
  "ciudad": "ciudad",
  "contacto": { "telefono": "56912345678", "email": "email@ejemplo.cl" },
  "redes": { "instagram": "@usuario o null", "facebook": "url o null" },
  "estilo": "moderno|calido|colorido",
  "highlight": "diferenciador o frase especial"
}
`.trim()
