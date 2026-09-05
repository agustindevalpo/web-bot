/* eslint-disable @typescript-eslint/no-require-imports */
// Bootstrap para correr prisma/seed-demo.ts con ts-node fuera de Next.js —
// mismo patrón que tests/e2e/register.js (el tsconfig del proyecto usa
// module/moduleResolution "bundler", pensado para Next.js, no para el
// require() de Node que usa ts-node en modo script).
require('dotenv').config({ quiet: true })

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
  },
})

// seedDemoTemplates.ts importa src/infrastructure/templates/rubroTemplates.ts,
// que usa el alias @/* — sin este registro Node no lo resuelve fuera de Next.js.
require('tsconfig-paths').register({
  baseUrl: '.',
  paths: { '@/*': ['src/*'] },
})
