module.exports = {
  parser: 'babel-eslint',
  rules: {
    strict: 0,
    'linebreak-style': ['error', 'windows'],
  },
  plugins: [
    'svelte3',
  ],
  extends: ['google']
};