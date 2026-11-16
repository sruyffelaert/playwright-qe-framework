import { test, getEnvironmentData } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

/**
 * RECOMMENDED — Independent tests with nested scenario iteration.
 *
 * The outer loop generates a separate Playwright test for each named
 * purchase group. Each group receives independent test setup, teardown,
 * execution, and reporting.
 *
 * The inner loop iterates through an array of quantities, adding each
 * quantity to the same shopping cart. These operations are intentionally
 * dependent because their combined result is the subject of the test.
 *
 * A failure stops the remaining operations within that purchase group,
 * but does not ordinarily prevent other groups from executing.
 *
 * Key distinction: the outer loop creates independent test cases;
 * the inner loop performs related operations within one test case.
 */
for (const groupName in getEnvironmentData().PURCHASE_QUANTITIES) {
  test(`${groupName}: add quantities to cart`, async ({ page, environmentData }) => {
    const product = environmentData.PRODUCTS['First in-stock product allowing multiple quantities'];
    let totalQuantity = 0;
    const homePage = new HomePage(page);
    await homePage.open();
    let productsPage = await homePage.navigateToProducts();

    for (const quantity of environmentData.PURCHASE_QUANTITIES[groupName]) {
      await productsPage.fillSearch(product.search);
      await productsPage.clickSearch();
      const productTile = productsPage.productTile(product.name);
      const productDetailsPage = await productTile.navigateToViewProduct();

      await productDetailsPage.fillQuantity(String(quantity));
      await productDetailsPage.clickAddToCart();
      await productDetailsPage.clickContinueShopping();
      totalQuantity += quantity;
      productsPage = await productDetailsPage.navigateToProducts();
    }

    const cartPage = await productsPage.navigateToCart();
    const productRow = cartPage.productRow(product.name);

    await cartPage.validateProductCount(1);
    await productRow.validateQuantity(totalQuantity);
    await productRow.validateTotal(`${environmentData.Currency} ${product.price * totalQuantity}`);
  });
}

/**
 * RECOMMENDED — Independent data-driven test cases.
 *
 * The outer loop generates one Playwright test for each search variation
 * defined in environment data.
 *
 * Every variation has its own test identity, setup, teardown, result,
 * and diagnostic artifacts. The descriptive data key identifies the
 * variation directly in the test report.
 *
 * If one variation fails, the other variations can still execute.
 * Failures are attributed to specific inputs rather than to a shared
 * test containing multiple permutations.
 *
 * This is the preferred approach when permutations represent independent
 * validations of the same application behavior.
 *
 * Adding another variation to the dataset automatically registers
 * another independent test without modifying the test implementation.
 */
for (const description in getEnvironmentData().PRODUCT_SEARCH_VARIATIONS) {
  test(`${description}: search returns the expected product`, async ({ page, environmentData }) => {
    const variation = environmentData.PRODUCT_SEARCH_VARIATIONS[description];
    const homePage = new HomePage(page);
    await homePage.open();
    const productsPage = await homePage.navigateToProducts();

    await productsPage.fillSearch(variation.search);
    await productsPage.clickSearch();
    const productTile = productsPage.productTile(variation.expectedProduct);

    await productTile.validateName(variation.expectedProduct);
  });
}

/**
 * NOT RECOMMENDED — Multiple independent permutations within one test.
 *
 * This example loops through all search variations inside a single
 * Playwright test rather than generating separate test cases.
 *
 * Disadvantages:
 * - The first failed assertion stops execution of subsequent variations.
 * - One failing variation blocks validation of the remaining data.
 * - Playwright reports one failed test, not which individual permutations
 *   passed or failed as separate test results.
 * - Identifying the failing permutation requires inspecting the failure
 *   details, execution trace, or other diagnostic information.
 * - A retry repeats the entire test rather than one failed permutation.
 *
 * This creates unnecessary dependencies between otherwise independent
 * validations, reducing failure isolation and diagnostic clarity.
 *
 * Retained solely to demonstrate why internal iteration is generally
 * inappropriate for independent data-driven test cases.
 */
test('Product search variations: loop inside the test', async ({ page, environmentData }) => {
  for (const description in environmentData.PRODUCT_SEARCH_VARIATIONS) {
    const variation = environmentData.PRODUCT_SEARCH_VARIATIONS[description];
    const homePage = new HomePage(page);
    await homePage.open();
    const productsPage = await homePage.navigateToProducts();

    await productsPage.fillSearch(variation.search);
    await productsPage.clickSearch();
    const productTile = productsPage.productTile(variation.expectedProduct);

    await productTile.validateName(variation.expectedProduct);
  }
});

/**
 * NOT RECOMMENDED — Multiple independent permutations with test.step().
 *
 * This example improves the previous approach by wrapping each iteration
 * in a named Playwright reporting step.
 *
 * Advantages:
 * - Each variation appears under its descriptive name in the test report.
 * - The failing step is easier to identify without examining every action.
 *
 * However, test.step() provides reporting structure, NOT test isolation.
 *
 * Disadvantages:
 * - A failed step still stops subsequent iterations.
 * - All variations still share one test execution and result.
 * - The report records one failed test instead of independently reporting
 *   the status of every permutation.
 * - A retry repeats the entire test, including successful variations.
 * - Test setup and execution state remain shared across permutations.
 *
 * Named steps improve diagnostics but do not solve failure blocking,
 * independent execution, or result attribution at the test-case level.
 *
 * Use test.step() to organize related operations within a single business
 * scenario, not as a substitute for independent parameterized tests.
 */
test('Product search variations: loop with report steps', async ({ page, environmentData }) => {
  for (const description in environmentData.PRODUCT_SEARCH_VARIATIONS) {
    await test.step(description, async () => {
      const variation = environmentData.PRODUCT_SEARCH_VARIATIONS[description];
      const homePage = new HomePage(page);
      await homePage.open();
      const productsPage = await homePage.navigateToProducts();

      await productsPage.fillSearch(variation.search);
      await productsPage.clickSearch();
      const productTile = productsPage.productTile(variation.expectedProduct);

      await productTile.validateName(variation.expectedProduct);
    });
  }
});
