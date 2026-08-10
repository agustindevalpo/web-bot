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
    '!**/*.d.ts',
    '!**/index.ts',
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
  },
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: 'unit',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
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
