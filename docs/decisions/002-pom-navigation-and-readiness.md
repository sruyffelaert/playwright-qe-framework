# ADR 002 — POM Navigation and Page Readiness

**Status:** Accepted  
**Decision Owner:** Framework Architect  
**Scope:** Playwright / TypeScript Quality Engineering Framework

## 1. Context

One of my primary architectural objectives is **Single Point Maintenance**. I want engineering teams to manage application-specific navigation and synchronization in one location rather than repeatedly implementing that logic throughout their tests.

Navigating to an application page does not necessarily mean that page is ready for interaction. Modern web applications load and initialize their functionality in different ways, and browser navigation events do not universally indicate application readiness.

Playwright explicitly acknowledges this limitation in its official documentation:

> There is no way to tell that the page is `loaded`, it depends on the page, framework, etc.

**Reference:** [Playwright — When is the page loaded?](https://playwright.dev/docs/navigations#when-is-the-page-loaded)

Playwright already provides automatic waiting for element actionability. However, an element can be actionable before the application has finished initializing the functionality behind it.

I want test engineers to navigate between application pages without repeatedly implementing page identification, synchronization, or destination POM instantiation.

## 2. Decision

I have chosen to establish two closely related architectural contracts:

1. **Navigation Contract:** Navigation methods instantiate the destination POM's class, validate the resulting object, and return that instance.
2. **Page Readiness Contract:** Each POM defines the minimum conditions necessary to establish page identity and support reliable initial interaction.

### 2.1 Navigation Methods as Factories

I require navigation methods to return an initialized destination POM instance.

Each navigation method is responsible for:

1. Performing the navigation or transition.
2. Creating an instance of the destination POM's class at runtime, using the existing Playwright page.
3. Invoking the destination instance's readiness contract.
4. Returning that instance only after its readiness contract succeeds.

For example:

```typescript
async navigateToShoppingCart() {
    await this.shoppingCartLink.click();

    const cartPage = new CartPage(this.page);
    await cartPage.assertLoaded();

    return cartPage;
}
```

The source POM is responsible for navigating to the destination and creating its corresponding class instance. This does not create a new browser page or session; the destination POM receives the existing Playwright `Page` object.

This allows tests to express navigation without managing object construction or destination readiness:

```typescript
const cartPage = await productsPage.navigateToShoppingCart();
```

The originating POM owns the navigation mechanism. The destination POM owns its readiness requirements.

I apply this convention to navigation between logical application sections as well as full browser navigations. A transition to another POM does not necessarily require a URL change.

### 2.2 Page Readiness Contract

I require each POM to define an `assertLoaded()` method or equivalent readiness contract.

The contract establishes two conditions:

**Page Identity**

I must be able to establish that navigation reached the intended application page or section.

This requires verifying that one or more distinctive elements exist and are visible.

The number and combination of elements are determined by the page.

For example, one page might be uniquely identified by a heading. Another might require both a heading and a specific image or control.

I do not prescribe a universal number or type of elements.

**Interaction Readiness**

The page must be sufficiently initialized for tests to begin interacting with it reliably, using Playwright's configured retry and timeout mechanisms.

The contract should establish the minimum conditions necessary for consistent execution.

I do not require every section, resource, or asynchronous operation on a page to finish before tests proceed.

### 2.3 Application-Specific Synchronization

I deliberately reject a universal page-loading strategy.

There will be no framework-wide requirement to wait for the browser's `load` event, `domcontentloaded`, network inactivity, or any other loading milestone.

These mechanisms may be useful for particular pages, but none universally establishes application readiness.

I expect each POM to implement the synchronization appropriate to its application behavior.

For example:

```typescript
async assertLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText('Shopping Cart');
}
```

Another page might require additional synchronization because its JavaScript initializes after the relevant elements become visible.

I do not want engineers duplicating waits already provided by Playwright's automatic actionability checks and assertion retries.

The objective is reliable execution, not waiting for its own sake.

### 2.4 Readiness Failures

I consider readiness validation part of the navigation operation, not an optional check.

If the destination POM cannot satisfy its readiness contract within the configured timeout, navigation must fail.

The test should not proceed with an incorrectly identified or insufficiently initialized page.

I also recognize that an initially successful readiness contract cannot guarantee the completion of every subsequent asynchronous operation.

Individual interactions and assertions remain responsible for synchronization with behavior occurring after initial page readiness.

### 2.5 Evolving Readiness Contracts

I expect readiness contracts to evolve as teams gain experience with application behavior.

When intermittent failures demonstrate that a page's current readiness conditions are insufficient, engineers should investigate and strengthen that POM's contract.

This follows my Single Point Maintenance principle: improvements to page synchronization should generally be made in the owning POM rather than repeatedly introduced throughout individual tests.

I favor observable application conditions over arbitrary delays.

A browser loading event can be an appropriate condition when evidence demonstrates that it resolves a particular initialization problem, but it should not become a universal requirement.

## 3. Alternatives Considered

### 3.1 Test-Controlled Navigation and Initialization

Tests could perform navigation directly, instantiate destination POMs, and execute readiness assertions themselves.

I rejected this as the preferred architecture because it distributes navigation and synchronization responsibilities across individual tests.

This increases duplication and creates opportunities for inconsistent initialization behavior.

### 3.2 Navigation Without Destination Validation

Navigation methods could return destination POMs immediately after a click or URL change.

I rejected this approach because it provides no consistent guarantee that the expected destination has been reached and identified.

I want the readiness contract to be an explicit part of navigation.

### 3.3 Universal Browser Load-State Waiting

The framework could require every POM to wait for a standard browser loading milestone.

I rejected this because application architectures and initialization requirements vary.

Such a requirement can introduce unnecessary waiting while still failing to address application-specific readiness problems.

## 4. Consequences and Trade-offs

### Benefits

**Consistent navigation behavior**

Navigation methods return destination POM instances that have satisfied their defined readiness contracts.

**Reduced test complexity**

Test engineers do not need to repeatedly instantiate destination POMs or manage page-specific synchronization.

**Single Point Maintenance**

Changes to navigation mechanisms and readiness conditions can be addressed within the relevant POMs rather than across many tests.

**Application-specific flexibility**

Each POM can implement the minimum synchronization appropriate to its behavior.

**Improved test reliability**

Explicit page identification and readiness validation reduce the risk of tests proceeding against incorrect or incompletely initialized pages.

**Improved diagnostics**

Readiness failures occur at the navigation boundary, making it easier to distinguish navigation and initialization problems from failures in subsequent test interactions.

### Costs and Limitations

**Additional POM responsibility**

POMs must define and maintain readiness contracts in addition to their interaction and validation interfaces.

**Readiness requires engineering judgment**

An insufficient contract may permit intermittent failures. An excessive contract may unnecessarily slow execution or introduce unrelated failure conditions.

**No universal readiness guarantee**

A successful readiness check establishes that the defined contract was satisfied. It does not guarantee that every operation on the application page is functional or complete.

**Application changes may require contract updates**

Changes to page structure or initialization behavior may require revisions to readiness assertions and synchronization conditions.

I consider these costs acceptable because they centralize responsibilities that would otherwise be duplicated throughout the test suite.

## 5. Decision Summary

I have chosen to make navigation responsible for instantiating, validating, and returning destination POM objects.

Each destination POM defines its own readiness contract, verifying page identity through distinctive visible elements and establishing the minimum conditions necessary for reliable initial interaction.

I rely on Playwright's built-in waiting mechanisms wherever appropriate rather than imposing universal synchronization requirements.

When application behavior demonstrates that additional synchronization is necessary, I expect teams to improve the affected POM's readiness contract.

This design extends my **Single Point Maintenance** principle to navigation and page initialization, allowing test engineers to concentrate on application behavior rather than repeatedly managing navigation mechanics.