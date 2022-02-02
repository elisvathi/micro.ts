module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	extends: ['plugin:@typescript-eslint/recommended'],
	rules: {
		'@typescript-eslint/camelcase': 'off',
		'@typescript-eslint/explicit-member-accessibility': ['error'],
		'@typescript-eslint/explicit-function-return-type': ['error'],
		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			},
		],
	},
};
