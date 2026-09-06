import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/application/**/*.ts',
    'src/infrastructure/claude/**/*.ts',
    '!**/*.d.ts',
    '!**/index.ts',
    // Prompts pre-existentes de una migración anterior, nunca consumidos por
    // ningún módulo (ClaudeChatService.ts porta sus propios prompts inline,
    // ver design.md) — fuera de alcance de este cambio, no se tocan ni se
    // les exige cobertura.
    '!src/infrastructure/claude/prompts/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/domain/**/*.ts': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/application/use-cases/**/*.ts': {
      branches: 70,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'src/infrastructure/claude/**/*.ts': {
      branches: 70,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: 'unit',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Componentes React importados por tests unitarios (p. ej. DemoCTA)
        // traen CSS Modules — sin stub, ts-jest no sabe parsear .css.
        '\\.module\\.css$': '<rootDir>/tests/unit/__mocks__/styleMock.ts',
        '\\.css$': '<rootDir>/tests/unit/__mocks__/styleMock.ts',
      },
      transform: {
        // Override puntual para permitir renderizar componentes .tsx (p. ej.
        // DemoCTA vía react-dom/server) en el proyecto "unit" (testEnvironment
        // node, sin JSX-renderer histórico — ver verify-report obs #304).
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
      },
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: 'integration',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    },
  ],
}

export default config
