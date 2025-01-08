const reactPlugin = require('eslint-plugin-react');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parser: typescriptParser,
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				browser: 'readonly',
				jest: 'readonly',
			},
		},
		settings: {
			'import/resolver': {
				node: {
					paths: ['src'],
					extensions: ['.js', '.jsx', '.ts', '.tsx'],
					moduleDirectory: ['node_modules', 'src/'],
				},
			},
		},
		plugins: {
			react: reactPlugin,
			'@typescript-eslint': typescriptPlugin,
			'react-hooks': reactHooksPlugin,
			prettier: prettierPlugin,
			import: importPlugin, // Added eslint-plugin-import
		},
		rules: {
			'no-nested-ternary': 'off',
			'import/prefer-default-export': 'off',
			'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
			'@typescript-eslint/no-unused-vars': 'warn',
			'no-unused-vars': 'warn',
			'import/no-extraneous-dependencies': 'warn', // This now works because the plugin is included
			'react/prop-types': 'off',
			'react-hooks/exhaustive-deps': [
				'warn',
				{
					enableDangerousAutofixThisMayCauseInfiniteLoops: true,
				},
			],
			'prettier/prettier': ['error', {}, { usePrettierrc: true }],
		},
	},
];
