import { extraerOpciones } from '@/app/chat/opciones'

// Texto copiado literal de PREGUNTAS[5] en DemoChatService.ts — si ese
// mensaje cambia de formato, este test debe fallar para que alguien revise
// el parser, no seguir en verde sobre un texto que ya no existe.
const PREGUNTA_ESTILO_VERBATIM =
  '¿Qué estilo visual prefieres para tu sitio?\n\n• Moderno y minimalista\n• Cálido y cercano\n• Colorido y llamativo'

describe('extraerOpciones', () => {
  it('separa la prosa de las opciones en un mensaje con viñetas', () => {
    const resultado = extraerOpciones('Elige una opción:\n\n• Uno\n• Dos\n• Tres')

    expect(resultado.texto).toBe('Elige una opción:')
    expect(resultado.opciones).toEqual(['Uno', 'Dos', 'Tres'])
  })

  it('devuelve el mensaje intacto y sin opciones cuando no hay viñetas', () => {
    const mensaje = '¿Cómo se llama tu negocio?'
    const resultado = extraerOpciones(mensaje)

    expect(resultado.texto).toBe(mensaje)
    expect(resultado.opciones).toEqual([])
  })

  it('tolera líneas en blanco antes, entre y después de las viñetas', () => {
    const resultado = extraerOpciones('Pregunta\n\n\n• A\n\n• B\n\n\n')

    expect(resultado.texto).toBe('Pregunta')
    expect(resultado.opciones).toEqual(['A', 'B'])
  })

  it('conserva la puntuación interna de una opción (rubro real con paréntesis y comas)', () => {
    const resultado = extraerOpciones(
      '¿Cuál de estas categorías describe mejor tu negocio?\n\n• Consultora o asesoría (contable, tributaria, legal)\n• Ninguno de estos',
    )

    expect(resultado.texto).toBe('¿Cuál de estas categorías describe mejor tu negocio?')
    expect(resultado.opciones).toEqual(['Consultora o asesoría (contable, tributaria, legal)', 'Ninguno de estos'])
  })

  it('parsea la pregunta de estilo visual real, verbatim, de PREGUNTAS', () => {
    const resultado = extraerOpciones(PREGUNTA_ESTILO_VERBATIM)

    expect(resultado.texto).toBe('¿Qué estilo visual prefieres para tu sitio?')
    expect(resultado.opciones).toEqual(['Moderno y minimalista', 'Cálido y cercano', 'Colorido y llamativo'])
  })
})
