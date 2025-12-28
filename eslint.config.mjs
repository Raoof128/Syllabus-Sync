import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'node_modules/**',
    '.idea/**',
    '.vscode/**',
    '.DS_Store',
    'public/**',
    'Team_Plan/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
