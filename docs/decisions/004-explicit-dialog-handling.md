# ADR 004 — Explicit JavaScript Dialog Handling and Failure Enforcement

**Status:** Proposed — Pending Review  
**Decision Owner:** Framework Architect  
**Scope:** Playwright / TypeScript Quality Engineering Framework

## 1. Context

Playwright automatically dismisses JavaScript dialogs when no dialog listener is registered. This can conceal unexpected application behavior.

The framework retains a shared, context-level listener so dialogs remain visible in diagnostics and are not automatically dismissed. Application-specific handling stays in the owning POM under ADR 001.

**Reference:** [Playwright — Dialogs](https://playwright.dev/docs/dialogs)

## 2. Decision

Use Playwright's native dialog events and timeouts. Do not introduce custom expectation state, timers, event coordination, or failure aggregation.

### 2.1 Shared Dialog Logging

The shared test fixture registers a browser-context `dialog` listener that logs each dialog's type and message. This applies to JavaScript `alert`, `confirm`, `prompt`, and `beforeunload` dialogs when they are emitted by the browser.

The listener does not accept or dismiss dialogs, validate application expectations, or throw an assertion failure. It does not classify dialogs as expected or unexpected: both are logged.

Playwright owns the test-scoped browser context and closes it during cleanup. The listener is scoped to that context; the framework maintains no separate dialog records between tests.

### 2.2 Expected Dialogs Belong to the POM

The owning POM registers `page.waitForEvent('dialog')` before triggering the action, validates the exact message and type using normal assertions, and explicitly accepts or dismisses the dialog. Prompt input, where needed, is supplied explicitly when accepting it.

`ContactUsPage.clickSubmitAndAcceptConfirmation()` preserves its original implementation:

```typescript
const dialogPromise = this.page.waitForEvent('dialog', { timeout: 5000 });
const clickPromise = this.submitButton.click();
const dialog = await dialogPromise;
expect(dialog.message()).toBe('Press OK to proceed!');
expect(dialog.type()).toBe('confirm');

await dialog.accept();
await clickPromise;
```

Tests interact with the existing public POM method. They do not need to implement its event handling. The caller validates the resulting success message separately.

If the expected dialog does not appear, the native event wait times out after five seconds, unless the enclosing test times out sooner. A mismatched type or message fails its assertion. A mismatched dialog remains unresolved; Playwright cleans up the browser context after the failure. The framework does not dismiss it as recovery.

### 2.3 Unexpected Dialogs and Timeout-Based Failures

A dialog without explicit handling remains open. If it blocks a Playwright interaction, the interaction or enclosing test reaches its configured timeout and fails. Playwright then performs its normal browser cleanup.

The timeout is the failure mechanism. The shared listener's log supplies the dialog type and message for diagnosis; the timeout error itself is not a dedicated unexpected-dialog assertion and need not contain those details.

There is no generic accept, dismiss, ignore, or self-healing behavior.

### 2.4 Known Limitation: Dialogs That Do Not Block an Interaction

Logging does not itself fail a test. If a dialog appears after the last awaited interaction, or otherwise does not block any remaining awaited work, the test may finish successfully despite the unresolved dialog. A `beforeunload` dialog can also require explicit handling because an operation such as `page.close({ runBeforeUnload: true })` does not wait for the page to close.

This design therefore does **not** guarantee failure for every unexpected dialog. It provides logging and timeout-based failure for blocking dialogs. It cannot enforce failure independently of the test's interactions without additional enforcement logic, which this decision deliberately excludes.

An expected-dialog wait consumes one event; it does not authorize additional dialogs. Additional unhandled dialogs remain open and are subject to the same blocking behavior and limitation.

## 3. Alternatives Considered

### 3.1 Playwright's Automatic Dismissal

Rejected because unexpected dialogs can disappear without being observed or affecting execution.

### 3.2 Custom Centralized Enforcement

An expectation registry, custom timers, coordinated event resolution, and aggregated teardown failures could enforce failure even for dialogs that do not block an interaction. Rejected for this implementation in favor of the original native event-handling design and its documented limitation.

### 3.3 Automatically Accept or Dismiss All Dialogs

Rejected because resolving dialogs without validating application-specific expectations can conceal defects.

## 4. Consequences and Trade-offs

- Dialog handling remains small and uses native Playwright events, assertions, and timeouts.
- POMs retain ownership of application-specific messages, types, and responses.
- The shared listener logs both expected and unexpected dialogs without competing to resolve them.
- Blocking unhandled dialogs fail through ordinary interaction or test timeouts, which may take longer and provide less direct diagnostics than a dedicated policy assertion.
- Nonblocking unexpected dialogs may be logged without failing the test. This is an acknowledged limitation, not a guarantee of universal failure enforcement.
- The temporary negative Contact Us test remains unchanged for manual execution. Its previous comments about dismissal and explicit fixture failure describe the superseded enforcement design; this implementation leaves its confirmation unresolved and relies on a blocking interaction timing out. A manual result must be interpreted against this timeout-based contract.
