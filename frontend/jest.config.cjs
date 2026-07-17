module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/*.test.{js,jsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/src/test/styleMock.js',
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
}
