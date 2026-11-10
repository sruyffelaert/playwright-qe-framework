# Page Object Model architecture

Status: proposed architecture for future implementation. This iteration adds documentation only. The current tests remain the reference for existing behavior; none of these conventions changes their implementation or account configuration.

## Repository context

The repository contains five Automation Exercise specs covering cart quantities, multiple products, removal, contact-form upload, and login/logout. The removal spec constructs `HomePage` directly from Playwright’s `page` and follows returned destination POMs; the other specs remain inline. Six page classes currently model Home, Products, Product Details, Cart, Contact Us, and Login. `fixtures/fixtures.ts` supplies an automatic context-level ad-blocking fixture and a dialog listener. This architecture describes both existing page APIs and the required organization for future decomposition; this documentation update does not reorganize production code.

`playwright.config.ts` runs Chromium, Firefox, and WebKit, enables full parallelism, loads `.env`, saves screenshots on failure, and collects traces on the first retry. CI has one worker and two retries; local runs have no retries by default. The configured `use.baseURL` is the application target for relative POM routes. The four remaining inline specs retain their original absolute URLs until they are migrated. `tsconfig.json` currently defines only the fixture alias and Node types. These observations inform the design; changing them is outside this iteration.

## Objectives and ownership

Tests specify **what** to do and validate. Page and component objects enforce **how** their elements are interacted with and validated. Private locators and explicit validation methods are architectural requirements, even where another POM style would expose locators to tests.

| Responsibility | Owner | Public API examples |
| --- | --- | --- |
| Selectors, scoping, control mechanics | Owning page or component | `fillEmail(value)`, `checkTerms()`, `clickSubmit()` |
| Read current state | Owning page or component | `getEmail()`, `isTermsChecked()` |
| Enforce an element validation contract | Owning page or component | `validateEmail(expected)`, `validateTermsChecked(expected)` |
| Verify the page or section is loaded | Its owning POM checks a distinct visible title | `assertLoaded()` |
| Select a scenario and its expected outcomes | Test | Calls actions and validations with explicit expected data |
| Coordinate a reusable journey | Optional flow object | Calls several page APIs; owns no DOM selectors |
| Compare business facts across pages or systems | Test or focused domain validator | Compares typed facts; delegates UI element checks back to their owners |

## Page decomposition and hierarchy

A single application page may contain multiple POM classes. Organize them by logical functionality, complexity, and maintainability, rather than requiring one class per URL. Tabs, panels, forms, and substantial sections may each have a subordinate POM. Do not consolidate dozens of unrelated elements into one class because they share a URL. Decomposition is a deliberate architectural requirement to evaluate during design, not an optimization reserved for excessively large pages. There is no arbitrary element-count threshold.

The parent page owns its page-loaded verification and transitions between its sections. Each subordinate POM owns its scoped locators, interactions, getters, and individual validation contracts. A subordinate POM can represent meaningful functionality within one page without being reused elsewhere or having its own route. Reserve shared component objects for functionality actually shared across page families; reuse is not a prerequisite for page decomposition.

Parents may expose subordinate POMs as public readonly properties so tests can navigate a stable functional hierarchy. For example, `customerDetails.address.fillCity(value)` and `customerDetails.address.validateCity(expected)` express the same ownership boundary. This exposes the functional API, while all locators and browser objects stay private. Avoid forcing a parent to duplicate every subordinate method through forwarding wrappers. Small controls or repeated rows do not automatically need their own class; require a meaningful responsibility boundary.

Each parent and subordinate implements its own `assertLoaded()`. For now this checks only that a major, distinct page or section element is visible and has the complete expected title. Parent verification does not require inactive tabs or optional panels to be visible. A parent navigation action that opens a tab or panel awaits the destination subordinate’s `assertLoaded()` and returns that subordinate POM.

Use composition. Do not begin with a universal base page, a generic element-wrapper hierarchy, a service locator, or a central assertion engine. Explicit methods keep contracts reviewable and preserve native Playwright behavior. A small helper can be extracted later when repeated code has the same semantics and diagnostics; it must not weaken page ownership.

## Naming and layout

All filenames use kebab-case. Page-family filenames share the complete parent prefix so related POMs sort together. Classes use PascalCase: `Page` identifies parent or subordinate page POMs, and `Component` identifies a shared reusable widget. Filenames need not repeat those class suffixes. Methods and private fields use camelCase with meaningful control names, such as `emailInput` and `submitButton`; avoid technical abbreviations in public APIs.

Proposed paths, not directories created in this iteration:

```text
pages/
  customer-details/
    customer-details.ts            # CustomerDetailsPage
    customer-details-address.ts    # CustomerDetailsAddressPage
    customer-details-contacts.ts   # CustomerDetailsContactsPage
    customer-details-financial.ts  # CustomerDetailsFinancialPage
    customer-details-history.ts    # CustomerDetailsHistoryPage
components/
  site-navigation-component.ts     # SiteNavigationComponent
```

Give page-specific subsections the same parent prefix and folder so they sort together. Truly shared components live under `components/`; do not duplicate them under every page merely to preserve alphabetical grouping. Existing filenames do not need a migration as part of this documentation update.

For repeated content, let its owning POM resolve a stable business key internally. Tests supply the key, never a selector or row index unless order is itself the requirement. Expose a subordinate POM when it represents a functional section that tests should address directly; keep implementation helpers private. Do not expose internal row or element wrappers just to mirror DOM nesting.

## Locators and constructors

Declare `private readonly` fields for the Playwright `Page`, used locators, and internal dependencies. Functional subordinate POMs exposed to tests use public readonly properties. Initialize locators and dependencies synchronously in the constructor. Locators are lazy query definitions, so constructor creation does not require the target DOM to exist. Prefer labels, roles with exact accessible names, and stable test IDs; scope repeated names to their component. CSS is acceptable when semantics provide no reliable identity. See [Playwright locators](https://playwright.dev/docs/locators).

Do not expose `Locator`, `Page`, `ElementHandle`, selector strings, a general `find()` function, or callbacks receiving those objects through a public method. A constructor may accept a `Page`, or a subordinate POM or shared component a root `Locator`, for internal dependency injection; tests construct the initial page POM directly using Playwright’s `page`; parent and destination POMs construct their own scoped dependencies.

Constructors do not navigate, await, install event listeners, assert readiness, read credentials, or create test data. Define only selectors needed by actual behavior. Dynamic selectors may be constructed in a private method when their business key is known, with exact identity and escaping handled internally. Do not cache element handles, DOM snapshots, or an `isLoaded` flag across navigation.

## Method formatting

Use the same multiline format for every constructor and method:

- Put the method declaration and opening brace on the first line.
- Start the method content on the following line, indented two spaces inside the method.
- Put each command on its own line.
- Put the closing brace on its own line, aligned with the method declaration.
- Separate methods with one blank line.
- Expand even single-command methods; do not use one-line method bodies.

```ts
async fillEmail(value: string) {
  await this.emailInput.fill(value);
}

async validateEmail(expected: string) {
  await expect(this.emailInput).toBeVisible();
  await expect(this.emailInput).toHaveValue(expected);
}
```

## Interactions and retrieval

Use typed asynchronous methods for ordinary actions and let TypeScript infer their return types. Prefer `fillEmail(value: string)`, `selectCountry(code: string)`, `checkTerms()`, `uncheckTerms()`, and `chooseDeliveryMethod(method)` over generic `setElement()` or boolean-heavy action methods. Native `fill`, `check`, `uncheck`, `selectOption`, and `click` retain their auto-waiting behavior; avoid forced actions or JavaScript clicks as defaults. Playwright checks actionability for supported actions; keep that native behavior. See [auto-waiting](https://playwright.dev/docs/actionability).

Provide complementary typed getters where there is a meaningful readable state: `getEmail()`, `getCountry()`, `isTermsChecked()`. Native file inputs do not reveal the original local path; do not invent a misleading getter to force symmetry. Getters may wait for their documented presence/visibility precondition but return a snapshot, not an eventual expected result. They return data, not DOM objects.

Do not implement `validateEmail(expected)` as `expect(await getEmail()).toBe(expected)`. That loses the locator assertion's retrying comparison. Retrieval is useful for capturing a business fact; validation is the required API for checking an expected UI state.

Action methods wait for their documented immediate completion, such as an add-to-cart confirmation, but do not silently validate every field or business outcome.

### Navigation return contract

Every navigation method must perform the transition, await the destination POM’s `assertLoaded()`, and return that verified POM. This applies to links, valid-login redirects, navigation after form submission, and opening subordinate tabs or panels. A method must reject if the expected destination fails readiness; returning an unchecked object is not allowed. Tests should use the returned object without needing an additional readiness call.

`open()` verifies and returns `this`. Navigation to a different page creates its POM using the same Playwright page, whose browser context carries the configured `baseURL`, verifies it, then returns it. Navigation that reloads the current page, such as product search, verifies the resulting state and returns `this`. Opening a functional subordinate returns that subordinate after its own readiness check. Ordinary field edits, validations, and AJAX actions that do not navigate need no page-object return value.

Page-loaded verification uses a distinct title that remains valid for the destination state. For example, the Contact Us title remains visible after submission, so there is no need for a shared form-versus-confirmation loading policy. Checking the title does not replace the test’s explicit validation of confirmation text or the authenticated user. A positive-login navigation method expects the home page; a future negative-login scenario needs a separately named method with a login-error destination contract rather than silently returning either page.

Direct page-class imports for navigation may reference each other. Construct destination objects inside methods, never as module-level instances or eagerly recursive constructor dependencies. Keep constructors synchronous. Do not introduce a generic factory or expose raw browser objects merely to avoid those imports.

Register response, dialog, popup, or download waits before triggering the action. A same-page asynchronous save without navigation waits for its specific completion signal. Cross-page business flows may still coordinate page APIs, but must not take over readiness verification from a navigation method.

## Validation contracts

Public `validateX(expected)` methods are asynchronous, have inferred return types, and throw native Playwright assertion failures. Provide one method per validation target; decomposing a page moves ownership without combining unrelated validations into a single method. They must not return success booleans or catch failures to continue. Tests choose expected data; they do not choose selector details, a weaker assertion, or which prerequisite checks to omit.

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

Keep assertion timeouts centralized through Playwright's `expect` configuration. If a genuinely slow domain operation needs an override, define a narrow named contract and preserve native timeout options. Avoid a universal options bag allowing callers to disable visibility, attachment, or exactness. Do not log expected passwords or place them in step names.

## Page-loaded verification

Every parent and subordinate POM owns an `assertLoaded()` method. At this time it does only two things:

1. Verify a major, distinct page or section element, such as its heading, is visible.
2. Verify that element contains the complete expected title using a native retrying text assertion.

```ts
async assertLoaded() {
  await expect(this.heading).toBeVisible();
  await expect(this.heading).toHaveText('Login to your account');
}
```

There is no shared readiness helper or generic initialization model. Do not add default URL checks, jQuery checks, load-state checks, network waits, ready attributes, or checks of every form control to this method. If a particular page later needs additional loading verification, add that custom logic directly to that page’s `assertLoaded()` for its specific requirement. Other POMs do not inherit it automatically.

The Contact Us page has an existing page-specific contract from the original test: after verifying its title, `ContactUsPage.assertLoaded()` waits for the document's `load` state before form interaction. Submission registers a five-second dialog wait before clicking, requires a `confirm` dialog with the exact message `Press OK to proceed!`, accepts it, and awaits the click. This method preserves the original action contract: it ends at `await clickPromise`, without calling `assertLoaded()` or returning a POM. The test then calls `validateSuccessMessage(expected)` to verify the visible, complete success text. A dialog assertion failure is left to Playwright teardown; do not add dismissal or recovery handling. This contract belongs only to the Contact Us POM and does not introduce shared loading logic.

Current page markers:

| POM | Distinct element and expected text |
| --- | --- |
| Home | Main content heading: `Features Items` |
| Products | Product-list heading: `All Products`, or `Searched Products` for search results |
| Product Details | Product heading: the exact product name selected by the caller |
| Cart | Current-page breadcrumb: `Shopping Cart` |
| Login | Form heading: `Login to your account` |
| Contact Us | Page heading: `Contact Us` |

A dynamic page receives the expected title from the interaction that selects it. For example, `clickViewProduct(productName)` constructs the product-details POM with that product name so `assertLoaded()` can check it exactly; it must not accept any non-empty heading as sufficient.

`open()` navigates to its relative route using Playwright’s configured `use.baseURL`, awaits its own `assertLoaded()`, and returns `this`. Constructors accept the existing Playwright page, not a hardcoded host or a second base-URL argument. Navigation methods await the destination’s page-loaded verification before returning that POM. Native action auto-waiting and specific interaction handling, such as accepting a confirmation dialog, remain part of the owning page’s action methods.

## Business validation boundaries

An element showing an order total is validated by its owning object, for example `orderPage.validateTotal(expectedTotal)`. A rule comparing a cart, confirmation page, and backend record belongs in a test or focused domain validator. That layer computes the expected total from independent test data or authoritative service data, calls page-owned element validators, and separately asserts service facts.

If a displayed fact must be captured, a getter can return a typed value, followed by domain comparison. Do not use this as an escape hatch for routine field assertions. Avoid computing the expected total solely from the same UI text being validated; that can confirm a consistently wrong result. Flows and domain validators receive page objects or typed facts, never reach into their DOM, and must not redefine element contracts.

## Object creation and lifecycle

Do not add fixtures that construct or inject POMs. The test receives Playwright’s existing `page`, constructs the initial `HomePage`, and calls `open()`. Navigation methods create and return verified destination POMs using that same browser page.

```ts
import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('opens products', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.open();
  const productsPage = await homePage.clickProducts();
  await productsPage.validateSearch('');
});
```

The existing `fixtures/fixtures.ts` still supplies ad blocking from the original framework; it does not create page objects. Playwright’s built-in `page` and browser-context fixtures provide per-test and per-retry browser isolation. Each test creates its own POM instances. Do not use module singletons or worker-scoped holders of a test’s page. Shared accounts and backend data need deliberate isolation and cleanup independently of browser-context isolation.

Parent POMs construct scoped subordinate POMs synchronously and may expose them as readonly functional APIs. Subordinates share their parent’s browser page and test lifetime. All POMs attached to the same `page` describe the active tab, not independent tabs. Explicit popup/new-tab flows require an object for the returned browser page.

Plain POMs need no browser teardown: Playwright closes its owned page and context. If an object registers listeners or creates resources, record ownership and release only what it created. Dialog handling must have one clear owner: the existing fixture listener logs but does not accept dialogs. Contact-form submission registers its confirmation handler before clicking; do not add a competing generic auto-accept handler. See [Playwright fixture lifecycles](https://playwright.dev/docs/test-fixtures).

## Diagnostics and error handling

Use vanilla Playwright assertions without custom messages. Preserve the original Playwright error, locator, expected/received values, and call log. Do not replace it with `throw new Error('Validation failed')`, swallow it, or retry a mutation on any exception. Use `test.step` for useful public operations when reporting benefits; avoid reporting field values containing secrets. Keep default validations hard-failing; soft assertions should require a separately reviewed use case.

Screenshots already capture failures in this repository. The HTML report is under `playwright-report/`, while failure artifacts are under `test-results/`. Traces currently require a first retry, so ordinary local failures may have no trace. This proposal does not change that setting. Inspect reports before sharing because artifacts can include user and form data.

## Decisions and review points

Required design principles are private locators, functional decomposition, a deliberate parent/subordinate hierarchy, individual exact validators, page-owned title verification, and direct, test-local POM construction. Composition implements that hierarchy without exposing DOM details. These provide one reviewable contract per supported behavior without building a second automation runtime. Compared with locator-exposing POMs, this adds named methods but prevents each spec from inventing weaker verification. Compared with a generic validation engine, it keeps control semantics and failure context local. The [official POM guide](https://playwright.dev/docs/pom) provides the underlying object model; this proposal intentionally adds stronger encapsulation and validation ownership.

Before implementing each page family, identify its functional responsibilities and decide which belong to the parent versus subordinate POMs. Choose each object’s distinct visible title and complete expected text, and review the positive/negative states its individual validators must distinguish. Any future loading checks beyond that title belong only in the specific POM that needs them. Choose which functional subordinates the parent exposes to tests; do not defer this design until a page crosses a size threshold. Authentication/test-data provisioning and future changes to the configured target or trace policy need a separate implementation decision; this documentation does not change the current password-only login setup. No unresolved decision blocks reviewing this design. See [the reusable template](pom-template.md) for a concrete specification.
