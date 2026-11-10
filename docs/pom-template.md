# Reusable page-object specification

Status: illustrative design template only. The classes below describe a fictional interface, not Automation Exercise. Keep them in Markdown until a page is explicitly selected for implementation. No fixture, class, application route, or test is added by this document. Follow the contracts in [POM architecture](pom-architecture.md).

## Specification to fill in for each object

| Item | Required decision |
| --- | --- |
| Identity | Parent or subordinate class name, kebab-case filename with the complete parent prefix, page-family folder, owning route or scoped functionality |
| Dependencies | Private `Page`, relative route resolved through configured `use.baseURL`, scoped subordinate roots, any explicit service dependency |
| Supported use cases | Only actions, facts, and validations required by actual scenarios |
| Page loaded | An `assertLoaded()` method owned by this POM: visibility and complete expected text of a major, distinct title |
| Fields | `private readonly` locators initialized synchronously in the constructor; no exposed DOM objects |
| Interactions | Intention names, typed parameters, completion signal, transition contract, inferred async return type |
| Retrieval | Named typed getters returning current facts; document preconditions and snapshot semantics |
| Validations | Expected data, visibility/attachment policy, complete value/state, exactness, negative-state semantics |
| Decomposition and hierarchy | Functional responsibility boundaries, parent ownership, readonly subordinate APIs, readiness only when active; no element-count threshold |
| Lifecycle | Direct construction in the test using Playwright’s `page`, resource ownership and cleanup if needed |
| Diagnostics | Native assertions without custom messages, useful steps, no swallowed failures |

## Page-family structure

A URL does not determine the number of POM classes. Evaluate decomposition by functionality, complexity, and maintainability during initial design. Tabs, panels, forms, and substantial sections may each own a POM. Avoid grouping unrelated elements solely because they share a page; do not use arbitrary element-count limits. Each subordinate owns its locators, interactions, getters, and individual validation contracts.

Use a common parent prefix for related files, for example `customer-details.ts`, `customer-details-address.ts`, `customer-details-contacts.ts`, `customer-details-financial.ts`, and `customer-details-history.ts`. Parent and subordinate classes use a `Page` suffix; reserve `Component` for shared reusable widgets. Parents may expose readonly subordinates so tests can address functional sections directly, without knowing selectors or DOM structure. Keep incidental element helpers private.

The parent owns section activation such as opening a tab. That navigation action must await the subordinate’s `assertLoaded()` and return the subordinate POM; the caller never has to complete destination readiness. The parent checks its own distinct title; it does not check inactive tabs or optional panels. Subordinates share the parent’s test lifetime and browser page.

## Standard structure and method rules

Order a class as private fields, synchronous constructor, readiness/navigation, interactions, getters, validators, then private helpers. Use a PascalCase class and camelCase members. Each locator has a purpose; do not predefine an entire DOM inventory. Public action and validation methods complete asynchronously; getters return typed facts. Every navigation method returns its destination POM only after awaiting that object’s `assertLoaded()`. Let TypeScript infer return types. Never expose `Locator`, `Page`, or `ElementHandle`; a parent may expose readonly subordinate POMs with their own functional methods. Constructor dependencies are an internal composition boundary rather than a test-facing locator API.

Use `fillX`/`getX`/`validateX` for editable values where all three operations make sense. Use `checkX`/`uncheckX`/`isXChecked`/`validateXChecked` for checkboxes. Use `selectX`/`getX`/`validateX` for a selection. Use `clickX` for a button, and validate its relevant state through a clearly named method. Provide getters when they expose a useful fact, not merely to satisfy symmetry.

`assertLoaded()` currently verifies only that a major, distinct page or section element is visible and has the complete expected title. Each POM owns this method. There is no shared readiness helper, required initialization marker, URL assertion, jQuery check, or default network/load-state wait. Additional loading checks may be custom-added directly to an individual POM’s `assertLoaded()` later if that page requires them.

`open()` navigates, awaits `assertLoaded()`, and returns `this`. Every navigation method awaits the destination’s `assertLoaded()` and returns that POM. A same-page reload returns `this` after its own title check; opening a functional tab returns its verified subordinate. Non-navigating actions and individual business validators keep their separate responsibilities.

Validation methods use native retrying assertions internally. The example's visible checks already establish attachment, so it omits redundant attachment assertions. A hidden-but-mounted contract instead needs both attachment and hidden checks. A removed contract needs absence. Full string text matching below follows Playwright's whitespace normalization; a separately named containing validator is an intentional weaker contract. See [Playwright locator assertions](https://playwright.dev/docs/api/class-locatorassertions).

## Illustrative TypeScript template

The fictional UI supplies a `Sample editor` heading and a `Preferences` heading inside a scoped preferences panel. Each owning POM verifies only its heading’s visibility and complete text. The constructor accepts Playwright’s `page`; relative navigation uses `use.baseURL` from `playwright.config.ts`.

The preferences panel is a subordinate POM exposed through a readonly `preferences` property. It owns its controls and individual validations. Both classes are shown together for readability; future files would be `sample-editor.ts` and `sample-editor-preferences.ts` in the same page-family folder. This example keeps the panel always visible. A tabbed variant would let the parent activate the tab and await the subordinate’s title check before returning it.

```ts
import { expect, type Locator, type Page } from '@playwright/test';

class SampleEditorPreferencesPage {
  private readonly root: Locator;
  private readonly heading: Locator;
  private readonly termsCheckbox: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.heading = root.getByRole('heading', { name: 'Preferences', exact: true });
    this.termsCheckbox = root.getByRole('checkbox', {
      name: 'Accept terms', exact: true,
    });
  }

  async assertLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText('Preferences');
  }

  async checkTerms() {
    await this.termsCheckbox.check();
  }

  async uncheckTerms() {
    await this.termsCheckbox.uncheck();
  }

  // Snapshot getter; use validateTermsChecked for an eventual expectation.
  async isTermsChecked() {
    await expect(this.termsCheckbox).toBeVisible();
    return this.termsCheckbox.isChecked();
  }

  async validateTermsChecked(expected: boolean) {
    await expect(this.termsCheckbox).toBeVisible();
    await expect(this.termsCheckbox).toBeChecked({
      checked: expected,
    });
  }
}

export class SampleEditorPage {
  private readonly page: Page;
  private readonly path: string;
  private readonly root: Locator;
  private readonly heading: Locator;
  private readonly emailInput: Locator;
  private readonly countrySelect: Locator;
  private readonly submitButton: Locator;
  private readonly statusMessage: Locator;
  readonly preferences: SampleEditorPreferencesPage;

  constructor(page: Page) {
    // Synchronous wiring only: no navigation, assertions, or async work.
    this.page = page;
    this.path = '/sample-editor';
    this.root = page.getByTestId('sample-editor');
    this.heading = this.root.getByRole('heading', {
      name: 'Sample editor', exact: true,
    });
    this.emailInput = this.root.getByRole('textbox', {
      name: 'Email', exact: true,
    });
    this.countrySelect = this.root.getByRole('combobox', {
      name: 'Country', exact: true,
    });
    this.submitButton = this.root.getByRole('button', {
      name: 'Submit', exact: true,
    });
    this.statusMessage = this.root.getByRole('status');
    this.preferences = new SampleEditorPreferencesPage(
      this.root.getByTestId('sample-preferences'),
    );
  }

  async open() {
    await this.page.goto(this.path);
    await this.assertLoaded();
    return this;
  }

  async assertLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText('Sample editor');
  }

  async fillEmail(value: string) {
    await this.emailInput.fill(value);
  }

  async selectCountry(code: string) {
    await this.countrySelect.selectOption({ value: code });
  }

  // Fictional non-navigating submit; validateStatus waits for the saved outcome.
  // If this action navigated, it would verify and return its destination POM.
  async clickSubmit() {
    await this.submitButton.click();
  }

  async getEmail() {
    await expect(this.emailInput).toBeVisible();
    return this.emailInput.inputValue();
  }

  async getCountry() {
    await expect(this.countrySelect).toBeVisible();
    return this.countrySelect.inputValue();
  }

  async validateEmail(expected: string) {
    await expect(this.emailInput).toBeVisible();
    await expect(this.emailInput).toHaveValue(expected);
  }

  async validateCountry(expectedCode: string) {
    await expect(this.countrySelect).toBeVisible();
    await expect(this.countrySelect).toHaveValue(expectedCode);
  }

  async validateSubmitEnabled(expected: boolean) {
    await expect(this.submitButton).toBeVisible();
    if (expected) {
      await expect(this.submitButton).toBeEnabled();
    } else {
      await expect(this.submitButton).toBeDisabled();
    }
  }

  async validateStatus(expected: string) {
    await expect(this.statusMessage).toBeVisible();
    await expect(this.statusMessage).toHaveText(expected);
  }

  // Explicit opt-in to partial matching; keeps the visibility requirement.
  async validateStatusContaining(fragment: string) {
    await expect(this.statusMessage).toBeVisible();
    await expect(this.statusMessage).toContainText(fragment);
  }
}
```

## Navigation to a subordinate

For a tabbed variant, the parent owns the tab locator and exposes the section POM. Its navigation method follows this contract:

```ts
async openPreferences() {
  await this.preferencesTab.click();
  await this.preferences.assertLoaded();
  return this.preferences;
}
```

The test uses `const preferences = await editor.openPreferences()` and calls `preferences.checkTerms()` or `preferences.validateTermsChecked(true)`. For a separate route, create the destination POM using the existing browser page and its configured base URL, await its `assertLoaded()`, and return it. The constructor still performs no asynchronous work. A failed readiness check must propagate instead of returning an unverified destination.

## Direct use from a test

Construct the initial page POM directly and call `open()`. Playwright’s built-in browser context carries the configured base URL. Do not introduce a page-object fixture. The parent constructs its subordinate `preferences` POM synchronously, and navigation methods return verified destination POMs. Browser and context cleanup remains with Playwright.

```ts
import { test } from '@fixtures/fixtures';
import { SampleEditorPage } from '../pages/sample-editor/sample-editor';

test('edits the form', async ({ page }) => {
  const editor = new SampleEditorPage(page);
  await editor.open();
  await editor.fillEmail('reader@example.test');
  await editor.validateEmail('reader@example.test');
  await editor.selectCountry('CA');
  await editor.validateCountry('CA');
  await editor.preferences.checkTerms();
  await editor.preferences.validateTermsChecked(true);
  await editor.validateSubmitEnabled(true);
  await editor.clickSubmit();
  // Fictional contract: successful submission updates a same-page status.
  await editor.validateStatus('Saved');
});
```

## Review before adopting a concrete page

- Identify functional responsibilities and deliberate decomposition before implementing selectors; sharing a URL does not require sharing a class.
- Verify each subordinate owns its locators, interactions, getters, and one-method-per-target validation contracts.
- Verify parent/subordinate filenames share the complete parent prefix and tests can reach exposed sections through readonly functional properties.
- Verify its locators are private, scoped, unique, and actually used.
- Give each POM its own `assertLoaded()` that checks a distinct title is visible and exactly correct. Keep any future custom loading checks local to that POM; do not introduce a shared readiness model.
- State which actions navigate, open dialogs, or complete asynchronously. Every navigation method must await destination readiness and return that verified POM, including same-page reloads and subordinate navigation.
- Ensure every ordinary validator checks the complete expected state and any required visibility; partial or absent-state contracts must be explicitly named.
- Preserve native retries and diagnostics; getters must not replace UI validators.
- Keep cross-page business comparisons outside the element-owning classes, while delegating UI checks to those classes.
- Verify direct POM construction, relative routes against configured `use.baseURL`, browser-context isolation, data ownership, subordinate lifetime, and listener cleanup. Do not introduce POM fixtures.
- Keep credentials, environment variable names, and existing scenario behavior unchanged unless a separate task authorizes changes.
