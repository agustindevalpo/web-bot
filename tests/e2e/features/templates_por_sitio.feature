Feature: Templates por sitio
  Como visitante de un sitio generado por WebBot
  Quiero que cada Template renderice su sección distintiva
  Para verificar el cutover de la Fase de templates (WB-22)

  Scenario: Template LANDING renderiza "Qué ofrecemos"
    Given un sitio con template "LANDING" y subdominio "e2e-template-landing"
    When visito la página de ese sitio
    Then la respuesta HTTP es 200
    And la página muestra la sección "Qué ofrecemos"
    And la página tiene el atributo data-template "LANDING"

  Scenario: Template SERVICIOS renderiza "Servicios"
    Given un sitio con template "SERVICIOS" y subdominio "e2e-template-servicios"
    When visito la página de ese sitio
    Then la respuesta HTTP es 200
    And la página muestra la sección "Servicios"
    And la página tiene el atributo data-template "SERVICIOS"

  Scenario: Template RESTAURANTE renderiza "Menú"
    Given un sitio con template "RESTAURANTE" y subdominio "e2e-template-restaurante"
    When visito la página de ese sitio
    Then la respuesta HTTP es 200
    And la página muestra la sección "Menú"
    And la página tiene el atributo data-template "RESTAURANTE"

  Scenario: Template PORTFOLIO renderiza "Trabajos"
    Given un sitio con template "PORTFOLIO" y subdominio "e2e-template-portfolio"
    When visito la página de ese sitio
    Then la respuesta HTTP es 200
    And la página muestra la sección "Trabajos"
    And la página tiene el atributo data-template "PORTFOLIO"

  Scenario: Template TIENDA renderiza "Productos"
    Given un sitio con template "TIENDA" y subdominio "e2e-template-tienda"
    When visito la página de ese sitio
    Then la respuesta HTTP es 200
    And la página muestra la sección "Productos"
    And la página tiene el atributo data-template "TIENDA"
