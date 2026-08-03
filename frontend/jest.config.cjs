const path = require('path')

module.exports = {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: path.join(__dirname, 'babel.config.cjs') }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/fileMock.cjs',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp|avif)$': '<rootDir>/test/__mocks__/fileMock.cjs',
  },
}
