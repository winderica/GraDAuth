module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    '../../.eslintrc.base.js',
  ],
  root: true,
  rules: {
    'jsx-quotes': ['warn', 'prefer-single'],
  },
  env: {
    browser: true,
    es6: true
  }
};
