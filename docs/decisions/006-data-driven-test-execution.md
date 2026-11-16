# ADR 006 — Data-Driven Test Execution and Failure Isolation

**Status:** Accepted
**Decision Owner:** Framework Architect  
**Scope:** Playwright / TypeScript Quality Engineering Framework

## 1. Context

Data-driven testing allows the same business behavior to be validated against multiple input datasets without duplicating test implementations.

However, how those datasets are iterated significantly affects execution independence, failure isolation, reporting, and diagnostics.

Executing multiple independent permutations inside a single Playwright test creates dependencies that do not exist in the underlying business scenarios.

A failure in the first permutation prevents later permutations from executing. The test report identifies one failed test rather than independently recording the results of each permutation.

I want the framework to preserve clear test ownership and maximize the diagnostic value of every execution.

## 2. Decision

**Independent data permutations must generate independent Playwright test cases.**

Use native TypeScript iteration outside the `test()` declaration to register each permutation during Playwright test discovery.

### 2.1 Independent Test Generation — Recommended

```typescript
for (const description in getEnvironmentData().PRODUCT_SEARCH_VARIATIONS) {
  test(`${description}: search returns the expected product`, async ({ page, environmentData }) => {
    const variation = environmentData.PRODUCT_SEARCH_VARIATIONS[description];

    // Execute and validate this permutation
  });
}
```

Each generated test receives:

- Its own test identity and descriptive name.
- Independent Playwright fixture and browser-context lifecycle.
- An individual pass/fail result.
- Independent failure diagnostics and retry behavior.

Adding a variation to the dataset automatically registers another test without modifying the test implementation.

The shared `getEnvironmentData()` function established in ADR 005 makes data available during test discovery, when Playwright registers tests.

### 2.2 Nested Iteration — Recommended When Operations Are Dependent

Iteration inside a test is appropriate when the operations collectively represent **one business scenario**.

For example, a purchase scenario may add multiple quantities of a product to the same cart and validate their combined quantity and total price.

```typescript
for (const groupName in getEnvironmentData().PURCHASE_QUANTITIES) {
  test(`${groupName}: add quantities to cart`, async ({ page, environmentData }) => {
    for (const quantity of environmentData.PURCHASE_QUANTITIES[groupName]) {
      // Add quantity to the shared cart
    }

    // Validate the combined cart result
  });
}
```

The outer loop creates independent purchase scenarios. The inner loop executes dependent operations that belong to each scenario.

A failure appropriately terminates that group's workflow without ordinarily preventing other groups from executing.

**The unit of independence is the business scenario, not necessarily every individual data value.**

### 2.3 Internal Iteration of Independent Permutations — Not Recommended

Executing all independent permutations inside one `test()` declaration is discouraged because:

- The first unhandled failure blocks subsequent permutations.
- One test result represents several distinct validations.
- Identifying the failing permutation requires examining diagnostics rather than the test identity.
- Retrying the test repeats successful permutations unnecessarily.
- Execution state is shared across permutations.

These characteristics reduce test coverage during failures and complicate diagnosis.

### 2.4 `test.step()` Is Not a Substitute for Independent Tests

Playwright's `test.step()` can assign descriptive names to operations and improve report navigation.

However, it does not establish independent test execution.

A failed step still stops subsequent iterations, and the enclosing test retains one overall result.

Use `test.step()` to organize related operations within a business scenario, not to represent independently executable permutations.

## 3. Alternatives Considered

**Loop through every permutation inside one test.** Rejected for independent validations because of failure blocking, shared execution state, and ambiguous result ownership.

**Wrap every permutation in `test.step()`.** Rejected as an alternative to independent tests because reporting improvements do not provide failure isolation.

**Introduce a custom parameterization framework.** Rejected because native TypeScript loops and Playwright test registration already provide the required functionality.

## 4. Consequences and Trade-offs

### Benefits

- Greater failure isolation and diagnostic precision.
- Individual reporting for each business permutation.
- Independent retries and fixture lifecycles.
- Data-driven test expansion without duplicating test implementations.
- No custom iteration framework or additional dependencies.

### Costs and Limitations

- Independent tests repeat setup and teardown, increasing execution time.
- Test permutations must be available during test discovery; asynchronous test fixtures cannot generate additional test declarations.
- Dependent operations within a business scenario remain subject to normal failure blocking.
- Global settings such as fail-fast execution can still prevent later tests from running.

## 5. Reference Implementation

`tests/data-driven-testing-example-cases.spec.ts` demonstrates four approaches:

1. **Recommended:** Independent purchase-group tests containing dependent quantity iteration.
2. **Recommended:** Independent product-search permutation tests.
3. **Not recommended:** Independent search permutations executed within one test.
4. **Not recommended:** Independent search permutations grouped with `test.step()`.

ADR 005 remains responsible for environment-aware test data selection and loading. This ADR establishes the corresponding **test execution and failure-isolation strategy**.

**Decision principle: Independently meaningful business validations should produce independently meaningful test results.**