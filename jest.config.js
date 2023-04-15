/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/tests/specs'],
  testRegex: '(/__test__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage/',
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts,tsx}', '!src/app.ts'],
  moduleNameMapper: {
    '@src/(.*)$': '<rootDir>/src/$1',
    '@tests/(.*)$': '<rootDir>/tests/$1',
  },
  transform: {
    '\\.[jt]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tests/tsconfig.json' }],
  },
  setupFiles: ['dotenv/config'],
};
