# ADR 001 — POM Encapsulation and Validation Responsibilities

**Status:** Accepted  
**Decision Owner:** Framework Architect  
**Scope:** Playwright / TypeScript Quality Engineering Framework

## 1. Context

I designed this framework around a principle I call **Single Point Maintenance**.

In enterprise environments, automated test suites can contain hundreds or thousands of tests. When an application's user interface changes, I want engineers to update the affected implementation in one location rather than modify every test that interacts with it.

A second concern is consistency. I've seen test implementations where engineers use overly permissive text matching, omit visibility checks, or make assumptions about the underlying DOM. These practices can produce false positives and reduce confidence in automated testing.

These problems become particularly important when teams use AI to generate automation. Without explicit architectural conventions, AI-generated tests can introduce the same inconsistencies as manually written tests.

My objective is to provide an architecture that enables engineers to write readable, maintainable tests while establishing consistent standards for element interaction and validation.

## 2. Decision

I have chosen to encapsulate element locators, interactions, state retrieval, and validation within Page Object Model (POM) classes.

Tests should interact with page objects through explicit public methods rather than directly accessing Playwright locators or implementing their own DOM-level assertions.

### 2.1 Locator Encapsulation

All element locators are private to their owning POM.

I want teams to maintain selectors and other DOM-specific details in one location. Tests should not depend on CSS classes, XPath expressions, element identifiers, or the application's HTML structure.

### 2.2 Interaction Methods

POMs expose public methods that describe meaningful user interactions.

Examples include:

```typescript
await loginPage.fillEmail(email);
await loginPage.fillPassword(password);
await loginPage.clickLogin();
```

I am not requiring every interaction to be expressed as a high-level business operation.

Straightforward methods such as `fillEmail()` are acceptable when they communicate intent without unnecessarily coupling tests to the underlying implementation.

For interactions where the UI control is more likely to change, I prefer stronger semantic abstraction.

For example:

```typescript
await preferencesPage.selectOptIn('Yes');
```

The POM might implement this using a checkbox today, radio buttons tomorrow, or a dropdown later.

As long as the underlying business behavior remains unchanged, I want the test interface to remain stable.

### 2.3 Validation Ownership

I have deliberately chosen to make POMs responsible for element-level validation.

Tests specify **what business outcome they expect**, while POMs determine **how that outcome is verified**.

For example:

```typescript
await accountPage.validateEmail('user@example.com');
await preferencesPage.validateOptIn('Yes');
```

I do not want individual test engineers to repeatedly determine which combination of Playwright assertions is sufficient to validate an element.

This decision is intended to improve consistency and reduce the possibility of incomplete or overly permissive assertions.

### 2.4 Validation Contracts

I favor strong, precise assertions over partial or wildcard matching.

However, I do not require every validation method to perform the same set of checks.

The appropriate validation contract depends on the element and the application's acceptance criteria.

My preferred standards are:

- Use exact text, value, and state matching by default.
- Verify visibility when visibility is part of the expected behavior.
- Distinguish between an element existing in the DOM and being visible to the user.
- Permit partial matching where the application's behavior justifies it.
- Preserve Playwright's native assertion retries, timeouts, and failure diagnostics.
- Encapsulate control-specific validation within the POM.

For example, validating an email input might require both visibility and an exact value match. Validating that a product was removed might instead require verifying that its corresponding element is no longer attached to the DOM.

I want the POM to enforce the correct acceptance criteria rather than mechanically apply a universal assertion template.

### 2.5 Explicit Public Interfaces

I prefer explicit, discoverable methods such as:

```typescript
await contactPage.validateEmail(expectedEmail);
await contactPage.validateSubject(expectedSubject);
await contactPage.validateMessage(expectedMessage);
```

Rather than relying exclusively on generic methods such as:

```typescript
await contactPage.validateField('email', expectedEmail);
```

Explicit methods improve IDE discoverability, allow field-specific validation behavior, and give test authors a clear interface.

Although this approach can produce more methods, AI-assisted development substantially reduces the effort required to implement routine interfaces.

I am willing to accept additional code in POMs when it improves test readability, consistency, and maintainability.

## 3. Alternatives Considered

### 3.1 Expose Locators Directly to Tests

Tests could retrieve locators from page objects and perform their own interactions and assertions.

I rejected this as the default architecture because it exposes implementation details and increases the likelihood that UI changes will require updates across multiple tests.

### 3.2 Encapsulate Interactions but Leave Assertions in Tests

This is a common POM approach.

Although it separates interaction mechanics from test scenarios, it still allows engineers to implement inconsistent validations and exposes some UI-specific knowledge to tests.

I chose POM-owned validation to establish stronger, centralized contracts.

### 3.3 Use a Generic Field Interaction and Validation API

A generic API could reduce the number of public methods required by each page object.

However, it can also make interfaces less discoverable and require tests to reference field identifiers rather than meaningful operations.

I prefer explicit methods for the initial framework, while retaining the option to introduce generic abstractions where they provide a demonstrated maintenance benefit.

## 4. Consequences and Trade-offs

### Benefits

**Reduced maintenance effort**

When application presentation or control implementations change, engineers can often update the affected POM without modifying the tests that depend on it.

**Consistent test quality**

Centralized validation methods establish a common standard and reduce differences between individual test authors' assertion practices.

**Improved test readability**

Tests describe user behavior and expected results rather than DOM manipulation.

**Better support for AI-generated automation**

An explicit POM interface provides AI coding agents with established operations and validation contracts, reducing ambiguity during test generation.

**Greater implementation flexibility**

POMs can accommodate changes to control types and page structures without exposing those changes to every consuming test.

### Costs and Limitations

**Larger page-object interfaces**

Explicit interaction, getter, and validation methods increase the amount of code maintained within POMs.

I consider this acceptable when those methods improve consistency and reduce duplication across tests.

**Additional abstraction maintenance**

POMs must evolve with application behavior. Poorly designed abstractions can introduce unnecessary indirection or tightly couple methods to the current implementation.

**Not all application changes can be isolated**

Single Point Maintenance primarily addresses changes to implementation details.

When business behavior or acceptance criteria change, corresponding tests may need to change as well.

**Risk of oversized POMs**

Encapsulating interactions and validations can produce large classes for complex applications.

I intend to address page decomposition and reusable component objects separately rather than weaken encapsulation.

## 5. Decision Summary

I have chosen to prioritize **Single Point Maintenance, consistent validation, and readable test interfaces** over minimizing the amount of code within individual page objects.

I want test engineers to concentrate on application behavior and acceptance criteria without repeatedly implementing DOM interaction and validation mechanics.

The POM is responsible for translating those expectations into reliable, application-specific interactions and assertions.

This architecture is intended to support both human-authored and AI-assisted test development while maintaining consistent quality standards across the framework.