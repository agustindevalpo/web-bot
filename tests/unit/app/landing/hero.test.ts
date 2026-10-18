import { HERO_CHAT, HERO_MAQUETAS } from '@/app/_landing/copy'
import { EJEMPLOS } from '@/app/_landing/ejemplos'
import { PASOS_CHAT, estadoChat, siguientePasoChat, siguienteSlide } from '@/app/_landing/hero'

describe('siguienteSlide', () => {
  it('avanza de a uno y vuelve al primero tras el último', () => {
    expect(siguienteSlide(0, 3)).toBe(1)
    expect(siguienteSlide(1, 3)).toBe(2)
    expect(siguienteSlide(2, 3)).toBe(0)
  })
})

describe('siguientePasoChat', () => {
  it('recorre los pasos 0 a PASOS_CHAT - 1 en bucle', () => {
    expect(siguientePasoChat(0)).toBe(1)
    expect(siguientePasoChat(PASOS_CHAT - 1)).toBe(0)
  })
})

describe('estadoChat', () => {
  const { guion } = HERO_CHAT

  it('en el paso 0 muestra solo el saludo del bot', () => {
    const { mensajes } = estadoChat(0, guion)
    expect(mensajes).toEqual([guion[0]])
  })

  it('muestra los puntos de "escribiendo" solo en pasos pares, antes de una respuesta del bot', () => {
    // Paso 4: ya hay 3 mensajes y el siguiente es de la persona → sin puntos.
    expect(estadoChat(4, guion).escribiendo).toBe(false)
    // Paso 6: ya hay 4 mensajes y el siguiente es del bot → puntos.
    const paso6 = estadoChat(6, guion)
    expect(paso6.mensajes).toHaveLength(4)
    expect(paso6.escribiendo).toBe(true)
    // Paso 7: mismos mensajes pero paso impar → sin puntos.
    expect(estadoChat(7, guion).escribiendo).toBe(false)
  })

  it('en el último paso muestra todo el guion y ya no escribe', () => {
    const final = estadoChat(PASOS_CHAT - 1, guion)
    expect(final.mensajes).toEqual(guion)
    expect(final.escribiendo).toBe(false)
  })

  it('nunca muestra menos de un mensaje ni más que el guion', () => {
    for (let paso = 0; paso < PASOS_CHAT; paso++) {
      const { mensajes } = estadoChat(paso, guion)
      expect(mensajes.length).toBeGreaterThanOrEqual(1)
      expect(mensajes.length).toBeLessThanOrEqual(guion.length)
    }
  })
})

describe('HERO_MAQUETAS', () => {
  it('muestra los tres sitios demo reales, en el orden de EJEMPLOS', () => {
    expect(HERO_MAQUETAS.map((m) => m.subdominio)).toEqual(EJEMPLOS.map((e) => e.subdominio))
  })

  it('usa los nombres de negocio reales del seed de demos', () => {
    expect(HERO_MAQUETAS.map((m) => m.nombre)).toEqual([
      'El Rincón del Sabor',
      'Boutique Luna Nueva',
      'Clínica Dental Sonrisas',
    ])
  })
})
