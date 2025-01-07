/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/specs'],
  testRegex: '(/__test__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'tests/coverage/',
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts,tsx}', '!src/app.ts', '!src/@types/**/*'],
  moduleNameMapper: {
    '@src/(.*)$': '<rootDir>/src/$1',
    '@tests/(.*)$': '<rootDir>/tests/$1',
  },
  transform: {
    '\\.[jt]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tests/tsconfig.json' }],
  },
  setupFiles: ['dotenv/config', '<rootDir>/tests/setup/env-vars.ts'],
  setupFilesAfterEnv: ['reflect-metadata'],
};
