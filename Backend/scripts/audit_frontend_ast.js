import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ESLint } from 'eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '../../Frontend');

async function runLinter() {
  console.log('🔍 Running Focused ESLint on Frontend/src for undefined variables & syntax errors...\n');

  try {
    const eslint = new ESLint({
      cwd: frontendDir,
      overrideConfig: {
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          parserOptions: {
            ecmaFeatures: { jsx: true }
          },
          globals: {
            window: 'readonly',
            document: 'readonly',
            navigator: 'readonly',
            localStorage: 'readonly',
            sessionStorage: 'readonly',
            fetch: 'readonly',
            console: 'readonly',
            setTimeout: 'readonly',
            clearTimeout: 'readonly',
            setInterval: 'readonly',
            clearInterval: 'readonly',
            URL: 'readonly',
            URLSearchParams: 'readonly',
            FormData: 'readonly',
            Image: 'readonly',
            React: 'readonly',
            process: 'readonly',
            import: 'readonly'
          }
        },
        rules: {
          'no-undef': 'error',
          'no-unused-vars': 'off'
        }
      }
    });

    const results = await eslint.lintFiles(['src/**/*.{js,jsx}']);

    let errorCount = 0;
    for (const result of results) {
      if (result.messages.length > 0) {
        const errors = result.messages.filter(m => m.severity === 2);
        if (errors.length > 0) {
          console.log(`\n📁 File: ${path.relative(frontendDir, result.filePath)}`);
          errors.forEach(err => {
            console.log(`  ❌ Line ${err.line}:${err.column} - ${err.message} (${err.ruleId})`);
            errorCount++;
          });
        }
      }
    }

    if (errorCount === 0) {
      console.log('\n🎉 0 undefined variables or syntax errors found across all Frontend/src files!');
    } else {
      console.log(`\n⚠️ Total errors found: ${errorCount}`);
    }

  } catch (err) {
    console.error('Linter error:', err);
  }
}

runLinter();
