import { expect, type Locator, type Page } from '@playwright/test';
import { CartPage } from '../cart/cart-page';
import { ProductTile } from './products-product-tile';

export class ProductsPage {
  private readonly page: Page;
  private readonly path: string;
  private readonly heading: Locator;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly productTiles: Locator;
  private readonly cartLink: Locator;
  private readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.path = '/products';
    this.heading = page.locator('.features_items > h2');
    this.searchInput = page.getByRole('textbox', { name: 'Search Product', exact: true });
    this.searchButton = page.locator('#submit_search');
    this.productTiles = page.locator('.product-image-wrapper');
    this.cartLink = page.getByRole('link', { name: ' Cart', exact: true });
    this.continueShoppingButton = page.getByRole('button', {
      name: 'Continue Shopping', exact: true,
    });
  }

  /** Verifies the page's distinct title is visible and correct. */
  async assertLoaded() {
    const expectedTitle = new URL(this.page.url()).searchParams.has('search')
      ? 'Searched Products' : 'All Products';
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText(expectedTitle);
  }

  async fillSearch(value: string) {
    await this.searchInput.fill(value);
  }

  /** Search navigation completes with its query and the correct visible title. */
  async clickSearch() {
    const query = await this.searchInput.inputValue();
    await Promise.all([
      this.page.waitForURL(url =>
        url.pathname === this.path
        && url.searchParams.get('search') === query,
      ),
      this.searchButton.click(),
    ]);
    await this.assertLoaded();
    return this;
  }

  async clickContinueShopping() {
    await expect(this.continueShoppingButton).toBeVisible();
    await expect(this.continueShoppingButton).toBeEnabled();
    await this.continueShoppingButton.click();
    await expect(this.continueShoppingButton).toBeHidden();
    await this.assertLoaded();
    return this;
  }

  async navigateToCart() {
    await this.cartLink.click();
    const destination = new CartPage(this.page);
    await destination.assertLoaded();
    return destination;
  }

  async getSearch() {
    await expect(this.searchInput).toBeVisible();
    return this.searchInput.inputValue();
  }

  async validateSearch(expected: string) {
    await expect(this.searchInput).toBeVisible();
    await expect(this.searchInput).toHaveValue(expected);
  }

  productTile(productName: string) {
    const tile = this.productTiles.filter({
      has: this.page.locator('.productinfo').getByText(productName, { exact: true }),
    });
    return new ProductTile(tile, productName);
  }
}
