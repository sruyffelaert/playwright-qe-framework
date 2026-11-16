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

The optional, worker-scoped `hashicorpVault` fixture authenticates when first requested. It reuses one client and cached token per worker. Before secret reads, the library checks the cached expiration time derived from Vault's `lease_duration`. A valid token is reused until it expires; an expired token triggers a new Userpass login. TTL zero is treated as nonexpiring. Tokens are not renewed. Operations run sequentially within each worker, without concurrency coordination, background tasks, or lifecycle timers.

The login/logout case uses this mapping:

```ts
const account = environmentData.ACCOUNTS['Registered account for login and logout'];
const { username, password } = await hashicorpVault.getSecret(account.vaultSecret);
```

With SIT and the current `vaultSecret` value, this reads `secret/sit/test-account` through `/v1/secret/data/sit/test-account`. The secret's `username` must contain the application's login email; `password` must contain its matching password. The expected logged-in display name comes from environment data. The login case does not log the username or password. Vault's authentication account is separate from the application account.

For the separate `qe-vault-local` project, map its `QE_VAULT_PASSWORD` to this project's `VAULT_PASSWORD` and use its team Userpass username. Its default address is `http://127.0.0.1:8200`. No root token or local Vault server is included here. The team's Vault policy must allow reading the selected secret paths.

Authentication and read errors do not include server response bodies, native connection details, credentials, or tokens. If obtaining a replacement token fails, the read fails without using the expired token. See the [Userpass API](https://developer.hashicorp.com/vault/api-docs/auth/userpass#login) and [KV v2 API](https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-version).

### Known Limitations

**Early token revocation:** If Vault revokes a token before its reported expiration, secret retrieval fails with the returned HTTP error. The library does not invalidate the cached token or automatically reauthenticate because an HTTP 403 may indicate insufficient permissions rather than token revocation. Subsequent requests may continue failing until the cached token expires or a new worker authenticates.

## Run tests

```sh
npm test                    # Functional and data-driven cases across three browsers; Vault demo skipped
npm run test:chromium       # Functional and data-driven cases in Chromium
npm run test:headed         # Watch browsers
npm run test:ui             # Interactive runner
npm run test:list           # List all registered tests, including the optional Vault demonstration
npm run report             # Open the latest HTML report

TEST_ENV=sit npx playwright test --project=chromium --headed
TEST_ENV=uat npx playwright test --project=chromium --headed
```

To run the four functional scenarios that do not need Vault:

```sh
npx playwright test autoexercise- --grep-invert 'Login and log out'
```

The five functional scenarios validate multiple quantities, two different products, cart removal, contact form submission with an attachment, and login/logout. Their scenario quantities remain in the tests. The data-driven demonstrations additionally use environment-specific purchase quantities and search variations. Application tests instantiate `HomePage` directly and use verified destination POMs and scoped product row/tile objects.

## Data-driven iteration demonstrations

`tests/data-driven-testing-example-cases.spec.ts` demonstrates four patterns using `PURCHASE_QUANTITIES` and `PRODUCT_SEARCH_VARIATIONS` from the selected environment:

| Pattern | Current tests per browser | Guidance |
|---|---:|---|
| Outer purchase-group loop with an inner quantity loop | 3 | Recommended: each group is independent; additions within that group intentionally share a cart and validate their combined quantity and price. |
| Outer search-description loop | 3 | Recommended: each search variation is an independent test with its own setup, teardown, result, and artifacts. |
| Search loop inside one test | 1 | Intentionally discouraged for independent permutations: the first failure stops later variations, and all variations share one result and retry. |
| Search loop inside one test with `test.step(description, ...)` | 1 | Intentionally discouraged for independent permutations: named steps improve diagnostics but do not provide isolation, independent results, or continuation after failure. |

`getEnvironmentData()` runs during discovery to register the outer-loop cases with descriptive group/variation names. Adding a group or search variation to the dataset registers another independent test. A failed independent case does not ordinarily prevent the other cases from running; retrying it does not repeat successful independent cases. Within each purchase case, quantities are dependent operations whose running sum is the assertion target. Quantity values are environment-specific here because that is the demonstration's testing requirement, while other scenarios may keep quantities as local constants.

These data-driven examples run normally without an opt-in flag. With the current datasets, each environment registers 14 tests per browser: five functional scenarios, eight data-driven cases, and one opt-in Vault test. Across Chromium, Firefox, and WebKit that is 42 registered tests, with 39 enabled and three Vault-demo skips by default.

Run the demonstration spec in one browser and one worker:

```sh
TEST_ENV=DEV npx playwright test tests/data-driven-testing-example-cases.spec.ts --project=chromium --workers=1 --headed
# Use TEST_ENV=SIT or TEST_ENV=UAT for the other datasets.
```

DEV search inputs are `soft stretch jeans`, `SOFT STRETCH JEANS`, and `soft stretch`; all expect the exact product name `Soft Stretch Jeans`. SIT searches for Blue Top, and UAT searches for Rust Red Linen Saree. The full-name, uppercase, and partial inputs exercise different search behaviors while tile selection and validation use the exact `expectedProduct` from data.

## Optional Vault demonstration

The separate Vault demonstration is skipped unless explicitly enabled:

```sh
RUN_VAULT_DEMO=1 TEST_ENV=SIT npx playwright test tests/vault-integration-demo.spec.ts --project=chromium --reporter=list
```

It retrieves `test-account` and verifies nonempty username and password strings through boolean assertions, without printing their values. The normal login/logout case requests Vault independently of `RUN_VAULT_DEMO`.

## Focused verification

These checks use the existing Playwright runner and no additional dependencies:

```sh
npx playwright test --config verification/playwright.config.ts
```

Three mocked lifecycle tests use simulated time to cover cached-token reuse through its lifetime, authentication after expiration, and sanitized authentication/read errors without a live Vault server. Environment checks isolate dotenv inputs and verify shared defaults, exported overrides, file selection, and missing URLs. The password-input check uses self-contained HTML in Chromium, Firefox, and WebKit. These checks use a separate output directory and do not replace the functional HTML report.

Type-check with an available TypeScript compiler (`tsc --noEmit`). The project does not add a compiler dependency; a temporary compiler can be used with `npm exec --yes --package typescript -- tsc --noEmit`.

## Fixtures, diagnostics, and limitations

- `blockAds` is automatic and test-scoped. It blocks advertising requests and logs JavaScript dialog types/messages without resolving them, per ADR 004. Unexpected dialogs fail through timeouts when they block an interaction; nonblocking dialogs may only be logged.
- `environmentData` is optional and test-scoped. It calls the exported `getEnvironmentData()` function in `fixtures/fixtures.ts`, which returns the selected JSON directly through Node's cached `require()`, with loose generic typing. The same synchronous function can be called independently of fixture execution, including during discovery after Playwright loads environment configuration. The outer loops in the data-driven spec use it to register independent cases before fixtures execute.
- `hashicorpVault` is optional and worker-scoped. A new worker, including a replacement after a failure, obtains its own client and token.
- Local and CI runs use one worker to limit load on the public site. Local runs have no retries; CI has two. Screenshots capture failures; traces are collected on the first retry. HTML reports are in `playwright-report/`; individual artifacts are in `test-results/`.
- Live tests require installed browsers, internet access, the public site, and valid environment data. Login additionally requires local Vault and matching application credentials. Mocked checks cannot establish live Vault availability or account suitability. Public-site timing and availability can cause unrelated failures; the framework does not retry mutations or self-heal.
- Secret-read ACL failures and unexpected early token revocation are surfaced. No other Vault auth methods, providers, token renewal, global data fixture, or credential abstraction are implemented. Token timing uses the worker's local clock.

Reports and traces can contain application and form data; review them before sharing. Dependencies, credentials directories, ignored configuration, and generated reports are excluded from Git.

## Layout

```text
fixtures/              Shared fixtures and Playwright exports
libraries/             Standalone HashiCorp Vault client
pages/                 Page objects and scoped row/tile objects
tests/                 Five functional specs, four data-driven patterns, one opt-in Vault demo
verification/          Mocked lifecycle/config checks and browser locator checks
test-data/             DEV/SIT/UAT JSON and upload data
docs/                  Architecture decisions, POM guidance, scenario specifications
playwright.config.ts   Shared/environment dotenv loading, browsers, reporting
```

## Copyright and Usage

Copyright © 2026. All rights reserved.

This repository is publicly available for portfolio review and technical evaluation.

No license is granted to use, modify, redistribute, or incorporate this code into other projects without prior written permission.
