module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint'
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  extends: [
    'google',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    strict: 0,
    'linebreak-style': ['error', 'windows'],
  }
};