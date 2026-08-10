import { Sesion } from '@/domain/entities/Sesion'

describe('Sesion entity', () => {
  let sesion: Sesion

  beforeEach(() => {
    sesion = new Sesion('sesion-1', 'session-abc')
  })

  it('empieza sin historial y no completada', () => {
    expect(sesion.historial).toHaveLength(0)
    expect(sesion.completada).toBe(false)
    expect(sesion.datosJson).toBeNull()
  })

  it('agregarMensaje() acumula en el historial con timestamp', () => {
    sesion.agregarMensaje('assistant', '¿Cómo se llama tu negocio?')
    sesion.agregarMensaje('user', 'Panadería El Trigal')

    expect(sesion.historial).toHaveLength(2)
    expect(sesion.historial[0]).toMatchObject({ rol: 'assistant', contenido: '¿Cómo se llama tu negocio?' })
    expect(sesion.historial[0].timestamp).toBeInstanceOf(Date)
  })

  it('marcarCompletada() guarda los datos extraídos y marca completada', () => {
    const datos = { nombre: 'Panadería El Trigal' }
    sesion.marcarCompletada(datos)

    expect(sesion.completada).toBe(true)
    expect(sesion.datosJson).toEqual(datos)
  })

  it('cantidadIntercambios() cuenta pares pregunta-respuesta', () => {
    sesion.agregarMensaje('assistant', 'P1')
    sesion.agregarMensaje('user', 'R1')
    sesion.agregarMensaje('assistant', 'P2')

    expect(sesion.cantidadIntercambios()).toBe(1)
  })
})
