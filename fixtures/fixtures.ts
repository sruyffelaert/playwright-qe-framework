import { test as base, expect } from '@playwright/test';
import { HashicorpVault } from '../libraries/hashicorp-vault';

type JsonObject = Record<string, any>;

export function getEnvironmentData() {
  const env = (process.env.TEST_ENV ?? 'dev').toLowerCase();
  return require(`../test-data/${env}/environment-data.${env}.json`);
}

type FrameworkFixtures = {
  blockAds: void;
  environmentData: JsonObject;
};

type FrameworkWorkerFixtures = {
  hashicorpVault: HashicorpVault;
};

export const test = base.extend<FrameworkFixtures, FrameworkWorkerFixtures>({
  blockAds: [async ({ context }, use) => {
    await context.route(
      /googleads|doubleclick\.net|googlesyndication\.com|googletagservices\.com/i,
      route => route.abort(),
    );
    context.on('dialog', dialog => {
      console.error(`Dialog detected: type=${dialog.type()}, message=${JSON.stringify(dialog.message())}`);
    });
    await use();
  }, { auto: true }],

  environmentData: async ({}, use) => {
    await use(getEnvironmentData());
  },

  hashicorpVault: [async ({}, use) => {
    const vault = new HashicorpVault();
    await vault.authenticate();
    await use(vault);
  }, { scope: 'worker' }],
});

export { expect };
