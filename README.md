# Playwright QE Framework

A TypeScript Playwright framework exercising the public [Automation Exercise](https://automationexercise.com) demo site. This first iteration carries over the shared fixture, browser configuration, exercise specifications, upload data, and five Automation Exercise tests from `playwright-dev`.

## Setup

Use Node.js 20 or newer.

```sh
npm ci
npx playwright install --with-deps
cp .env.example .env
```

Set `TEST_PASSWORD` in `.env`, or export it in the terminal where you run the tests. The login test uses the original hardcoded email and expected account name from `playwright-dev`; the password must belong to that account.

```dotenv
TEST_PASSWORD=your-test-password
```

Environment variables supplied by a terminal or CI take precedence over `.env`. The login test fails if `TEST_PASSWORD` is missing. The other four scenarios need no credentials.

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
