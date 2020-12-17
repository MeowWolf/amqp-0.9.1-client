module.exports = {
  roots: ['<rootDir>/src'],
  testRegex: ['.spec.ts$'],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.{ts,tsx,js,jsx}', '!**/__tests__/**', '!**/behaviors/testBehaviors/**'],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageThreshold: {
    global: {
      statements: 92,
      branches: 83,
      functions: 92,
      lines: 92,
    },
  },
}
