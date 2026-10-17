// Siembra los sitios de desarrollo de RESTAURANTE (ver fixturesRestaurante.ts)
// bajo el cliente demo. Es solo para revisar la plantilla en local: no forma
// parte del seed de producción (`db:seed-demo`).
//
//   npm run db:seed-fixtures-restaurante
//   → http://localhost:3000/sites/dev-restaurante-completo (y las otras tres)
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { FIXTURES_RESTAURANTE } from './fixturesRestaurante'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const CLIENTE_DEMO_ID = 'cliente-demo-webbot-devalpo'
const CLIENTE_DEMO_EMAIL = 'demo@webbot.devalpo.cl'

async function main() {
  await prisma.cliente.upsert({
    where: { id: CLIENTE_DEMO_ID },
    create: { id: CLIENTE_DEMO_ID, email: CLIENTE_DEMO_EMAIL, nombre: 'WebBot Demo', plan: 'STARTER', activo: true },
    update: {},
  })

  for (const { subdominio, configJson } of FIXTURES_RESTAURANTE) {
    await prisma.sitio.upsert({
      where: { subdominio },
      create: { clienteId: CLIENTE_DEMO_ID, subdominio, template: 'RESTAURANTE', configJson: configJson as object },
      update: { template: 'RESTAURANTE', configJson: configJson as object },
    })
    console.log(`  ✓ ${subdominio} → /sites/${subdominio}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
