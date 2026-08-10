/* eslint-disable @typescript-eslint/no-require-imports */
// Bootstrap para que Cucumber pueda requerir los .steps.ts en CommonJS
// (el tsconfig del proyecto usa module/moduleResolution "bundler", pensado
// para Next.js, no para el require() de Node que usa Cucumber) y resuelva
// los alias @/* a src/*.
require('dotenv').config({ quiet: true })

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
  },
})

require('tsconfig-paths').register({
  baseUrl: '.',
  paths: { '@/*': ['src/*'] },
})
