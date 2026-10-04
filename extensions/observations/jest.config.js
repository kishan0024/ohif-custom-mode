module.exports = {
  rootDir: '../..',
  roots: ['<rootDir>/extensions/observations'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/extensions/observations/src/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        configFile: false,
        babelrc: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-react',
          '@babel/preset-typescript',
        ],
      },
    ],
  },
  moduleNameMapper: { '\\.css$': 'identity-obj-proxy' },
};
