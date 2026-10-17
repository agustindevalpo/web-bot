import { FIXTURES_RESTAURANTE, SUBDOMINIOS_FIXTURES_RESTAURANTE } from '../../../prisma/fixturesRestaurante'
import { buildCarta, buildDatosHero } from '@/components/templates/restaurante/sections'
import { copyReserva } from '@/components/templates/restaurante/copy'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

// Los sitios de desarrollo de RESTAURANTE tienen que seguir cubriendo los
// estados que se revisan a mano (completo, mínimo, mínimo + logo, panadería).
const config = (subdominio: string) =>
  FIXTURES_RESTAURANTE.find((f) => f.subdominio === subdominio)!.configJson as unknown as SiteConfigDTO

describe('fixtures de RESTAURANTE', () => {
  it('un fixture por subdominio declarado, sin repetidos', () => {
    expect(FIXTURES_RESTAURANTE.map((f) => f.subdominio)).toEqual([...SUBDOMINIOS_FIXTURES_RESTAURANTE])
  })

  it('completo: carta con precios y categorías, horarios, dirección', () => {
    const cfg = config('dev-restaurante-completo')
    expect(buildCarta(cfg)).toMatchObject({ forma: 'guias', hayCategorias: true, totalPlatos: 6 })
    expect(cfg.contacto?.direccion).toBeTruthy()
    expect(cfg.horarios).toHaveLength(3)
  })

  it('mínimo: carta grande desde servicios, hero tipográfico con tres datos', () => {
    const cfg = config('dev-restaurante-minimo')
    expect(buildCarta(cfg)?.forma).toBe('grande')
    expect(buildDatosHero(cfg, buildCarta(cfg), copyReserva(cfg.rubro))).toHaveLength(3)
  })

  it('mínimo + logo: lo mismo que el mínimo, con logo y dimensiones', () => {
    const cfg = config('dev-restaurante-minimo-logo')
    expect(cfg.logo).toBeTruthy()
    expect(cfg.logoDimensiones).toEqual({ ancho: 120, alto: 120 })
  })

  it('panadería: rubro panaderia', () => {
    expect(config('dev-panaderia').rubro).toBe('panaderia')
  })
})
