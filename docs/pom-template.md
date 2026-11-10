# Reusable page-object specification

Status: illustrative design template only. The classes below describe a fictional interface, not Automation Exercise. Keep them in Markdown until a page is explicitly selected for implementation. No fixture, class, application route, or test is added by this document. Follow the contracts in [POM architecture](pom-architecture.md).

## Specification to fill in for each object

| Item | Required decision |
| --- | --- |
| Identity | Class name, `*-page.ts` or `*-component.ts`, page-prefix folder, owning route or scoped UI |
| Dependencies | Private `Page`, constructor-supplied absolute URL if applicable, scoped component roots, any explicit service dependency |
| Supported use cases | Only actions, facts, and validations required by actual scenarios |
| Readiness | Route/screen identity, unique visible root, initialization signal, required active controls; known limitations |
| Fields | `private readonly` locators initialized synchronously in the constructor; no exposed DOM objects |
| Interactions | Intention names, typed parameters, completion signal, transition contract, `Promise<void>` |
| Retrieval | Named typed getters returning current facts; document preconditions and snapshot semantics |
| Validations | Expected data, visibility/attachment policy, complete value/state, exactness, negative-state semantics |
| Components | Scope, owner, delegated methods, readiness only when active |
| Lifecycle | Test-scoped fixture creation, resource ownership and cleanup if needed |
| Diagnostics | Native assertions, meaningful secret-free messages, useful steps, no swallowed failures |

## Standard structure and method rules

Order a class as private fields, synchronous constructor, readiness/navigation, interactions, getters, validators, then private helpers. Use a PascalCase class and camelCase members. Each locator has a purpose; do not predefine an entire DOM inventory. Public methods return `void` or typed facts through promises, never `Locator`, `Page`, or `ElementHandle`. Constructor dependencies are an internal composition boundary rather than a test-facing locator API.

Use `fillX`/`getX`/`validateX` for editable values where all three operations make sense. Use `checkX`/`uncheckX`/`isXChecked`/`validateXChecked` for checkboxes. Use `selectX`/`getX`/`validateX` for a selection. Use `clickX` for a button, and validate its relevant state through a clearly named method. Provide getters when they expose a useful fact, not merely to satisfy symmetry.

`assertLoaded()` verifies the correct page and an actual initialization signal. It is safe to call after direct navigation or a transition and does not navigate or alter application state. `open()` navigates and calls it. An ordinary `clickSubmit()` does not imply success or destination readiness; the caller invokes the destination readiness or an explicit completion validator. Action-specific events are awaited from before the trigger when needed. Avoid sleeps and network-idle heuristics. See [navigation readiness](https://playwright.dev/docs/navigations).

Validation methods use native retrying assertions internally. The example's visible checks already establish attachment, so it omits redundant attachment assertions. A hidden-but-mounted contract instead needs both attachment and hidden checks. A removed contract needs absence. Full string text matching below follows Playwright's whitespace normalization; a separately named containing validator is an intentional weaker contract. See [Playwright locator assertions](https://playwright.dev/docs/api/class-locatorassertions).

## Illustrative TypeScript template

The fictional UI supplies unique accessible names, a `sample-editor` root with `data-state="ready"`, and a scoped `sample-preferences` section. Its documented application contract is that `ready` is set only after handlers and initial data are initialized. A real implementation must verify its own signal; copying this selector does not create readiness. The constructor accepts an absolute URL because the current repository has no configured `baseURL`.

The section is private. Page methods delegate interaction, retrieval, and validation without exposing the section's root. Both classes are shown together for readability; future files would be `sample-editor-page.ts` and `sample-editor-preferences-component.ts` in the same page folder.

```ts
import { expect, type Locator, type Page } from '@playwright/test';

class SampleEditorPreferencesComponent {
  private readonly root: Locator;
  private readonly termsCheckbox: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.termsCheckbox = root.getByRole('checkbox', {
      name: 'Accept terms', exact: true,
    });
  }

  async assertLoaded(): Promise<void> {
    await expect(this.root, 'Preferences section is visible').toBeVisible();
    await expect(this.termsCheckbox, 'Terms checkbox is visible').toBeVisible();
    await expect(this.termsCheckbox, 'Terms checkbox is enabled').toBeEnabled();
  }

  async checkTerms(): Promise<void> {
    await this.termsCheckbox.check();
  }

  async uncheckTerms(): Promise<void> {
    await this.termsCheckbox.uncheck();
  }

  // Snapshot getter; use validateTermsChecked for an eventual expectation.
  async isTermsChecked(): Promise<boolean> {
    await expect(this.termsCheckbox).toBeVisible();
    return this.termsCheckbox.isChecked();
  }

  async validateTermsChecked(expected: boolean): Promise<void> {
    await expect(this.termsCheckbox, 'Terms checkbox is visible').toBeVisible();
    await expect(this.termsCheckbox, 'Terms selection matches').toBeChecked({
      checked: expected,
    });
  }
}

export class SampleEditorPage {
  private readonly page: Page;
  private readonly url: string;
  private readonly root: Locator;
  private readonly heading: Locator;
  private readonly emailInput: Locator;
  private readonly countrySelect: Locator;
  private readonly submitButton: Locator;
  private readonly statusMessage: Locator;
  private readonly preferences: SampleEditorPreferencesComponent;

  constructor(page: Page, absoluteUrl: string) {
    // Synchronous wiring only: no navigation, assertions, or async work.
    this.page = page;
    this.url = absoluteUrl;
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
    this.preferences = new SampleEditorPreferencesComponent(
      this.root.getByTestId('sample-preferences'),
    );
  }

  async open(): Promise<void> {
    await this.page.goto(this.url);
    await this.assertLoaded();
  }

  async assertLoaded(): Promise<void> {
    // This fictional screen requires the entire URL, including query, to match.
    await expect(this.page, 'Sample editor URL matches').toHaveURL(this.url);
    await expect(this.root, 'Sample editor is visible').toBeVisible();
    await expect(this.heading, 'Sample editor heading is visible').toBeVisible();
    await expect(this.root, 'Sample editor handlers and data are ready')
      .toHaveAttribute('data-state', 'ready');
    await expect(this.emailInput, 'Email input is visible').toBeVisible();
    await expect(this.emailInput, 'Email input is editable').toBeEditable();
    await expect(this.countrySelect, 'Country select is visible').toBeVisible();
    await expect(this.countrySelect, 'Country select is enabled').toBeEnabled();
    // Submit may legitimately be disabled until required fields are filled.
    await expect(this.submitButton, 'Submit button is visible').toBeVisible();
    await this.preferences.assertLoaded();
  }

  async fillEmail(value: string): Promise<void> {
    await this.emailInput.fill(value);
  }

  async selectCountry(code: string): Promise<void> {
    await this.countrySelect.selectOption({ value: code });
  }

  async checkTerms(): Promise<void> {
    await this.preferences.checkTerms();
  }

  async uncheckTerms(): Promise<void> {
    await this.preferences.uncheckTerms();
  }

  // Trigger only. Caller explicitly validates completion or destination readiness.
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async getEmail(): Promise<string> {
    await expect(this.emailInput).toBeVisible();
    return this.emailInput.inputValue();
  }

  async getCountry(): Promise<string> {
    await expect(this.countrySelect).toBeVisible();
    return this.countrySelect.inputValue();
  }

  async isTermsChecked(): Promise<boolean> {
    return this.preferences.isTermsChecked();
  }

  async validateEmail(expected: string): Promise<void> {
    await expect(this.emailInput, 'Email input is visible').toBeVisible();
    await expect(this.emailInput, 'Email matches the complete expected value')
      .toHaveValue(expected);
  }

  async validateCountry(expectedCode: string): Promise<void> {
    await expect(this.countrySelect, 'Country select is visible').toBeVisible();
    await expect(this.countrySelect, 'Selected country code matches')
      .toHaveValue(expectedCode);
  }

  async validateTermsChecked(expected: boolean): Promise<void> {
    await this.preferences.validateTermsChecked(expected);
  }

  async validateSubmitEnabled(expected: boolean): Promise<void> {
    await expect(this.submitButton, 'Submit button is visible').toBeVisible();
    if (expected) {
      await expect(this.submitButton, 'Submit button is enabled').toBeEnabled();
    } else {
      await expect(this.submitButton, 'Submit button is disabled').toBeDisabled();
    }
  }

  async validateStatus(expected: string): Promise<void> {
    await expect(this.statusMessage, 'Status message is visible').toBeVisible();
    await expect(this.statusMessage, 'Complete status message matches')
      .toHaveText(expected);
  }

  // Explicit opt-in to partial matching; keeps the visibility requirement.
  async validateStatusContaining(fragment: string): Promise<void> {
    await expect(this.statusMessage, 'Status message is visible').toBeVisible();
    await expect(this.statusMessage, 'Status message contains expected fragment')
      .toContainText(fragment);
  }
}
```

## Future fixture usage

Create a typed `sampleEditorPage` fixture by extending the existing fixture export, depending on the built-in `page`, constructing `SampleEditorPage(page, configuredAbsoluteUrl)`, and yielding it with `await use(object)`. Keep it test-scoped and do not navigate during fixture construction. This is a lifecycle specification, not fixture code to add now. Playwright's own fixtures manage the browser context and page; do not close them from the object. See [fixtures](https://playwright.dev/docs/test-fixtures).

Illustrative test body after that future fixture exists:

```ts
test('edits the form', async ({ sampleEditorPage }) => {
  await sampleEditorPage.open(); // Includes assertLoaded().
  await sampleEditorPage.fillEmail('reader@example.test');
  await sampleEditorPage.validateEmail('reader@example.test');
  await sampleEditorPage.selectCountry('CA');
  await sampleEditorPage.validateCountry('CA');
  await sampleEditorPage.checkTerms();
  await sampleEditorPage.validateTermsChecked(true);
  await sampleEditorPage.validateSubmitEnabled(true);
  await sampleEditorPage.clickSubmit();
  // Fictional contract: successful submission updates a same-page status.
  await sampleEditorPage.validateStatus('Saved');
});
```

## Review before adopting a concrete page

- Verify its locators are private, scoped, unique, and actually used.
- Document the route and initialization signal instead of inferring readiness from load or visibility alone.
- State which actions navigate, open dialogs, or complete asynchronously, and who waits for each outcome.
- Ensure every ordinary validator checks the complete expected state and any required visibility; partial or absent-state contracts must be explicitly named.
- Preserve native retries and diagnostics; getters must not replace UI validators.
- Keep cross-page business comparisons outside the element-owning classes, while delegating UI checks to those classes.
- Verify fixture isolation, data ownership, component lifetime, and listener cleanup for the page's real use cases.
- Keep credentials, environment variable names, and existing scenario behavior unchanged unless a separate task authorizes changes.
