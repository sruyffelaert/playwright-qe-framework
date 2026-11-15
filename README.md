# Playwright QE Framework

A TypeScript Playwright framework exercising the public [Automation Exercise](https://automationexercise.com) demo site. This first iteration carries over the shared fixture, browser configuration, exercise specifications, upload data, and five Automation Exercise tests from `playwright-dev`.

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

Configure the Vault connection as described below. The login/logout test selects the environment data account tagged `Registered account for login and logout`, reads the secret named by its `vaultSecret` field from the selected environment's Vault folder, uses the secret's `username` as the login email and its `password` for authentication, and logs only the user ID. Each initial account mapping references `test-account`. The secret must contain valid Automation Exercise credentials; the expected display name still comes from environment data. `TEST_PASSWORD` is no longer used by this test.

Environment variables supplied by a terminal or CI take precedence over `.env`. The other four application scenarios do not require Vault credentials.

## Run

```sh
npm test                 # All five scenarios in Chromium, Firefox, and WebKit
npm run test:chromium    # Five scenarios in Chromium
npm run test:headed      # Watch the browsers
npm run test:ui          # Interactive Playwright runner
npm run test:list        # List the 15 browser/test combinations
npm run report          # Open the latest HTML report
```

To run the scenarios that do not require an account:

```sh
npm test -- --grep-invert 'Login and log out'
```

## Environment application URLs

Playwright first loads the shared `.env` for Vault connectivity, authentication, and the optional `TEST_ENV` selector. It then loads `.env.<env>` for `BASE_URL`, defaulting to `.env.dev`. Both dotenv loads preserve explicitly supplied process variables, including values supplied by the terminal, CI, or VS Code's `playwright.env` setting. Keep `BASE_URL` in the environment-specific files rather than the shared `.env`.

```dotenv
# .env.dev
BASE_URL=https://automationexercise.com
```

DEV, SIT, and UAT currently use `https://automationexercise.com`. Update the corresponding `.env.<env>` when a separate application environment becomes available, or supply `BASE_URL` through the process environment. Configuration fails clearly before tests start when `BASE_URL` is missing, empty, or invalid; there is no fallback to the DEV site.

`TEST_ENV` accepts uppercase or lowercase values and selects the application URL file, environment-data JSON, and Vault secret folder. Environment JSON contains test data, not application URLs. The existing fixtures and page objects are unchanged: `HomePage.open()` navigates to `/` using Playwright's configured `use.baseURL`.

The actual `.env`, `.env.dev`, `.env.sit`, and `.env.uat` files are Git-ignored. Their `.example` templates contain only public URLs, blank settings, or explicit placeholders and may be tracked.

Validate configuration and list tests without executing them:

```sh
TEST_ENV=dev npx playwright test --list
```

Run one headed browser project:

```sh
TEST_ENV=dev npx playwright test --project=chromium --headed
TEST_ENV=sit npx playwright test --project=chromium --headed
TEST_ENV=uat npx playwright test --project=chromium --headed
```

The missing-URL check also applies to data-only and Vault-only demonstrations using this Playwright config.

## Optional Vault demonstration

`hashicorpVault` is an optional, worker-scoped fixture. Only tests that request it initialize the standalone `HashicorpVault` client. The fixture authenticates once using `VAULT_USERNAME` and `VAULT_PASSWORD` and reuses the in-memory token for secret reads in that worker. The login/logout test requests this fixture and requires Vault; the other application scenarios do not contact Vault. The separate demonstration below remains explicitly opt-in.

Set `VAULT_ADDR`, `VAULT_USERNAME`, and `VAULT_PASSWORD` in your ignored `.env` file or process environment. The Playwright config loads the shared `.env` and selected `.env.<env>`; the library and fixture do not load them again. `TEST_ENV` defaults to `DEV` and selects the lowercase `dev`, `sit`, or `uat` folder. Do not put credentials or tokens in source files or environment JSON.

For the separate `qe-vault-local` project, map its `QE_VAULT_PASSWORD` setting to this project's `VAULT_PASSWORD` and use its team Userpass username. Its default address is `http://127.0.0.1:8200`. The development root token is not needed by this client.

The server must provide Userpass at `auth/userpass` and KV v2 at `secret`. For example, `TEST_ENV=SIT` reads the logical path `secret/sit/test-account` using the API path `/v1/secret/data/sit/test-account`. That secret must contain both `username` and `password`; the Vault authentication account is separate from these application credentials. The client retains authentication metadata but does not renew or automatically refresh expired tokens. HTTP and connection errors are reported without response bodies, credentials, or tokens. See the [Userpass API](https://developer.hashicorp.com/vault/api-docs/auth/userpass#login) and [KV v2 read API](https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-version).

The demonstration is skipped unless explicitly enabled. Run it alone in one browser project:

```sh
RUN_VAULT_DEMO=1 TEST_ENV=DEV npx playwright test tests/vault-integration-demo.spec.ts --project=chromium --reporter=list
```

It retrieves `test-account` and checks that both credential fields are nonempty strings without printing their values. The standalone library can also be used outside Playwright; its caller must supply the environment variables. No local Vault server is included in this repository.

## Coverage

- Add four units of Blue Top and verify quantity and total.
- Add two different products and verify their quantities and totals.
- Remove one product and verify the remaining cart contents.
- Submit the contact form with a file attachment and accept its confirmation dialog.
- Log in with a registered account, verify the displayed name, and log out.

## Layout

```text
fixtures/              Shared automatic ad-blocking fixture and Playwright exports
tests/                Automation Exercise specs only
test-data/uploads/    Sample contact-form attachment
docs/exercises/       Original scenario specifications
playwright.config.ts  Browser projects, parallelism, retries, and reporting
```

Tests use isolated browser contexts. All five specs construct `HomePage` directly and follow returned destination POMs. Locators, control interactions, and assertions belong to the page objects. POM routes use `use.baseURL` in `playwright.config.ts`. The shared fixture blocks advertising requests to reduce interference. Local and CI runs default to one worker to limit load on the public demo site. CI rejects `test.only` and retries failures twice. HTML reports are written to `playwright-report/`; traces are collected on the first retry. Generated results are ignored by Git. Use `npm run report` to open the HTML report.

These are live end-to-end tests: internet access, a reachable demo site, installed Playwright browsers, and valid login credentials are required. Traces and reports can contain account or form data; review them before sharing.

Secrets, credentials directories, dependencies, and generated reports are excluded from Git. Only `.env.example` is intended for publication. No remote repository is configured by this project.

## Copyright and Usage

Copyright © 2026. All rights reserved.

This repository is publicly available for portfolio review and technical evaluation.

No license is granted to use, modify, redistribute, or incorporate this code into other projects without prior written permission.
