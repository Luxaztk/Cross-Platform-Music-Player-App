import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1. Cấu hình các thư mục bị loại bỏ (Global Ignores)
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**', '**/build/**', '**/.expo/**', 'test/**'],
  },

  // 2. Cấu hình chung cho file TypeScript & React
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // Lưu ý: Tùy phiên bản plugin mà cách gọi config có thể khác nhau
      // Đây là cách gọi an toàn cho Flat Config
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node, // Thêm node nếu bạn làm việc với cả server/config
      },
    },
    rules: {
      // Quy tắc từ React Hooks
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Tinh túy từ Bản 1: Quy tắc TypeScript thông minh
      '@typescript-eslint/no-explicit-any': 'warn', // Không quá khắt khe với 'any'
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // Bỏ qua biến bắt đầu bằng _ (ví dụ: _index)
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
);
