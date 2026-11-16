import { test, expect } from '@playwright/test';
import { HashicorpVault } from '../libraries/hashicorp-vault';

let replies: { body: unknown; status?: number }[];
let requests: { path: string; token: string | null }[];
let now: number;
let originalEnvironment: NodeJS.ProcessEnv;
const originalFetch = globalThis.fetch;
const originalNow = Date.now;

test.beforeEach(() => {
  originalEnvironment = { ...process.env };
  process.env.VAULT_ADDR = 'http://vault.invalid:8200';
  process.env.VAULT_USERNAME = 'synthetic-team';
  process.env.VAULT_PASSWORD = 'synthetic-secret-zero';
  process.env.TEST_ENV = 'SIT';
  replies = [];
  requests = [];
  now = 1000000;
  Date.now = () => now;
  globalThis.fetch = async (input, options) => {
    requests.push({ path: new URL(String(input)).pathname, token: new Headers(options?.headers).get('X-Vault-Token') });
    const reply = replies.shift();
    if (!reply) {
      throw new Error('Unexpected mock request.');
    }
    return new Response(JSON.stringify(reply.body), { status: reply.status || 200 });
  };
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  process.env = originalEnvironment;
  expect(replies).toHaveLength(0);
});

test('token caching: multiple secret reads use a single authentication', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 20 } } },
    { body: { data: { data: { username: 'synthetic-user', password: 'synthetic-value' } } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  const secret = await vault.getSecret('test-account');
  now += 19000;
  await vault.getSecret('test-account');
  expect(Object.keys(secret)).toEqual(['username', 'password']);
  expect(requests.map(request => request.path)).toEqual([
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/secret/data/sit/test-account',
    '/v1/secret/data/sit/test-account',
  ]);
});

test('token expiration: an expired token triggers fresh authentication', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 1200 } } },
    { body: { auth: { client_token: 'token-b', lease_duration: 1200 } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 1201000;
  await vault.getSecret('test-account');
  expect(requests.map(request => request.path)).toEqual([
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/secret/data/sit/test-account',
  ]);
  expect(requests[2].token).toBe('token-b');
});

test('error handling: authentication and read failures do not expose sensitive information', async () => {
  replies.push({ body: { errors: ['synthetic-secret-zero token-a'] }, status: 403 });
  const vault = new HashicorpVault();
  const authenticationError = await vault.authenticate().catch(error => error) as Error;
  expect(authenticationError.message).toContain('Userpass authentication failed (HTTP 403)');
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 1200 } } },
    { body: { errors: ['synthetic-secret-zero token-a'] }, status: 403 },
  );
  const readError = await vault.getSecret('test-account').catch(error => error) as Error;
  expect(readError.message).toContain('KV v2 secret read failed (HTTP 403)');
  for (const error of [authenticationError, readError]) {
    expect(error.message).not.toMatch(/synthetic-secret-zero|token-a|synthetic-team/);
  }
});
