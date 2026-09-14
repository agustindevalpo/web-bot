// Convierte un mensaje del asistente en prosa + opciones clicables, para que
// el cliente no tenga que tipear la respuesta a una pregunta de selección
// múltiple. Se parsea el texto en vez de agregar un campo estructurado a la
// respuesta de la API porque ClaudeChatService genera la pregunta con el
// modelo — nunca podría poblar un campo estructurado de forma confiable — y
// un campo que solo existiera en modo demo dejaría el modo real sin botones.
// Ambos servicios (DemoChatService y el prompt de Claude) usan el mismo
// formato de viñeta "• opción", así que un solo parser sirve para los dos.

export interface MensajeConOpciones {
  texto: string
  opciones: string[]
}

const PREFIJO_VIÑETA = /^\s*•\s*(.+)$/

/**
 * Extrae las líneas "• opción" de un mensaje y devuelve el resto del texto
 * (sin esas líneas) junto con las opciones, en el mismo orden en que
 * aparecen y sin el prefijo ni espacios sobrantes. Un mensaje sin viñetas
 * vuelve intacto y con la lista de opciones vacía — así el comportamiento
 * actual (tipear la respuesta) no cambia cuando no hay nada que ofrecer como
 * botón.
 */
export function extraerOpciones(mensaje: string): MensajeConOpciones {
  const opciones: string[] = []
  const lineasRestantes: string[] = []

  for (const linea of mensaje.split('\n')) {
    const coincidencia = linea.match(PREFIJO_VIÑETA)
    if (coincidencia) {
      opciones.push(coincidencia[1].trim())
    } else {
      lineasRestantes.push(linea)
    }
  }

  // Al quitar las líneas de viñeta quedan saltos de línea consecutivos donde
  // antes había una lista — se colapsan a lo sumo a una línea en blanco para
  // no dejarle al cliente un hueco visual del tamaño de la lista original.
  const texto = lineasRestantes.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  return { texto, opciones }
}
