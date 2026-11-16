type VaultAuthentication = {
  client_token: string;
  lease_duration: number;
  renewable?: boolean;
};

export class HashicorpVault {
  private readonly address: string;
  private readonly username: string;
  private readonly password: string;
  private readonly environment: string;
  private token?: string;
  private renewable = false;
  private expiresAt = 0;
  private renewAt = 0;

  constructor() {
    const address = process.env.VAULT_ADDR;
    const username = process.env.VAULT_USERNAME;
    const password = process.env.VAULT_PASSWORD;

    if (!address || !username || !password) {
      throw new Error('HashicorpVault requires VAULT_ADDR, VAULT_USERNAME, and VAULT_PASSWORD.');
    }

    let url: URL;
    try {
      url = new URL(address);
    } catch {
      throw new Error('VAULT_ADDR must be a valid HTTP or HTTPS server URL.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('VAULT_ADDR must be an HTTP or HTTPS server URL without credentials, query, or fragment.');
    }

    this.address = url.toString().replace(/\/+$/, '');
    this.username = username;
    this.password = password;
    this.environment = (process.env.TEST_ENV ?? 'DEV').toLowerCase();
    if (!['dev', 'sit', 'uat'].includes(this.environment)) {
      throw new Error('TEST_ENV must be DEV, SIT, or UAT for HashicorpVault.');
    }
  }

  async authenticate() {
    if (this.token && Date.now() < this.expiresAt) {
      if (!this.renewable || Date.now() < this.renewAt) {
        return;
      }
      try {
        const response = await this.request(
          'auth/token/renew-self',
          { method: 'POST', headers: { 'X-Vault-Token': this.token } },
          'token renewal',
        );
        this.cacheAuthentication(response?.auth);
        return;
      } catch {
        // Renewal can be denied at the maximum lifetime; obtain a fresh login.
      }
    }

    // Never reuse the old token if obtaining a replacement fails.
    this.token = undefined;
    const response = await this.request(
      `auth/userpass/login/${encodeURIComponent(this.username)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: this.password }),
      },
      'Userpass authentication',
    );
    this.cacheAuthentication(response?.auth);
  }

  private cacheAuthentication(authentication: VaultAuthentication) {
    if (typeof authentication?.client_token !== 'string' || !authentication.client_token
      || !Number.isFinite(authentication.lease_duration) || authentication.lease_duration < 0) {
      throw new Error('Vault authentication response must contain an access token and a nonnegative numeric lease_duration.');
    }
    const lifetime = authentication.lease_duration * 1000;
    this.token = authentication.client_token;
    this.renewable = authentication.renewable ?? false;
    this.expiresAt = lifetime === 0 ? Infinity : Date.now() + lifetime;
    const renewalWindow = lifetime <= 30000 ? lifetime * 0.1 : 30000;
    this.renewAt = this.expiresAt - renewalWindow;
  }

  async getSecret(name: string) {
    if (!name || name === '.' || name === '..' || name.includes('/')) {
      throw new Error('A Vault secret name must be a nonempty name within the selected environment folder.');
    }
    await this.authenticate();

    const response = await this.request(
      `secret/data/${this.environment}/${encodeURIComponent(name)}`,
      { headers: { 'X-Vault-Token': this.token! } },
      'KV v2 secret read',
    );
    const secret = response?.data?.data;
    if (!secret || typeof secret !== 'object' || Array.isArray(secret)) {
      throw new Error('Vault KV v2 secret read returned no secret object. Check the secret path and version.');
    }
    return secret as Record<string, any>;
  }

  private async request(apiPath: string, options: RequestInit, operation: string) {
    let response: Response;
    try {
      response = await fetch(`${this.address}/v1/${apiPath}`, {
        ...options,
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new Error(`Vault ${operation} could not reach the server within 10 seconds. Check VAULT_ADDR, connectivity, and TLS configuration.`);
    }
    if (!response.ok) {
      throw new Error(`Vault ${operation} failed (HTTP ${response.status}). Check authentication, permissions, and the secret/${this.environment} path.`);
    }
    try {
      return await response.json();
    } catch {
      throw new Error(`Vault ${operation} returned an invalid JSON response.`);
    }
  }
}
