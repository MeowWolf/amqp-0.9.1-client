module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'plugin:react/recommended', // Uses the recommended rules from    @eslint-plugin-react
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  rules: {
    semi: ['error', 'never'],
    'no-console': ['warn'],
    'arrow-parens': ['warn', 'as-needed'],
    'no-lone-blocks': ['off'],
    'max-len': ['warn', 140],
    // 'array-element-newline': ['warn', { minItems: 4 }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['*/__tests__/**/*.ts'] }],
    'import/prefer-default-export': ['off'],
    'import/no-extraneous-dependencies': ['off'],
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/member-delimiter-style': ['off'],
  },
}
