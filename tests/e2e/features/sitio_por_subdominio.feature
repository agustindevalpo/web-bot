Feature: Sitio servido por subdominio
  Como visitante de un sitio generado por WebBot
  Quiero que la página del subdominio del cliente responda correctamente
  Para que el modelo multitenant funcione (Tarea 1.5, ya en producción)

  Scenario: Sitio activo se sirve correctamente
    Given un sitio activo con subdominio "e2e-activo"
    When visito la página de ese sitio
    Then la respuesta HTTP es 200
    And la página muestra el subdominio "e2e-activo"

  Scenario: Sitio pausado no se sirve
    Given un sitio inactivo con subdominio "e2e-pausado"
    When visito la página de ese sitio
    Then la respuesta HTTP es 404

  Scenario: Subdominio inexistente no se sirve
    When visito la página del subdominio "e2e-no-existe-jamas"
    Then la respuesta HTTP es 404
