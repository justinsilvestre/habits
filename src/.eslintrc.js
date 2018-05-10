module.exports = {
  extends: ['airbnb', 'plugin:flowtype/recommended'],
  plugins: ['flowtype'],
  env: {
    browser: true
  },
  rules: {
    semi: ['error', 'never'],
    'quote-props': ['error', 'as-needed', { numbers: true }],
    'prefer-destructuring': ['error', {
      VariableDeclarator: {
        array: false,
        object: true
      },
    }, {
      enforceForRenamedProperties: false
    }]
  },
  overrides: {
    files: ['*.test.js'],
    env: {
      jest: true
    }
  },
  parser: 'babel-eslint'
}
