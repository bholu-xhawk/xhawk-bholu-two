process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.3'

module.exports = {
  displayName: 'node_api',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.js'],
}
