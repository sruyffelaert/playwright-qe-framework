import { expect, type Locator, type Page } from '@playwright/test';
import { CartProductRow } from './cart-product-row';

export class CartPage {
  private readonly page: Page;
  private readonly heading: Locator;
  private readonly cartContent: Locator;
  private readonly productRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('.breadcrumb .active');
    this.cartContent = page.locator('#cart_items');
    this.productRows = this.cartContent.getByRole('row')
      .filter({ has: page.locator('.cart_quantity') });
  }

  /** Verifies the page's distinct title is visible and correct. */
  async assertLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText('Shopping Cart');
  }

  async validateProductCount(expected: number) {
    await expect(this.cartContent).toBeVisible();
    await expect(this.productRows).toHaveCount(expected);
  }

  productRow(productName: string) {
    const row = this.productRows.filter({
      has: this.page.getByRole('link', { name: productName, exact: true }),
    });
    return new CartProductRow(row, productName);
  }
}
