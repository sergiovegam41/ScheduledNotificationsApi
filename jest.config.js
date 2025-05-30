export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  verbose: true,
  collectCoverage: true,
  testTimeout: 10000
};

