# ADR 003 — POM Decomposition and Reusable Components

**Status:** Accepted  
**Decision Owner:** Framework Architect  
**Scope:** Playwright / TypeScript Quality Engineering Framework

## 1. Context

My POM architecture emphasizes **Single Point Maintenance**, encapsulation, and simple, readable test interfaces.

However, complex application pages can contain many distinct functional areas, repeated structures, and interactive controls. Keeping all their interactions and validations in one POM can introduce unnecessary complexity.

Tables, search results, product listings, and configuration screens illustrate this problem.

For example, a test interacting with a particular table row should not repeatedly identify that row and construct complex chained locators for every interaction.

Similarly, a large configuration screen may contain distinct functional areas that would be easier to maintain independently.

I want to establish guidelines for decomposing POMs without introducing unnecessary complexity into tests.

## 2. Decision

I have chosen to decompose POMs primarily according to **functional and logical boundaries**, while considering how engineers actually interact with the application.

Class size alone is not sufficient justification for decomposition.

### 2.1 Reusable Component Objects

I favor extracting repeated or independently interactive UI structures into component objects.

Examples include:

- Table rows and individual records.
- Product tiles and search results.
- Repeated forms, panels, or interactive containers.

A component object encapsulates the locators, interactions, getters, and validations associated with its portion of the interface.

For example:

```typescript
const row = cartPage.productRow('Blue Top');

await row.validateQuantity(4);
await row.validateTotal('$2000');
```

The test identifies the relevant row once and interacts with its public API.

I do not want test engineers repeatedly implementing the logic required to locate that row or construct selectors for its individual controls.

### 2.2 Scoped Locators

Component objects should operate within a clearly defined portion of the DOM.

For example, the parent POM can identify the requested table row and construct its corresponding component instance:

```typescript
productRow(productName: string) {
    const row = this.productRows.filter({
        has: this.page.getByRole('link', {
            name: productName,
            exact: true
        })
    });

    return new CartProductRow(row, productName);
}
```

The resulting component receives the scoped locator rather than requiring every method to rediscover its position within the page.

This reduces locator complexity, avoids repeated selection logic, and limits interactions to the intended container.

It also supports Single Point Maintenance when the underlying component structure changes.

### 2.3 Functional Page Decomposition

For larger application pages, I may introduce separate POMs representing distinct functional sections.

Examples include:

- Configuration pages with independently managed sections.
- Screens containing multiple functional tabs.
- Large scrolling pages containing substantially unrelated functionality.

However, decomposition must reflect how tests use those sections.

If a workflow routinely interacts with three related sections together, splitting them into three separate POMs may simply introduce additional objects and unnecessary test code.

Conversely, if a section is typically accessed and operated independently, giving it its own POM can improve maintainability and usability.

Tabs are particularly natural boundaries because switching tabs can return an instance representing the newly selected functionality, consistent with ADR 002.

I do not require each visual section to have its own POM.

### 2.4 Parent and Component Responsibilities

A parent POM is responsible for identifying and exposing its subordinate components.

Tests should ordinarily obtain those components through the parent's public interface rather than constructing them directly.

Each component owns the interactions and validations associated with its functional boundary.

This allows tests to work with a meaningful object without needing to understand the surrounding DOM structure.

A component representing an existing portion of the page does not necessarily perform navigation. Its construction is distinct from the navigation-and-readiness contract established in ADR 002.

### 2.5 Balancing Complexity

I recognize that effective decomposition requires engineering judgment.

The objective is not to minimize the number of locators or methods within each class.

Instead, I want to balance:

- The complexity of maintaining the POM implementation.
- The logical independence of its functional areas.
- The simplicity and readability of the resulting test interface.
- The likelihood that a component will be reused or maintained independently.

I am willing to accept larger POMs when keeping related functionality together produces a simpler, more coherent interface.

Equally, I favor smaller components when they eliminate repeated locator logic or isolate clearly distinct behavior.

## 3. Alternatives Considered

### 3.1 One POM per Application Page

A single POM could contain all functionality associated with a browser page.

I rejected this as a universal rule because large or complex pages can produce unnecessarily complicated classes and repeated locator-selection logic.

### 3.2 Decomposition Based on Class Size

POMs could be divided whenever their number of methods, locators, or lines of code exceeds a specified threshold.

I rejected rigid size limits because smaller classes do not necessarily produce simpler automation.

Decomposition should serve functional clarity and maintainability rather than arbitrary code metrics.

### 3.3 Direct Component Locators in Tests

Tests could identify table rows or other containers themselves and interact with their controls using Playwright locators.

I rejected this because it exposes DOM implementation details, duplicates selection logic, and conflicts with the encapsulation principles established in ADR 001.

## 4. Consequences and Trade-offs

### Benefits

**Simplified test interfaces**

Tests can work directly with meaningful components rather than repeatedly locating and manipulating their underlying elements.

**Reduced locator complexity**

Scoped locators allow component methods to operate within a smaller, well-defined DOM boundary.

**Single Point Maintenance**

Changes to component structure or behavior can be addressed within the corresponding object rather than across multiple tests or parent POM methods.

**Improved functional separation**

Independently used application sections can be developed, maintained, and understood separately.

**Reusable implementation patterns**

Components representing similar structures can establish consistent interaction and validation interfaces.

### Costs and Limitations

**Additional classes and relationships**

Decomposition increases the number of objects and relationships maintained within the framework.

**Potential test complexity**

Excessive decomposition can require tests to navigate unnecessarily through multiple object interfaces.

**Architectural judgment**

There is no universal rule determining when a section should become a separate POM or component.

Poorly chosen boundaries can make the framework harder to use.

I accept these trade-offs because the purpose of decomposition is to simplify the overall testing experience, not merely reorganize implementation code.

## 5. Decision Summary

I have chosen to organize POMs around functional and logical boundaries, with particular emphasis on reusable component objects and scoped locators.

I want engineers to interact with meaningful application components without repeatedly locating their controls or understanding their DOM structure.

I will decompose larger pages when their functional areas are sufficiently independent to justify separate interfaces, but I will not impose arbitrary class-size limits.

The guiding principle is to **reduce complexity for both framework maintainers and test engineers**, balancing implementation maintainability against the simplicity of the test-facing API.