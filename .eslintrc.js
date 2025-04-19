module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    plugins: ['@typescript-eslint'],
    env: {
        browser: true,
        node: true,
        es6: true
    },
    rules: {
        // 基本规则
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': 'off', // 使用TypeScript的规则
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        
        // 代码风格
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'linebreak-style': ['error', 'windows'],
        'quotes': ['error', 'single', { 'avoidEscape': true }],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'arrow-parens': ['error', 'as-needed'],
        'max-len': ['warn', { 'code': 100, 'ignoreComments': true, 'ignoreStrings': true }],
        
        // 最佳实践
        'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-template': 'error',
        'no-param-reassign': 'warn',
        'no-multi-spaces': 'error',
        'no-trailing-spaces': 'error',
        'space-before-function-paren': ['error', {
            'anonymous': 'never',
            'named': 'never',
            'asyncArrow': 'always'
        }]
    },
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': ['warn', {
                    'allowExpressions': true,
                    'allowTypedFunctionExpressions': true
                }]
            }
        }
    ]
};