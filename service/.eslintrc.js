module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'import', 'security'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',  // ✅ FIXED: Added 'plugin:' prefix
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  rules: {
    // Import ordering
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling', 'index']
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }  // ✅ FIXED: Added missing closing bracket
    }],
    
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Security warnings (not errors)
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-object-injection': 'warn',
    
    // General
    'no-console': 'warn',
    'prefer-const': 'error'
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }  // ✅ FIXED: Added missing closing bracket
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    'eslint.config.*'
  ]
};  // ✅ FIXED: Added missing closing bracket
