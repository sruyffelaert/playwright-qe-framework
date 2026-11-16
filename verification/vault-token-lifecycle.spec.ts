import { test, expect } from '@playwright/test';
import { HashicorpVault } from '../libraries/hashicorp-vault';

type MockReply = { body: unknown; status?: number } | Error;
let replies: MockReply[];
let requests: { path: string; method: string; token: string | null }[];
let now: number;
let originalEnvironment: NodeJS.ProcessEnv;
const originalFetch = globalThis.fetch;
const originalNow = Date.now;

// No network, real Vault credentials, background timers, or wall-clock sleeps.
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
    requests.push({
      path: new URL(String(input)).pathname,
      method: options?.method || 'GET',
      token: new Headers(options?.headers).get('X-Vault-Token'),
    });
    const reply = replies.shift();
    if (!reply) {
      throw new Error('Unexpected mock request.');
    }
    if (reply instanceof Error) {
      throw reply;
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

test('caches the worker login and reads the selected environment with no early renewal', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: { data: { data: { username: 'synthetic-user', password: 'synthetic-value' } } } },
    { body: { data: { data: { username: 'synthetic-user', password: 'synthetic-value' } } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  await vault.authenticate();
  now += 89000;
  const secret = await vault.getSecret('test-account');
  await vault.getSecret('test-account');
  expect(Object.keys(secret)).toEqual(['username', 'password']);
  expect(requests.map(request => request.path)).toEqual([
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/secret/data/sit/test-account',
    '/v1/secret/data/sit/test-account',
  ]);
});

test('renews near expiry and caches the renewed TTL and token', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: { auth: { client_token: 'token-b', lease_duration: 200, renewable: true } } },
    { body: { data: { data: {} } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 90000;
  await vault.getSecret('test-account');
  now += 20000;
  await vault.getSecret('test-account');
  expect(requests.map(request => request.path)).toEqual([
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/auth/token/renew-self',
    '/v1/secret/data/sit/test-account',
    '/v1/secret/data/sit/test-account',
  ]);
  expect(requests[1]).toMatchObject({ method: 'POST', token: 'token-a' });
  expect(requests[2].token).toBe('token-b');
  expect(requests[3].token).toBe('token-b');
});

test('caps the renewal window at 30 seconds for long TTLs', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 3600, renewable: true } } },
    { body: { data: { data: {} } } },
    { body: { auth: { client_token: 'token-a', lease_duration: 3600, renewable: true } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 3569000;
  await vault.getSecret('test-account');
  now += 1000;
  await vault.getSecret('test-account');
  expect(requests.map(request => request.path)).toEqual([
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/secret/data/sit/test-account',
    '/v1/auth/token/renew-self',
    '/v1/secret/data/sit/test-account',
  ]);
});

test('reauthenticates an expired token instead of attempting renewal', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: { auth: { client_token: 'token-b', lease_duration: 100, renewable: true } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 100000;
  await vault.getSecret('test-account');
  expect(requests.map(request => request.path)).toEqual([
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/secret/data/sit/test-account',
  ]);
  expect(requests[2].token).toBe('token-b');
});

test('uses a nonrenewable token until expiry then reauthenticates', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: false } } },
    { body: { data: { data: {} } } },
    { body: { auth: { client_token: 'token-b', lease_duration: 100, renewable: false } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 95000;
  await vault.getSecret('test-account');
  now += 5000;
  await vault.getSecret('test-account');
  expect(requests.filter(request => request.path.includes('renew-self'))).toHaveLength(0);
  expect(requests.filter(request => request.path.includes('userpass/login'))).toHaveLength(2);
});

test('reauthenticates after renewal is denied at maximum lifetime', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: { errors: ['synthetic-sensitive-response'] }, status: 403 },
    { body: { auth: { client_token: 'token-b', lease_duration: 100, renewable: true } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 90000;
  await vault.getSecret('test-account');
  expect(requests.map(request => request.path)).toEqual([
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/auth/token/renew-self',
    '/v1/auth/userpass/login/synthetic-team',
    '/v1/secret/data/sit/test-account',
  ]);
  expect(requests[3].token).toBe('token-b');
});

test('reauthenticates after a malformed renewal response', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: { auth: { client_token: 'token-a' } } },
    { body: { auth: { client_token: 'token-b', lease_duration: 100, renewable: false } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 90000;
  await vault.getSecret('test-account');
  expect(requests[3].token).toBe('token-b');
});

test('does not renew a token that Vault reports as nonexpiring', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 0, renewable: false } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 100000000;
  await vault.getSecret('test-account');
  expect(requests).toHaveLength(2);
});

test('coalesces concurrent initial authentication', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: { data: { data: {} } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await Promise.all([vault.getSecret('one'), vault.getSecret('two')]);
  expect(requests.filter(request => request.path.includes('userpass/login'))).toHaveLength(1);
});

test('coalesces concurrent renewal', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: { auth: { client_token: 'token-b', lease_duration: 100, renewable: true } } },
    { body: { data: { data: {} } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 90000;
  await Promise.all([vault.getSecret('one'), vault.getSecret('two')]);
  expect(requests.filter(request => request.path.includes('renew-self'))).toHaveLength(1);
});

test('authentication errors exclude the response body and allow a later retry', async () => {
  replies.push(
    { body: { errors: ['synthetic-sensitive-response'] }, status: 403 },
    { body: { auth: { client_token: 'token-b', lease_duration: 100, renewable: true } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  const failure = await vault.authenticate().catch(error => error) as Error;
  expect(failure.message).toContain('Userpass authentication failed (HTTP 403)');
  expect(failure.message).not.toContain('synthetic-sensitive-response');
  await vault.getSecret('test-account');
  expect(requests[2].token).toBe('token-b');
});

test('failed renewal and failed replacement login never reuse the old token', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: {}, status: 403 },
    { body: { errors: ['synthetic-sensitive-response'] }, status: 403 },
    { body: { auth: { client_token: 'token-b', lease_duration: 100, renewable: true } } },
    { body: { data: { data: {} } } },
  );
  const vault = new HashicorpVault();
  await vault.authenticate();
  now += 90000;
  await expect(vault.getSecret('test-account')).rejects.toThrow('Userpass authentication failed (HTTP 403)');
  expect(requests.filter(request => request.method === 'GET')).toHaveLength(0);
  await vault.getSecret('test-account');
  expect(requests[4].token).toBe('token-b');
});

for (const auth of [
  {},
  { client_token: 'token-a' },
  { client_token: 'token-a', lease_duration: -1 },
  { client_token: 'token-a', lease_duration: '100' },
]) {
  test(`rejects malformed token metadata ${JSON.stringify(Object.keys(auth))} ${String(auth.lease_duration)}`, async () => {
    replies.push({ body: { auth } });
    await expect(new HashicorpVault().authenticate()).rejects.toThrow('access token and a nonnegative numeric lease_duration');
    expect(requests).toHaveLength(1);
  });
}

for (const status of [403, 404, 500]) {
  test(`reports secret read HTTP ${status} without leaking data or retrying login`, async () => {
    replies.push(
      { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
      { body: { errors: ['synthetic-sensitive-response'] }, status },
    );
    const failure = await new HashicorpVault().getSecret('test-account').catch(error => error as Error);
    expect(failure.message).toContain(`KV v2 secret read failed (HTTP ${status})`);
    expect(failure.message).not.toContain('synthetic-sensitive-response');
    expect(requests).toHaveLength(2);
  });
}

test('connection failures do not expose native exception details', async () => {
  replies.push(new Error('synthetic-sensitive-response'));
  const failure = await new HashicorpVault().authenticate().catch(error => error) as Error;
  expect(failure.message).toContain('could not reach the server');
  expect(failure.message).not.toContain('synthetic-sensitive-response');
});

test('malformed secret data fails without returning the response object', async () => {
  replies.push(
    { body: { auth: { client_token: 'token-a', lease_duration: 100, renewable: true } } },
    { body: { data: { data: ['synthetic-sensitive-response'] } } },
  );
  await expect(new HashicorpVault().getSecret('test-account')).rejects.toThrow('returned no secret object');
});
