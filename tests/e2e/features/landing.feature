Feature: Landing pública de la fábrica de sitios
  Como visitante de la landing de Devalpo
  Quiero entender la oferta de la fábrica de sitios y ver ejemplos reales
  Para decidir si empiezo mi sitio por chat (WB-42)

  Background:
    Given visito la landing pública

  Scenario: El hero muestra el mensaje principal y los llamados a la acción
    Then el título principal es "Tu sitio web listo en 1 día. Con tu dominio. Pago único."
    And el llamado a la acción principal del hero dice "Ver mi sitio gratis" y apunta a "/chat"
    And el llamado a la acción secundario del hero dice "Ver ejemplos reales" y apunta a "#ejemplos"

  Scenario: Las secciones de la página aparecen en el orden esperado
    Then las secciones de la página aparecen en este orden:
      | hero            |
      | ejemplos        |
      | como-funciona   |
      | precio          |
      | por-que-devalpo |
      | faq             |
      | cta-final       |
      | footer          |

  Scenario: Se muestran exactamente 3 ejemplos reales que abren en una pestaña nueva
    Then hay exactamente 3 tarjetas de ejemplos reales
    And cada tarjeta de ejemplo abre en una pestaña nueva
    And las tarjetas de ejemplos enlazan a "demo-restaurante", "demo-tienda" y "demo-dentista"

  Scenario: El poster del hero no carga el iframe hasta que la persona interactúa
    Then la imagen del poster del hero tiene ancho y alto definidos
    And no hay ningún iframe en la página antes de interactuar
    And el enlace "Ver en vivo →" del hero es visible

  Scenario: Al hacer clic en el poster se carga la demo en vivo
    When hago clic en "Ver el sitio funcionando"
    Then aparece un iframe en la página

  Scenario: El precio único y su letra chica se muestran correctamente
    Then el precio "$149.990" es visible
    And el estado de cupos promocionales muestra cupos disponibles o cupos agotados
    And la letra chica del precio menciona "$249.990" y "$39.990"

  Scenario: "Por qué Devalpo" incluye el gancho legal
    Then la sección "Por qué trabajar con nosotros" menciona "ley chilena"

  Scenario: Las preguntas frecuentes cubren los 6 temas requeridos
    Then la sección "Preguntas frecuentes" tiene exactamente 6 preguntas
    And las preguntas frecuentes cubren qué incluye, cuánto tarda, dominio propio, cambios, tecnología y el segundo año

  Scenario Outline: La página nunca menciona planes mensuales ni promesas prohibidas
    Then el texto de la página no contiene "<frase>"

    Examples:
      | frase                                  |
      | Agencia                                |
      | /mes                                   |
      | $29.990                                |
      | Presencia                              |
      | te aprueban                            |
      | garantizamos la aprobación             |
      | las páginas que te piden para aprobarte |
      | integración con Webpay                 |

  Scenario Outline: La página nunca usa voseo
    Then el texto de la página no contiene "<forma>"

    Examples:
      | forma  |
      | tenés  |
      | podés  |
      | querés |
