import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Exercise the real config in isolated processes with synthetic dotenv contents.
// No ignored files, Vault connection, or browser is needed for these cases.
const script = `
  const path = require('node:path');
  const dotenv = require('dotenv');
  const settings = JSON.parse(process.env.CONFIG_CHECK);
  const loadedFiles = [];
  delete process.env.TEST_ENV;
  delete process.env.BASE_URL;
  Object.assign(process.env, settings.exported);
  dotenv.config = ({ path: file }) => {
    const name = path.basename(file);
    loadedFiles.push(name);
    const data = name === '.env' ? settings.shared : settings.files[name] || {};
    dotenv.populate(process.env, data);
    return { parsed: data };
  };
  const { transform } = require(path.resolve('node_modules/playwright/lib/common/index.js'));
  transform.requireOrImport(path.resolve('playwright.config.ts')).then(loaded => {
    const config = loaded.default || loaded;
    console.log(JSON.stringify({ loadedFiles, baseURL: config.use.baseURL }));
  }).catch(error => {
    console.log(JSON.stringify({ loadedFiles, error: error.message }));
  });
`;

const cases = [
  { name: 'shared .env supplies SIT when no variable is exported', shared: { TEST_ENV: 'SIT' }, exported: {}, selected: '.env.sit', url: 'https://sit.example.test' },
  { name: 'exported DEV overrides shared SIT', shared: { TEST_ENV: 'SIT' }, exported: { TEST_ENV: 'DEV' }, selected: '.env.dev', url: 'https://dev.example.test' },
  { name: 'exported BASE_URL takes precedence', shared: { TEST_ENV: 'SIT' }, exported: { BASE_URL: 'https://override.example.test' }, selected: '.env.sit', url: 'https://override.example.test' },
  { name: 'defaults to DEV if TEST_ENV is absent', shared: {}, exported: {}, selected: '.env.dev', url: 'https://dev.example.test' },
  { name: 'missing selected URL fails clearly', shared: { TEST_ENV: 'SIT' }, exported: {}, selected: '.env.sit', missing: true },
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const files = {
      '.env.dev': { BASE_URL: 'https://dev.example.test' },
      '.env.sit': scenario.missing ? {} : { BASE_URL: 'https://sit.example.test' },
    };
    const result = spawnSync(process.execPath, ['-e', script], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, CONFIG_CHECK: JSON.stringify({ ...scenario, files }) },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout.trim());
    expect(output.loadedFiles).toEqual(['.env', scenario.selected]);
    if (scenario.missing) {
      expect(output.error).toContain('Missing BASE_URL for TEST_ENV=sit');
    } else {
      expect(output.error).toBeUndefined();
      expect(output.baseURL).toBe(scenario.url);
    }
  });
}
