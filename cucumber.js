/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')

module.exports = {
  default: {
    paths: ['tests/e2e/features/**/*.feature'],
    require: ['tests/e2e/steps/**/*.ts'],
    requireModule: [path.join(__dirname, 'tests/e2e/register.js')],
    format: ['progress-bar'],
    worldParameters: {
      baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
    },
  },
}
