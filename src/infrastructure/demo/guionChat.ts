// Textos y mapas fijos del guion de seis preguntas del chat demo
// (docs/design_handoff_plantillas_webbot/handoff_bloques_v2/03-CHAT-Y-MOMENTO-2.md,
// "Guion del chat"). Son datos puros, sin dependencias de servidor, para que
// la interfaz pueda importarlos (por ejemplo, para pintar sugerencias).

// Etiquetas amigables para el cliente — RUBROS_CONOCIDOS son las claves
// internas ("ferreteria") que nunca se le muestran. Se ofrecen en la pregunta
// 2b, y el parser las reconoce porque están armadas con las mismas keywords
// que usa `detectarRubro`.
export const RUBRO_LABELS: Record<string, string> = {
  panaderia: 'Panadería o pastelería',
  peluqueria: 'Peluquería o salón de belleza',
  dentista: 'Dentista o clínica dental',
  restaurante: 'Restaurante, café o local de comida',
  consultora: 'Consultora o asesoría (contable, tributaria, legal)',
  taller: 'Taller mecánico o automotriz',
  yoga: 'Yoga, pilates o centro de bienestar',
  ferreteria: 'Ferretería o materiales de construcción',
  veterinaria: 'Veterinaria o cuidado de mascotas',
  tienda: 'Tienda de ropa o accesorios',
}

// Frase con artículo para la pregunta 2a: "Por el nombre, parece que es …".
export const RUBRO_FRASE: Record<string, string> = {
  panaderia: 'una panadería o pastelería',
  peluqueria: 'una peluquería o salón de belleza',
  dentista: 'un dentista',
  restaurante: 'un restaurante o local de comida',
  consultora: 'una consultora',
  taller: 'un taller',
  yoga: 'un centro de yoga o bienestar',
  ferreteria: 'una ferretería',
  veterinaria: 'una veterinaria',
  tienda: 'una tienda de ropa o accesorios',
}

// Solo texto de interfaz (chips de la pregunta de servicios). El parser de
// DemoChatService NO lo lee: lo que cuenta es lo que escribe el cliente.
// Cada sugerencia es un solo servicio y no lleva " y ": parseServicios corta
// por "y", así que "Tortas y pasteles" llegaría al sitio como dos servicios.
export const SUGERENCIAS_SERVICIOS: Record<string, readonly string[]> = {
  panaderia: ['Pan amasado', 'Tortas', 'Empanadas', 'Pan de masa madre', 'Pedidos para eventos'],
  peluqueria: ['Corte de pelo', 'Tintura', 'Peinados', 'Manicure', 'Tratamientos capilares'],
  dentista: ['Limpieza dental', 'Blanqueamiento', 'Ortodoncia', 'Endodoncia', 'Implantes'],
  restaurante: ['Almuerzos del día', 'Platos a la carta', 'Desayunos', 'Delivery', 'Banquetería'],
  consultora: ['Asesoría tributaria', 'Contabilidad', 'Declaración de renta', 'Constitución de empresas', 'Asesoría legal'],
  taller: ['Mantención general', 'Cambio de aceite', 'Frenos', 'Diagnóstico computarizado', 'Revisión técnica'],
  yoga: ['Clases de yoga', 'Pilates', 'Meditación', 'Clases particulares', 'Talleres de bienestar'],
  ferreteria: ['Herramientas', 'Pinturas', 'Materiales de construcción', 'Artículos de gasfitería', 'Materiales eléctricos'],
  veterinaria: ['Consulta veterinaria', 'Vacunación', 'Peluquería canina', 'Cirugías', 'Urgencias'],
  tienda: ['Ropa de mujer', 'Ropa de hombre', 'Accesorios', 'Calzado', 'Ropa de niños'],
}

export const OPCION_NINGUNO = 'Ninguno de estos'

// Botones de la pregunta 2a. Contrato del parser: el texto exacto importa.
export const OPCION_CONFIRMAR_RUBRO = 'Sí, es correcto'
export const OPCION_RECHAZAR_RUBRO = 'No, es otra cosa'

// Botones de la pregunta de estilo. Contrato D-29: el texto exacto importa.
export const OPCIONES_ESTILO = ['Moderno y minimalista', 'Cálido y cercano', 'Colorido y llamativo'] as const

export const PREGUNTA_CATEGORIAS = '¿Cuál de estas categorías describe mejor tu negocio?'
export const PREGUNTA_DESCRIPCION = '¿A qué se dedica tu negocio? Cuéntalo en una o dos frases.'
export const PREGUNTA_SERVICIOS =
  '¿Cuáles son tus principales servicios?\n\nEscribe los 3 o 4 más importantes, separados por coma.'
export const PREGUNTA_CIUDAD = '¿En qué ciudad o comuna atiendes?'
export const PREGUNTA_ESTILO = '¿Qué estilo prefieres para tu sitio?'

export const MENSAJE_FINAL = 'Listo. Ya tengo lo necesario para armar tu sitio.'

export function listaDeOpciones(opciones: readonly string[]): string {
  return opciones.map((opcion) => `• ${opcion}`).join('\n')
}
