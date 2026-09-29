// Babel config for Jest (the package is ESM; Jest runs tests in CJS by default,
// so preset-env transpiles the ESM source for the test runner).
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
