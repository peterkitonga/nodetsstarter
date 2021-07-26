/**
 * Overrides the tsconfig used for the app
 * and attaches one for the test environment
 */
const tsNode = require('ts-node');

tsNode.register({
  files: true,
  transpileOnly: true,
  project: './tsconfig.json',
});
