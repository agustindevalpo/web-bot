Feature: Sitio servido por dominio propio
  Como cliente de WebBot con dominio propio
  Quiero que mi sitio responda cuando la petición llega desde mi dominio
  Para no depender del subdominio de sitios.devalpo.cl (WB-26)

  # El Worker de Cloudflare agrega X-WebBot-Forwarded-Host con el dominio original;
  # en local se simula esa cabecera directamente (WORKER_SHARED_SECRET vacío).

  Scenario: Sitio con dominio propio se sirve por X-WebBot-Forwarded-Host
    Given un sitio activo con subdominio "e2e-dominio" y dominio propio "e2e-dominio.webbot.test"
    When visito la raíz con la cabecera X-WebBot-Forwarded-Host "e2e-dominio.webbot.test"
    Then la respuesta HTTP es 200
    And la página muestra el subdominio "e2e-dominio"

  Scenario: Dominio propio desconocido no se sirve
    When visito la raíz con la cabecera X-WebBot-Forwarded-Host "e2e-no-existe-jamas.webbot.test"
    Then la respuesta HTTP es 404
