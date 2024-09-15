module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'import'],
    extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    root: true,
    ignorePatterns: ['.eslintrc.js', 'types/**/*.ts', 'scripts/**/*.js'],
    env: {
        es6: true,
        browser: true,
    },
    rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        'import/extensions': ['off'],
        'import/no-unresolved': 'off',
        quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    },
    // 其他 ESLint 配置
    overrides: [
        {
            // 对于所有 .js 文件
            files: ['*.js'],
            // 禁用参数和返回类型规则
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/explicit-module-boundary-types': 'off',
            }
        }
    ],
};
