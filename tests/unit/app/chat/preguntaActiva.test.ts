import {
  agregarSugerencia,
  dividirAyuda,
  numeroDePregunta,
  opcionesApiladas,
  opcionesCompactas,
  sugerenciaYaIncluida,
} from '@/app/chat/preguntaActiva'
import {
  MENSAJE_FINAL,
  OPCIONES_ESTILO,
  PREGUNTA_CATEGORIAS,
  PREGUNTA_CIUDAD,
  PREGUNTA_DESCRIPCION,
  PREGUNTA_ESTILO,
  PREGUNTA_SERVICIOS,
  listaDeOpciones,
} from '@/infrastructure/demo/guionChat'

describe('numeroDePregunta', () => {
  it('reconoce cada pregunta del guion, contando 2a y 2b como la 2', () => {
    const casos: Array<[string, number]> = [
      ['Por el nombre, parece que es una panadería o pastelería. ¿Es correcto?\n\n• Sí, es correcto\n• No, es otra cosa', 2],
      [`${PREGUNTA_CATEGORIAS}\n\n• Panadería o pastelería`, 2],
      [PREGUNTA_DESCRIPCION, 3],
      [PREGUNTA_SERVICIOS, 4],
      [PREGUNTA_CIUDAD, 5],
      [`${PREGUNTA_ESTILO}\n\n${listaDeOpciones(OPCIONES_ESTILO)}`, 6],
      [MENSAJE_FINAL, 6],
    ]

    for (const [texto, esperado] of casos) {
      expect(numeroDePregunta(texto, 0)).toBe(esperado)
    }
  })

  it('un texto fuera del guion cae al conteo de respuestas, acotado a 1-6', () => {
    expect(numeroDePregunta('¿Cómo se llama tu negocio?', 0)).toBe(1)
    expect(numeroDePregunta('pregunta libre de Claude', 2)).toBe(3)
    expect(numeroDePregunta('pregunta libre de Claude', 20)).toBe(6)
  })
})

describe('dividirAyuda', () => {
  it('toma como ayuda lo que sigue a la primera línea en blanco', () => {
    expect(dividirAyuda(PREGUNTA_SERVICIOS)).toEqual({
      pregunta: '¿Cuáles son tus principales servicios?',
      ayuda: 'Escribe los 3 o 4 más importantes, separados por coma.',
    })
  })

  it('sin línea en blanco no hay ayuda', () => {
    expect(dividirAyuda('  ¿En qué ciudad o comuna atiendes?  ')).toEqual({
      pregunta: '¿En qué ciudad o comuna atiendes?',
      ayuda: null,
    })
  })

  it('una ayuda vacía tras el corte cuenta como sin ayuda', () => {
    expect(dividirAyuda('Pregunta\n\n   ')).toEqual({ pregunta: 'Pregunta', ayuda: null })
  })

  it('conserva líneas en blanco adicionales dentro de la ayuda', () => {
    expect(dividirAyuda('P\n\nuno\n\ndos')).toEqual({ pregunta: 'P', ayuda: 'uno\n\ndos' })
  })
})

describe('sugerencias', () => {
  it('agregarSugerencia agrega "{texto}, " al campo vacío', () => {
    expect(agregarSugerencia('', 'Ortodoncia')).toBe('Ortodoncia, ')
  })

  it('agregarSugerencia separa con coma lo que ya había, sin duplicar separadores', () => {
    expect(agregarSugerencia('Limpieza dental', 'Ortodoncia')).toBe('Limpieza dental, Ortodoncia, ')
    expect(agregarSugerencia('Limpieza dental, ', 'Ortodoncia')).toBe('Limpieza dental, Ortodoncia, ')
    expect(agregarSugerencia('Limpieza dental,', 'Ortodoncia')).toBe('Limpieza dental, Ortodoncia, ')
  })

  it('sugerenciaYaIncluida compara cada respuesta separada por coma, sin distinguir mayúsculas', () => {
    expect(sugerenciaYaIncluida('Limpieza dental, ', 'limpieza dental')).toBe(true)
    expect(sugerenciaYaIncluida('Limpieza dental, ortodoncia', 'Ortodoncia')).toBe(true)
    expect(sugerenciaYaIncluida('Limpieza', 'Limpieza dental')).toBe(false)
    expect(sugerenciaYaIncluida('', 'Ortodoncia')).toBe(false)
  })
})

describe('forma de las opciones', () => {
  it('se apilan hasta 4 opciones si ninguna pasa de 28 caracteres', () => {
    expect(opcionesApiladas(['Sí, es correcto', 'No, es otra cosa'])).toBe(true)
    expect(opcionesApiladas([...OPCIONES_ESTILO])).toBe(true)
  })

  it('van en fila si hay más de 4 o alguna es larga', () => {
    expect(opcionesApiladas(['a', 'b', 'c', 'd', 'e'])).toBe(false)
    expect(opcionesApiladas(['a'.repeat(29)])).toBe(false)
  })

  it('solo la lista larga (más de 4) usa botones compactos', () => {
    expect(opcionesCompactas(['a', 'b', 'c', 'd', 'e'])).toBe(true)
    expect(opcionesCompactas([...OPCIONES_ESTILO])).toBe(false)
  })
})
