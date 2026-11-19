import { test, expect } from '@fixtures/fixtures';

test.describe('Optional Vault integration', { tag: '@local-only' }, () => {
  test.skip(process.env.RUN_VAULT_DEMO !== '1', 'Set RUN_VAULT_DEMO=1 to run the Vault demonstration.');

  test('retrieves environment-specific test-account credentials', async ({ hashicorpVault }) => {
    const credentials = await hashicorpVault.getSecret('test-account');

    // Assert booleans so credential values cannot appear in assertion diagnostics.
    expect(typeof credentials.username === 'string' && credentials.username.length > 0).toBe(true);
    expect(typeof credentials.password === 'string' && credentials.password.length > 0).toBe(true);
  });
});
