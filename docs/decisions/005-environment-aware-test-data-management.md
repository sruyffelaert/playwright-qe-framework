# ADR 005 — Environment-Aware Test Data Management

**Status:** Accepted
**Decision Owner:** Framework Architect  
**Scope:** Playwright / TypeScript Quality Engineering Framework

## 1. Context

I designed this framework around **Single Point Maintenance**, with the objective of minimizing changes to automated tests when application implementation or test environments change.

Test data introduces a similar maintenance challenge.

In enterprise environments, development, system integration testing (SIT), and user acceptance testing (UAT) environments frequently contain different accounts, inventory, configurations, and other application data.

A test referencing a specific account number, username, or inventory item may work in one environment but fail in another, despite both environments supporting the same business functionality.

I want engineers to describe the **data characteristics required by their tests**, rather than hardcode the identities of specific application entities.

I also want teams to manage their environment-specific data independently of their test logic, without introducing unnecessary data-processing frameworks.

## 2. Decision

I have chosen to implement environment-aware Test Data Management (TDM) using JSON datasets exposed directly to Playwright tests through an optional fixture.

The architecture is based on four principles:

1. Tests reference data through descriptive, meaningful tags.
2. Environment-specific data is maintained separately from test scenarios.
3. Data is loaded into memory and accessed through its native JSON structure.
4. Tests request the data fixture only when needed.

### 2.1 Environment-Specific Data

Each test environment has its own JSON data file.

The initial naming convention is:

```text
test-data/
  dev/
    environment-data.dev.json
  sit/
    environment-data.sit.json
  uat/
    environment-data.uat.json
```

The active environment is identified using `TEST_ENV`. Playwright loads the shared `.env` first, then `.env.<environment>` for `BASE_URL`. An exported process variable takes precedence over file values. The `.env` value selects the default environment; if neither source supplies `TEST_ENV`, it defaults to `DEV`. Selection is case insensitive. VS Code workspace settings do not impose an environment override.

For example:

```typescript
const env = (process.env.TEST_ENV ?? 'dev').toLowerCase();
const data = require(`../test-data/${env}/environment-data.${env}.json`);
```

DEV, SIT, and UAT each have an environment-data JSON file, an ignored `.env.<environment>` containing `BASE_URL`, and a corresponding lowercase Vault secret folder. All three application URL examples currently point to the public Automation Exercise site. Application URLs and Vault connection settings are configuration, not JSON test data. The shared `.env` holds Vault connectivity and team authentication; safe `.example` files document the settings. Missing or invalid `BASE_URL` fails configuration before tests start. The config loads dotenv; fixtures and the Vault library do not initialize it again.

I have initially chosen one JSON file per environment. I do not consider this a permanent restriction; additional files can be introduced when actual application requirements justify them.

### 2.2 Descriptive Data Requirements

I deliberately avoid identifying test data by the specific application entities currently used.

For example, engineers frequently reference environment-specific information directly within tests:

| Hardcoded reference | Descriptive data requirement |
|---|---|
| `Account #1234` | Account with one million dollars in available cash |
| `SITAdminUser` | Application administrator with user-management privileges |
| `Blue Top` | First in-stock product allowing multiple quantities |

The problem is that these identifiers describe **which entity currently satisfies the requirement**, rather than **why that entity was selected**.

`Account #1234` may have the required cash balance today but not tomorrow. `SITAdminUser` may exist in SIT but not UAT. A product named `Blue Top` may be removed from inventory entirely.

When these identifiers are hardcoded, such changes can require updates to numerous tests even though the underlying business requirements remain unchanged.

Instead, I want tests to reference descriptive tags that explain the characteristics of the required data.

My environment data uses tags such as:

```text
Account with one million dollars in available cash
Application administrator with user-management privileges
First in-stock product allowing multiple quantities
Second in-stock product allowing multiple quantities
```

Each environment maps these requirements to actual entities that satisfy them.

An example product mapping is:

```json
{
  "Currency": "Rs.",
  "PRODUCTS": {
    "First in-stock product allowing multiple quantities": {
      "search": "Blue Top",
      "name": "Blue Top",
      "price": 500
    },
    "Second in-stock product allowing multiple quantities": {
      "search": "Men tshirt",
      "name": "Men Tshirt",
      "price": 400
    }
  }
}
```

If an inventory item becomes unavailable, engineers can replace its environment mapping with another suitable product without modifying the test.

The same principle applies to accounts. Environment data maps the descriptive account requirement to a `vaultSecret` name and expected `displayName`. Vault stores the application login email as `username` and its matching `password`. The secret reference or its values can change independently of the test logic.

The replacement must continue to satisfy the requirements described by the tag.

This is particularly important when the same test suite executes across multiple environments with independently maintained data.

**Tests declare their business data requirements. Environment datasets supply the actual application entities that fulfill those requirements.**

### 2.3 Separation of Environment Data and Scenario Data

Not all test data belongs in an environment-specific file.

I distinguish between:

**Environment-specific data**

Information that may differ between environments, including:

- Account identities and user IDs.
- Product identities, prices, and inventory.
- Environment-specific application data.
- Other entities needed to satisfy particular test conditions.

**Environment-independent scenario data**

Information determined by the scenario rather than the environment, including:

- Quantities selected by a test.
- Generic form inputs.
- Test permutations and boundary values.
- Expected results derived from scenario behavior.

For example, a test may select a product from environment data while defining its desired quantity locally:

```typescript
const product = environmentData.PRODUCTS[
  'First in-stock product allowing multiple quantities'
];

const quantity = 4;
```

The expected result can then be calculated using the environment's known product price:

```typescript
await productRow.validateTotal(
  `${environmentData.Currency} ${product.price * quantity}`
);
```

This avoids hardcoding environment-dependent prices while preserving scenario-specific test logic.

I also intend to support a separate global dataset for reusable, environment-independent data. That capability will follow the same general approach but does not need to be implemented as part of the initial environment-data fixture.

### 2.4 Optional Playwright Fixture

I expose environment data through a dedicated `environmentData` fixture.

Unlike framework infrastructure that must run for every test, this fixture is not automatic.

Tests explicitly request it:

```typescript
test('Add multiple quantities to cart', async ({ page, environmentData }) => {
  // Test implementation
});
```

Tests that do not require environment data have no dependency on the fixture.

I prefer this modular approach because not every application or test requires managed data.

### 2.5 Direct JSON Access and Iteration

I want JSON data to remain accessible through ordinary JavaScript and TypeScript operations, without unnecessary transformation or custom iteration engines.

Node.js loads the JSON structure directly into memory through `require()`, which also provides module caching within the process.

Tests can access named datasets using standard object properties and keys.

For example:

```typescript
environmentData.PRODUCTS[
  'First in-stock product allowing multiple quantities'
]
```

The same mechanism supports nested collections and permutations:

```typescript
for (const groupName in environmentData.PERMUTATION_TESTS) {
  for (const value of environmentData.PERMUTATION_TESTS[groupName]) {
    console.log(value);
  }
}
```

I prefer this straightforward approach because engineers can understand and work with the JSON structure without learning a proprietary data-access API.

### 2.6 Vault Credentials and Token Lifecycle

Account environment data contains a reference and nonsecret validation metadata:

```json
{
  "ACCOUNTS": {
    "Registered account for login and logout": {
      "vaultSecret": "test-account",
      "displayName": "ba"
    }
  }
}
```

The login/logout case requests both optional fixtures and reads the named secret:

```typescript
const account = environmentData.ACCOUNTS['Registered account for login and logout'];
const { username, password } = await hashicorpVault.getSecret(account.vaultSecret);
```

For SIT, this resolves to `secret/sit/test-account` through Vault's KV v2 API. The username is used as the login email, and the password is passed to the POM. The expected display name comes from JSON. The case logs the user ID, but never the password. Application credentials are stored in Vault rather than JSON or `.env`.

The standalone `HashicorpVault` class uses `VAULT_ADDR`, `VAULT_USERNAME`, and `VAULT_PASSWORD` for the team's Userpass authentication. These secret-zero credentials are separate from the retrieved application credentials. The client uses native fetch and has no Playwright or dotenv dependency. The existing optional, worker-scoped `hashicorpVault` fixture creates and authenticates one instance when first requested; it does not initialize for tests that do not request it.

The client caches Vault's token, renewable flag, and expiration information in memory. It checks the returned `lease_duration` before secret reads. A renewable token is renewed through `auth/token/renew-self` within 30 seconds of expiration. For leases of 30 seconds or less, the renewal window is 10% of the TTL. Renewal updates the cached token and expiration from the returned metadata. Expired tokens and failed or malformed renewals trigger a fresh Userpass login. Valid nonrenewable tokens are reused until expiry; TTL zero is treated as nonexpiring. Operations run sequentially within each worker; no promise locking or request coalescing is implemented. There are no lifecycle timers, background tasks, or per-read logins while the token remains usable.

Unsuccessful login or secret reads fail with sanitized operation and HTTP diagnostics, without response bodies, credentials, or tokens. If renewal and replacement login both fail, the old token is not used. A read-time 403 is reported rather than blindly retried because it can indicate insufficient policy or early revocation. Renewal requires the team's token policy to allow `auth/token/renew-self`. See [Vault token renewal](https://developer.hashicorp.com/vault/api-docs/auth/token#renew-a-token-self).

Environment configuration, environment data, and Vault access remain independently selectable capabilities. Both optional fixtures use the environment configured by Playwright. The Vault client can also run independently when its caller supplies the environment variables.

### 2.7 Current Fixtures and Demonstrations

The automatic, test-scoped `blockAds` fixture preserves advertising filters and the logging-only dialog behavior defined by ADR 004. The optional, test-scoped `environmentData` fixture exposes JSON directly through `require()`. The optional, worker-scoped `hashicorpVault` fixture owns the authenticated client. Tests still construct POMs directly; fixtures do not inject page objects.

Five functional scenarios cover quantities, multiple products, removal, contact form upload, and login/logout. Environment data supplies the cart products/prices and account metadata. Contact Us uses scenario-owned form inputs. The login/logout case retrieves credentials from Vault.

Both demonstrations are opt-in. `RUN_TDM_DEMO=1` enables the single nested-loop iteration test; `RUN_VAULT_DEMO=1` enables the single secret-presence test. The current demonstration permutations intentionally differ between environments so selection is visible in console output. Ordinary runs skip both demonstrations; the login/logout scenario still requires Vault.

Focused verification includes five mocked lifecycle scenarios with simulated time: caching, renewal, expiration, renewal failure, and sanitized authentication/read errors. The existing environment-config and password-input checks remain separate. It uses the existing Playwright runner under `verification/`, with no added test framework or dependency. Live regression scenarios remain dependent on the application and local Vault.

## 3. Alternatives Considered

### 3.1 Hardcode Application Entities in Tests

Tests could directly reference account numbers such as `Account #1234`, usernames such as `SITAdminUser`, or specific product names and prices.

I rejected this because environment differences and data changes would require modifications to test code rather than data configuration.

### 3.2 Identify Data by Actual Entity Names

Datasets could use names such as `Blue Top`, `SITAdminUser`, or specific account numbers as their lookup keys.

I rejected this because those identifiers describe the current data rather than the business requirements that make the data suitable.

Descriptive tags preserve test intent when actual entities change.

### 3.3 Move All Test Data into Environment Files

Every input and expected value could be externalized.

I rejected this because quantities, generic text, and scenario-specific decisions do not necessarily depend on the environment.

Moving them into environment files would introduce unnecessary coupling and obscure test intent.

### 3.4 Introduce a Custom Data-Management API

A framework-specific library could interpret datasets, resolve tags, and manage iteration.

I rejected this for the initial implementation because native JSON access and standard language constructs already provide the required functionality.

Additional abstractions should address demonstrated needs rather than hypothetical complexity.

## 4. Consequences and Trade-offs

### Benefits

**Environment independence**

Tests can execute against different environments without changing their business logic, provided suitable data mappings exist.

**Single Point Maintenance**

When an account, user, or product changes, engineers can update its environment mapping rather than modify every dependent test.

**Clear test intent**

Descriptive tags communicate why particular data is required.

**Simplified implementation**

Native JSON loading and direct object access minimize framework-specific code.

**Modular adoption**

Tests use managed environment data only when necessary.

**Extensibility**

The architecture can accommodate additional environments, global datasets, and credential-management capabilities incrementally.

### Costs and Limitations

**Data maintenance responsibility**

Engineers must maintain accurate mappings and ensure that entities continue to satisfy their descriptive requirements.

**No automatic verification of data suitability**

The initial implementation does not independently verify that every mapped entity satisfies its tag. Tests may fail if environment data becomes stale or unsuitable.

**Potential data duplication**

Separate environments may contain similar data. I accept this because their actual application entities and values may differ.

**Loose JSON typing**

The initial fixture exposes a flexible JSON object rather than enforcing a comprehensive schema. This favors simplicity but provides fewer compile-time guarantees.

**Test environment availability**

Successful execution depends on the required data existing in the selected environment. The login/logout case additionally requires a reachable Vault server, suitable read/renew policies, and credentials valid for the application. Mocked lifecycle checks do not prove live connectivity or account validity. The public demo site may also fail through availability or timing issues.

**Vault scope and failure handling**

Userpass and KV v2 are the supported Vault mechanisms. Other auth methods/providers and background renewal are not implemented. TTL calculations use the worker's local clock. A secret-read 403 is surfaced without automatic retry or guessing whether the token was revoked early. A shared global dataset is still deferred. ADR 004's limitation for nonblocking unexpected dialogs remains in effect.

## 5. Decision Summary

I have chosen a lightweight, environment-aware Test Data Management architecture based on JSON and optional Playwright fixtures.

The central design principle is that **tests specify the characteristics of the data they need, while environment datasets identify actual entities satisfying those requirements**.

I intentionally separate environment-dependent application data from scenario-specific test inputs.

I favor descriptive tags, direct JSON access, and native language iteration over unnecessary framework abstractions.

This extends **Single Point Maintenance** to test data, allowing engineers to update application data mappings without repeatedly modifying the tests that consume them.