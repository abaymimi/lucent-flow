module.exports = {
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFiles: ['<rootDir>/src/tests/setup.ts'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
    },
};
  
  
  