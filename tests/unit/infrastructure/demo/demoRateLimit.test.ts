import { verificarLimiteDemoIP } from '@/infrastructure/demo/demoRateLimit'

describe('verificarLimiteDemoIP', () => {
  it('permite los primeros 2 demos de la misma IP', () => {
    const ip = '192.168.1.1-test-' + Date.now()
    expect(verificarLimiteDemoIP(ip).permitido).toBe(true)
    expect(verificarLimiteDemoIP(ip).permitido).toBe(true)
  })

  it('bloquea el tercer demo de la misma IP', () => {
    const ip = '192.168.1.2-test-' + Date.now()
    verificarLimiteDemoIP(ip) // 1
    verificarLimiteDemoIP(ip) // 2
    expect(verificarLimiteDemoIP(ip).permitido).toBe(false) // 3 → bloqueado
  })

  it('IPs distintas tienen contadores independientes', () => {
    const ts = Date.now()
    const ip1 = `10.0.0.1-${ts}`
    const ip2 = `10.0.0.2-${ts}`
    verificarLimiteDemoIP(ip1)
    verificarLimiteDemoIP(ip1)
    expect(verificarLimiteDemoIP(ip2).permitido).toBe(true)
  })
})
