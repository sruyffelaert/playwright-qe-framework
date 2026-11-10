# Page Object Model architecture

Status: proposed architecture for future implementation. This iteration adds documentation only. The current tests remain the reference for existing behavior; none of these conventions changes their implementation or account configuration.

## Repository context

The repository currently contains five inline Automation Exercise specs covering cart quantities, multiple products, removal, contact-form upload, and login/logout. Each spec imports `test` and `expect` through `@fixtures/fixtures`. `fixtures/fixtures.ts` supplies an automatic context-level ad-blocking fixture and a dialog listener. There are no production page or component classes.

`playwright.config.ts` runs Chromium, Firefox, and WebKit, enables full parallelism, loads `.env`, saves screenshots on failure, and collects traces on the first retry. CI has one worker and two retries; local runs have no retries by default. The configuration has no active `baseURL`. `tsconfig.json` currently defines only the fixture alias and Node types. These observations inform the design; changing them is outside this iteration.

## Objectives and ownership

Tests specify **what** to do and validate. Page and component objects enforce **how** their elements are interacted with and validated. Private locators and explicit validation methods are architectural requirements, even where another POM style would expose locators to tests.

| Responsibility | Owner | Public API examples |
| --- | --- | --- |
| Selectors, scoping, control mechanics | Owning page or component | `fillEmail(value)`, `checkTerms()`, `clickSubmit()` |
| Read current state | Owning page or component | `getEmail()`, `isTermsChecked()` |
| Enforce an element validation contract | Owning page or component | `validateEmail(expected)`, `validateTermsChecked(expected)` |
| Establish page identity and initialization | Page; delegates section checks to components | `assertLoaded()` |
| Select a scenario and its expected outcomes | Test | Calls actions and validations with explicit expected data |
| Coordinate a reusable journey | Optional flow object | Calls several page APIs; owns no DOM selectors |
| Compare business facts across pages or systems | Test or focused domain validator | Compares typed facts; delegates UI element checks back to their owners |

A page models a route or distinct screen. A component models a bounded tab, section, dialog, repeated item, or shared widget. Extract a component when it has coherent behavior or reuse, not merely because several elements share a container. A page owns its route and destination readiness; components own only their scoped UI. Components can have their own `assertLoaded()` for an active section, without asserting a global URL.

Use composition. Do not begin with a universal base page, a generic element-wrapper hierarchy, a service locator, or a central assertion engine. Explicit methods keep contracts reviewable and preserve native Playwright behavior. A small helper can be extracted later when repeated code has the same semantics and diagnostics; it must not weaken page ownership.

## Naming and layout

All filenames use kebab-case. Classes use PascalCase with `Page` or `Component` suffixes. Methods and private fields use camelCase with meaningful control names, such as `emailInput` and `submitButton`; avoid technical abbreviations in public APIs.

Proposed paths, not directories created in this iteration:

```text
pages/
  account/
    account-details-component.ts    # AccountDetailsComponent
    account-page.ts                 # AccountPage
    account-security-component.ts   # AccountSecurityComponent
  cart/
    cart-item-component.ts          # CartItemComponent
    cart-page.ts                    # CartPage
components/
  site-navigation-component.ts      # SiteNavigationComponent
```

Give page-specific subsections the same page prefix and folder so they sort together. Truly shared components live under `components/`; do not duplicate them under every page merely to preserve alphabetical grouping. For a repeated row, the page privately resolves a row by a stable business key and creates a scoped component. Tests supply the key, never a selector or row index unless order is itself the requirement.

Prefer private component fields and page methods that delegate their contracts. A readonly public component object is an acceptable deliberate alternative for large, independently meaningful sections, provided it exposes only intention methods and never locators. Default to private composition to keep tests independent of page layout.

## Locators and constructors

Declare `private readonly` fields for the Playwright `Page`, used locators, and owned components. Initialize locators and dependencies synchronously in the constructor. Locators are lazy query definitions, so constructor creation does not require the target DOM to exist. Prefer labels, roles with exact accessible names, and stable test IDs; scope repeated names to their component. CSS is acceptable when semantics provide no reliable identity. See [Playwright locators](https://playwright.dev/docs/locators).

Do not expose `Locator`, `Page`, `ElementHandle`, selector strings, a general `find()` function, or callbacks receiving those objects through a public method. A constructor may accept a `Page`, or a component a root `Locator`, for internal dependency injection; tests use fixtures rather than constructing these dependencies themselves.

Constructors do not navigate, await, install event listeners, assert readiness, read credentials, or create test data. Define only selectors needed by actual behavior. Dynamic selectors may be constructed in a private method when their business key is known, with exact identity and escaping handled internally. Do not cache element handles, DOM snapshots, or an `isLoaded` flag across navigation.

## Interactions and retrieval

Use typed asynchronous methods returning `Promise<void>` for ordinary actions. Prefer `fillEmail(value: string)`, `selectCountry(code: string)`, `checkTerms()`, `uncheckTerms()`, and `chooseDeliveryMethod(method)` over generic `setElement()` or boolean-heavy action methods. Native `fill`, `check`, `uncheck`, `selectOption`, and `click` retain their auto-waiting behavior; avoid forced actions or JavaScript clicks as defaults. Playwright checks actionability for supported actions, but this is not proof that application event handlers have initialized. See [auto-waiting](https://playwright.dev/docs/actionability).

Provide complementary typed getters where there is a meaningful readable state: `getEmail(): Promise<string>`, `getCountry(): Promise<string>`, `isTermsChecked(): Promise<boolean>`. Native file inputs do not reveal the original local path; do not invent a misleading getter to force symmetry. Getters may wait for their documented presence/visibility precondition but return a snapshot, not an eventual expected result. They return data, not DOM objects.

Do not implement `validateEmail(expected)` as `expect(await getEmail()).toBe(expected)`. That loses the locator assertion's retrying comparison. Retrieval is useful for capturing a business fact; validation is the required API for checking an expected UI state.

Action methods wait for their documented immediate completion, such as an add-to-cart confirmation, but do not silently validate every field or business outcome. Every transition method must document whether it leaves readiness verification to the caller or guarantees a destination is loaded. Default: `clickSubmit()` performs the action, and the caller invokes the destination's `assertLoaded()`; a same-page asynchronous save should wait for a specific completed-save signal. Register response, dialog, popup, or download waits before triggering the action. Avoid circular imports between page classes by coordinating cross-page work in the test or a flow.

## Validation contracts

Public `validateX(expected)` methods return `Promise<void>` and throw native Playwright assertion failures. They must not return success booleans or catch failures to continue. Tests choose expected data; they do not choose selector details, a weaker assertion, or which prerequisite checks to omit.

Each method specifies whether the target is singular, must exist, must be visible, and which exact state is expected. Use native retrying locator assertions inside the owner. A visible target necessarily exists and is attached, so do not mechanically prepend `toBeAttached()` to `toBeVisible()`. An attached target can still be hidden; a value or text match does not replace a visibility requirement. Separate assertions are eventual checks, not an atomic snapshot; define a dedicated stable aggregate signal if the application requires simultaneous consistency.

| Target / method | Required contract |
| --- | --- |
| Text input: `validateEmail(expected: string)` | Visible, then `toHaveValue(expected)` |
| Displayed text: `validateStatus(expected: string)` | Visible, then `toHaveText(expected)` |
| Checkbox/radio: `validateTermsChecked(expected: boolean)` | Visible, then `toBeChecked({ checked: expected })`; for radio groups also validate selected option identity |
| Native select: `validateCountry(expectedCode: string)` | Visible select, then exact selected value; add selected-label validation only when the label is part of the contract |
| Native multi-select: `validateCountries(expectedCodes: string[])` | Visible, then `toHaveValues(expectedCodes)` for the complete selection; document ordering semantics |
| Custom dropdown: `validateCountry(expectedLabel: string)` | Visible trigger and exact selected label; validate ARIA selection state if it expresses the widget's selection contract |
| Button: `validateSubmitEnabled(expected: boolean)` | Visible, then positive `toBeEnabled()` or `toBeDisabled()`; enabled alone does not prove visible or unobstructed |
| Hidden target: `validateHelpHidden()` | `toBeHidden()` explicitly allows either hidden or absent; if it must remain mounted, also require `toBeAttached()` |
| Removed target: `validateProductRemoved(key)` | Key-scoped `toHaveCount(0)`; hidden is insufficient to prove removal |
| Collection: `validateProductNames(expectedNames)` | Exact count and visible items plus complete ordered text, unless an explicitly named unordered contract is used |

For a single locator, keep strict matching; do not hide ambiguous matches with `.first()`. For a collection, handle visibility per expected item since a collection text check alone does not establish every item's visibility.

Exact means the complete expected value, case-sensitive by default. String `toHaveText` uses Playwright's whitespace normalization; it is not byte-for-byte DOM text comparison. Input string values do not opt into substring matching. Use `validateStatusContaining(fragment)` as a separate, explicitly weaker method with the same visibility prerequisite. Do not accept `string | RegExp` in ordinary exact validators. A dedicated pattern validator must have a clearly named API and documented reason. See [locator assertions](https://playwright.dev/docs/api/class-locatorassertions) and [retrying assertions](https://playwright.dev/docs/test-assertions).

Keep assertion timeouts centralized through Playwright's `expect` configuration. If a genuinely slow domain operation needs an override, define a narrow named contract and preserve native timeout options. Avoid a universal options bag allowing callers to disable visibility, attachment, or exactness. Do not log expected passwords or place them in step names or custom assertion messages.

## Page readiness

Every page documents `assertLoaded(): Promise<void>` as a repeatable, non-mutating readiness gate. Its contract includes:

1. Route or screen identity: an anchored URL rule when the page has a distinct route, plus a unique visible root or heading. Decide deliberately which trailing slash, query parameters, and route identifiers are valid.
2. Initialization: an observable signal that required JavaScript handlers and initial data are ready, such as an application-owned ready marker or an initially disabled control becoming enabled only after initialization.
3. Required interaction surface: visible and appropriately enabled/editable controls or active components needed by this page's supported actions.

An absent spinner is insufficient on its own: it may not have appeared yet. Likewise, visibility, `load`, a completed click, or a matching URL alone cannot prove hydration is complete. Where the application offers no dependable initialization signal, document the limitation and identify a deterministic, non-destructive observable state; do not pretend a fixed delay fixes it. A response wait establishes only its response condition, not subsequent DOM rendering or event-handler readiness. See [Playwright navigation and hydration guidance](https://playwright.dev/docs/navigations).

`open()` may navigate using an explicitly supplied absolute URL, then call `assertLoaded()`. This works with the repository's current lack of `baseURL`. Future relative routes require an explicitly reviewed configuration change. When entering through another page, use the destination's same readiness method. Components check their own active root and initialization state; do not require closed tabs or optional dialogs to be visible during page readiness.

Avoid `waitForTimeout`, broad `networkidle` gates, manual retry loops, and wrapping an entire mutating workflow in retries. Readiness must not depend on how fast the browser or demo site happens to respond.

## Business validation boundaries

An element showing an order total is validated by its owning object, for example `orderPage.validateTotal(expectedTotal)`. A rule comparing a cart, confirmation page, and backend record belongs in a test or focused domain validator. That layer computes the expected total from independent test data or authoritative service data, calls page-owned element validators, and separately asserts service facts.

If a displayed fact must be captured, a getter can return a typed value, followed by domain comparison. Do not use this as an escape hatch for routine field assertions. Avoid computing the expected total solely from the same UI text being validated; that can confirm a consistently wrong result. Flows and domain validators receive page objects or typed facts, never reach into their DOM, and must not redefine element contracts.

## Fixture integration plan

Future fixtures should extend the existing exported fixture `test`, preserving its automatic ad blocking. Define typed, test-scoped page-object fixtures depending on the built-in `page`; create each object and `await use(object)`. Construction alone performs no navigation, so injecting two page objects cannot make them fight over the same tab. Tests deliberately open a page or trigger a transition, then verify readiness.

Conceptual access, not an implemented fixture:

```ts
test('updates an email', async ({ accountPage }) => {
  await accountPage.open();
  await accountPage.fillEmail(expectedEmail);
  await accountPage.validateEmail(expectedEmail);
});
```

Each test/retry receives its own fixture instances and Playwright browser context. Page objects must not be module singletons or worker-scoped holders of a test's page. Shared accounts and backend data are not isolated merely because contexts are isolated; future data fixtures must provision or partition mutable resources and clean them up.

Pages construct scoped components internally; only independently shared dependencies need fixture injection. All page objects attached to the same built-in `page` describe the currently active tab, not independent browser tabs. Explicit popup/new-tab flows need their own `Page` and object lifecycle.

Plain objects need no browser teardown: the built-in fixtures close their owned resources. If a future object registers listeners or opens resources, record ownership and remove/close only what it created in fixture teardown. Dialog handling must have one clear owner: the current listener logs but does not accept dialogs. Any future contact-form action must register a handler before submitting and must not add a competing generic auto-accept handler. See [Playwright fixture lifecycles](https://playwright.dev/docs/test-fixtures).

## Diagnostics and error handling

Use meaningful assertion messages naming the page/component and contract. Preserve the original Playwright error, locator, expected/received values, and call log. Do not replace it with `throw new Error('Validation failed')`, swallow it, or retry a mutation on any exception. Use `test.step` for useful public operations when reporting benefits; avoid reporting field values containing secrets. Keep default validations hard-failing; soft assertions should require a separately reviewed use case.

Screenshots already capture failures in this repository. The HTML report is under `playwright-report/`, while failure artifacts are under `test-results/`. Traces currently require a first retry, so ordinary local failures may have no trace. This proposal does not change that setting. Inspect reports before sharing because artifacts can include user and form data.

## Decisions and review points

Recommended defaults are private locators and components, composition, exact page-owned validators, repeatable explicit readiness, and test-scoped injection. These provide one reviewable contract per supported behavior without building a second automation runtime. Compared with locator-exposing POMs, this adds named methods but prevents each spec from inventing weaker verification. Compared with a generic validation engine, it keeps control semantics and failure context local. The [official POM guide](https://playwright.dev/docs/pom) provides the underlying object model; this proposal intentionally adds stronger encapsulation and validation ownership.

Before implementing each real page, review its initialization signal, URL identity rule, and the positive/negative states its validators must distinguish. Decide whether any large section warrants a public component API. Authentication/test-data provisioning and any eventual `baseURL` or trace policy change also need a separate implementation decision; this documentation does not change the current password-only login setup. No unresolved decision blocks reviewing this design. See [the reusable template](pom-template.md) for a concrete specification.
