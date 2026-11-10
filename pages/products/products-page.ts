import { expect, type Locator, type Page } from '@playwright/test';
import { waitForAutomationExerciseReady } from '../../support/automation-exercise-readiness';

export class ProductsPage {
  private readonly page: Page;
  private readonly url: string;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly productCards: Locator;
  private readonly cartLink: Locator;
  private readonly continueShoppingButton: Locator;

  constructor(page: Page, baseUrl = 'https://automationexercise.com') {
    this.page = page;
    this.url = new URL('/products', baseUrl).href;
    this.searchInput = page.getByRole('textbox', { name: 'Search Product', exact: true });
    this.searchButton = page.locator('#submit_search');
    this.productCards = page.locator('.product-image-wrapper');
    this.cartLink = page.getByRole('link', { name: ' Cart', exact: true });
    this.continueShoppingButton = page.getByRole('button', {
      name: 'Continue Shopping', exact: true,
    });
  }

  async open() {
    await this.page.goto(this.url);
    await this.assertLoaded();
  }

  /** Products route, including search variants, and initialized search controls. */
  async assertLoaded() {
    const expectedUrl = new URL(this.url);
    await expect(this.page, 'Products route matches').toHaveURL(url =>
      url.origin === expectedUrl.origin && url.pathname === expectedUrl.pathname,
    );
    await waitForAutomationExerciseReady(this.page);
    await expect(this.searchInput, 'Product search is visible').toBeVisible();
    await expect(this.searchInput, 'Product search is editable').toBeEditable();
    await expect(this.searchButton, 'Product search button is visible').toBeVisible();
    await expect(this.searchButton, 'Product search button is enabled').toBeEnabled();
  }

  async fillSearch(value: string) { await this.searchInput.fill(value); }

  /** Search navigation completes with its query and initialized result controls. */
  async clickSearch() {
    const query = await this.searchInput.inputValue();
    const expectedUrl = new URL(this.url);
    await Promise.all([
      this.page.waitForURL(url =>
        url.origin === expectedUrl.origin && url.pathname === expectedUrl.pathname
        && url.searchParams.get('search') === query,
      ),
      this.searchButton.click(),
    ]);
    await this.assertLoaded();
  }

  /** Completes when the add confirmation is ready; caller chooses how to dismiss it. */
  async clickAddToCart(productName: string) {
    const product = this.productCard(productName);
    await expect(product, 'Exactly one matching product card is visible').toBeVisible();
    await product.locator('.single-products').locator('.productinfo').locator('.btn').click();
    await expect(this.continueShoppingButton, 'Cart confirmation is visible').toBeVisible();
    await expect(this.continueShoppingButton, 'Continue Shopping is enabled').toBeEnabled();
  }

  async clickContinueShopping() {
    await this.continueShoppingButton.click();
    await expect(this.continueShoppingButton, 'Cart confirmation is dismissed').toBeHidden();
  }

  async clickViewProduct(productName: string) {
    const product = this.productCard(productName);
    await expect(product, 'Exactly one matching product card is visible').toBeVisible();
    await product.locator('.choose').click();
  }

  async clickCart() { await this.cartLink.click(); }

  async getSearch() {
    await expect(this.searchInput).toBeVisible();
    return this.searchInput.inputValue();
  }

  async validateSearch(expected: string) {
    await expect(this.searchInput, 'Product search is visible').toBeVisible();
    await expect(this.searchInput, 'Product search matches exactly').toHaveValue(expected);
  }

  private productCard(productName: string) {
    // Same-commit quantity/removal specs use hasText. Strict actions/assertions
    // reject ambiguous names instead of silently selecting the first match.
    return this.productCards.filter({ hasText: productName });
  }
}
