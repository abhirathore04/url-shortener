module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'security'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended',
    'prettier'
  ],
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': ['warn', { 
      ignoreRestArgs: true // Allow any in rest parameters
    }],
    '@typescript-eslint/no-var-requires': 'error',
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    'no-console': 'off', // Allow console in development
    'no-inner-declarations': 'error',
    'security/detect-object-injection': 'warn'
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js'
  ]
};
