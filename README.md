# Playwright QE Framework

A TypeScript Playwright framework for the public [Automation Exercise](https://automationexercise.com) site, with page objects, environment-specific test data, and optional HashiCorp Vault access.

## Setup

Use Node.js 20 or newer.

```sh
npm ci
npx playwright install --with-deps
cp .env.example .env
cp .env.dev.example .env.dev
cp .env.sit.example .env.sit
cp .env.uat.example .env.uat
```

Populate the shared `.env` with `TEST_ENV` and Vault connection settings. The login/logout scenario requires a reachable Vault server and a secret containing valid application credentials. The other four functional scenarios do not contact Vault.

## Environment configuration

Playwright loads the shared `.env` first, then `.env.<environment>` for `BASE_URL`. An explicitly exported `TEST_ENV` takes precedence over `.env`; when neither supplies it, the default is DEV. Selection is case insensitive. Both dotenv loads preserve existing process variables, including an exported `BASE_URL`. Keep application URLs in the environment-specific files and shared Vault settings in `.env`.

```dotenv
# .env — replace the Vault placeholders locally
TEST_ENV=DEV
VAULT_ADDR=http://127.0.0.1:8200
VAULT_USERNAME=your-team-vault-username
VAULT_PASSWORD=replace-with-your-vault-userpass-password

# .env.dev, .env.sit, and .env.uat each currently contain:
BASE_URL=https://automationexercise.com
```

`TEST_ENV` selects three corresponding resources:

| Environment | Application configuration | Test data | Vault folder |
|---|---|---|---|
| DEV | `.env.dev` | `test-data/dev/environment-data.dev.json` | `secret/dev` |
| SIT | `.env.sit` | `test-data/sit/environment-data.sit.json` | `secret/sit` |
| UAT | `.env.uat` | `test-data/uat/environment-data.uat.json` | `secret/uat` |

Environment JSON contains products, numeric prices, currency, account metadata, and demonstration permutations. Tests select descriptive tags and calculate totals from environment prices and scenario quantities. Account mappings contain `vaultSecret` and `displayName`; login email and password are obtained from Vault.

Configuration fails clearly for a missing or invalid `BASE_URL`. The configuration check applies to demonstrations too. POMs navigate through Playwright's `use.baseURL`; application hosts are not hardcoded in page objects. The VS Code workspace settings do not override `TEST_ENV`, so extension runs use the shared `.env` default. Setting `playwright.env` explicitly in VS Code overrides that default.

The actual `.env` files are Git-ignored. Only `.env.example`, `.env.dev.example`, `.env.sit.example`, and `.env.uat.example` are safe templates intended for publication.

## Vault credentials and lifecycle

`libraries/hashicorp-vault.ts` is independent of Playwright. It uses native fetch, Userpass at `auth/userpass`, and KV v2 at `secret`. It does not load dotenv or depend on the environment-data fixture.

The optional, worker-scoped `hashicorpVault` fixture authenticates when first requested. It reuses one client and cached token per worker. Before secret reads, the library checks Vault's returned `lease_duration`. Renewable tokens are renewed on demand within 30 seconds of expiration through `auth/token/renew-self`. For leases of 30 seconds or less, the renewal window is 10% of the TTL. An expired token, a failed renewal, or an invalid renewal response causes a new Userpass login. Valid nonrenewable tokens are reused until expiry. TTL zero is treated as nonexpiring. Operations run sequentially within each worker; the library has no concurrency coordination. There is no background renewal loop or lifecycle timer.

The login/logout case uses this mapping:

```ts
const account = environmentData.ACCOUNTS['Registered account for login and logout'];
const { username, password } = await hashicorpVault.getSecret(account.vaultSecret);
```

With SIT and the current `vaultSecret` value, this reads `secret/sit/test-account` through `/v1/secret/data/sit/test-account`. The secret's `username` must contain the application's login email; `password` must contain its matching password. The expected logged-in display name comes from environment data. The login case logs the user ID, but never its password. Vault's authentication account is separate from the application account.

For the separate `qe-vault-local` project, map its `QE_VAULT_PASSWORD` to this project's `VAULT_PASSWORD` and use its team Userpass username. Its default address is `http://127.0.0.1:8200`. No root token or local Vault server is included here. The team's Vault policy must allow reading the selected secret paths and, for renewal, `auth/token/renew-self`.

Authentication, renewal, and read errors do not include server response bodies, native connection details, credentials, or tokens. Failed renewal falls back to login; if login also fails, the read fails without using the old token. Secret-read errors are reported without blind retries: a 403 may represent an ACL denial or early token revocation. See the [Userpass API](https://developer.hashicorp.com/vault/api-docs/auth/userpass#login), [token renewal API](https://developer.hashicorp.com/vault/api-docs/auth/token#renew-a-token-self), and [KV v2 API](https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-version).

## Run functional scenarios

```sh
npm test                    # Five functional scenarios across three browsers; demos skipped
npm run test:chromium       # Functional scenarios in Chromium; demos skipped
npm run test:headed         # Watch browsers
npm run test:ui             # Interactive runner
npm run test:list           # List tests, including optional demonstrations
npm run report             # Open the latest HTML report

TEST_ENV=sit npx playwright test --project=chromium --headed
TEST_ENV=uat npx playwright test --project=chromium --headed
```

To run the four functional scenarios that do not need Vault:

```sh
npm test -- --grep-invert 'Login and log out'
```

The five scenarios validate multiple quantities, two different products, cart removal, contact form submission with an attachment, and login/logout. Products differ by environment; scenario quantities remain in their tests. Application tests instantiate `HomePage` directly and use verified destination POMs and scoped product row/tile objects.

## Optional demonstrations

Both demonstrations are skipped by default and retain one test case each. Enable them explicitly:

```sh
RUN_TDM_DEMO=1 TEST_ENV=SIT npx playwright test tests/tdm-iteration-demo.spec.ts --project=chromium --reporter=list
RUN_VAULT_DEMO=1 TEST_ENV=SIT npx playwright test tests/vault-integration-demo.spec.ts --project=chromium --reporter=list
```

The TDM test logs descriptive dataset names and values using two native loops. The Vault test retrieves `test-account` and verifies nonempty username and password strings through boolean assertions, without printing their values. The normal login/logout case requests Vault independently of `RUN_VAULT_DEMO`.

## Focused verification

These checks use the existing Playwright runner and no additional dependencies:

```sh
npx playwright test --config verification/playwright.config.ts
```

Five mocked lifecycle tests use simulated time to cover token caching, renewal, expiration, renewal failure, and sanitized authentication/read errors without a live Vault server. Environment checks isolate dotenv inputs and verify shared defaults, exported overrides, file selection, and missing URLs. The password-input check uses self-contained HTML in Chromium, Firefox, and WebKit. These checks use a separate output directory and do not replace the functional HTML report.

Type-check with an available TypeScript compiler (`tsc --noEmit`). The project does not add a compiler dependency; a temporary compiler can be used with `npm exec --yes --package typescript -- tsc --noEmit`.

## Fixtures, diagnostics, and limitations

- `blockAds` is automatic and test-scoped. It blocks advertising requests and logs JavaScript dialog types/messages without resolving them, per ADR 004. Unexpected dialogs fail through timeouts when they block an interaction; nonblocking dialogs may only be logged.
- `environmentData` is optional and test-scoped. It exposes the selected JSON directly through Node's cached `require()`, with loose generic typing.
- `hashicorpVault` is optional and worker-scoped. A new worker, including a replacement after a failure, obtains its own client and token.
- Local and CI runs use one worker to limit load on the public site. Local runs have no retries; CI has two. Screenshots capture failures; traces are collected on the first retry. HTML reports are in `playwright-report/`; individual artifacts are in `test-results/`.
- Live tests require installed browsers, internet access, the public site, and valid environment data. Login additionally requires local Vault and matching application credentials. Mocked checks cannot establish live Vault availability or account suitability. Public-site timing and availability can cause unrelated failures; the framework does not retry mutations or self-heal.
- Secret-read ACL failures and unexpected early token revocation are surfaced. No other Vault auth methods, providers, background renewal, global data fixture, or credential abstraction are implemented. Token timing uses the worker's local clock.

Reports and traces can contain application and form data; review them before sharing. Dependencies, credentials directories, ignored configuration, and generated reports are excluded from Git.

## Layout

```text
fixtures/              Shared fixtures and Playwright exports
libraries/             Standalone HashiCorp Vault client
pages/                 Page objects and scoped row/tile objects
tests/                 Five functional specs and two opt-in demonstrations
verification/          Mocked lifecycle/config checks and browser locator checks
test-data/             DEV/SIT/UAT JSON and upload data
docs/                  Architecture decisions, POM guidance, scenario specifications
playwright.config.ts   Shared/environment dotenv loading, browsers, reporting
```

## Copyright and Usage

Copyright © 2026. All rights reserved.

This repository is publicly available for portfolio review and technical evaluation.

No license is granted to use, modify, redistribute, or incorporate this code into other projects without prior written permission.
