import { expect, type Locator, type Page } from '@playwright/test';

export class CartPage {
  private readonly page: Page;
  private readonly path: string;
  private readonly heading: Locator;
  private readonly cartContent: Locator;
  private readonly rows: Locator;
  private readonly productRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.path = '/view_cart';
    this.heading = page.locator('.breadcrumb .active');
    this.cartContent = page.locator('#cart_items');
    this.rows = page.getByRole('row');
    this.productRows = this.rows.filter({ has: page.locator('.cart_quantity') });
  }

  async open() {
    await this.page.goto(this.path);
    await this.assertLoaded();
    return this;
  }

  /** Verifies the page's distinct title is visible and correct. */
  async assertLoaded() {
    await expect(this.heading, 'Cart heading is visible').toBeVisible();
    await expect(this.heading, 'Cart heading matches exactly').toHaveText('Shopping Cart');
  }

  async removeProduct(productName: string) {
    await this.validateProductVisible(productName);
    const row = this.productRow(productName);
    await row.getByRole('cell').and(row.locator('.cart_delete'))
      .locator('.cart_quantity_delete').click();
    await this.validateProductRemoved(productName);
  }

  async validateProductCount(expected: number) {
    await expect(this.cartContent, 'Cart content is visible').toBeVisible();
    await expect(this.productRows, 'Complete cart product count matches').toHaveCount(expected);
  }

  async validateProductVisible(productName: string) {
    const row = this.productRow(productName);
    const name = row.getByRole('link', { name: productName, exact: true });
    await expect(row, 'Exactly one matching cart product is visible').toBeVisible();
    await expect(name, 'Cart product name is visible').toBeVisible();
    await expect(name, 'Complete cart product name matches').toHaveText(productName);
  }

  async validateProductRemoved(productName: string) {
    await expect(this.productRow(productName), 'Matching product is absent, not merely hidden')
      .toHaveCount(0);
  }

  async validateProductPrice(productName: string, expected: string) {
    await this.validateProductVisible(productName);
    const price = this.productPrice(productName);
    await expect(price, 'Cart unit price is visible').toBeVisible();
    await expect(price, 'Complete cart unit price matches').toHaveText(expected);
  }

  async validateProductQuantity(productName: string, expected: number) {
    await this.validateProductVisible(productName);
    const quantity = this.productQuantity(productName);
    await expect(quantity, 'Cart quantity is visible').toBeVisible();
    await expect(quantity, 'Complete cart quantity matches').toHaveText(String(expected));
  }

  async validateProductTotal(productName: string, expected: string) {
    await this.validateProductVisible(productName);
    const total = this.productTotal(productName);
    await expect(total, 'Cart line total is visible').toBeVisible();
    await expect(total, 'Complete cart line total matches').toHaveText(expected);
  }

  async getProductName(productName: string) {
    await this.validateProductVisible(productName);
    return (await this.productRow(productName)
      .getByRole('link', { name: productName, exact: true }).innerText()).trim();
  }

  async getProductUnitPrice(productName: string) {
    await this.validateProductVisible(productName);
    const price = this.productPrice(productName);
    await expect(price).toBeVisible();
    return (await price.innerText()).trim();
  }

  async getProductQuantity(productName: string) {
    await this.validateProductVisible(productName);
    const quantity = this.productQuantity(productName);
    await expect(quantity).toBeVisible();
    return (await quantity.innerText()).trim();
  }

  async getProductTotal(productName: string) {
    await this.validateProductVisible(productName);
    const total = this.productTotal(productName);
    await expect(total).toBeVisible();
    return (await total.innerText()).trim();
  }

  private productRow(productName: string) {
    return this.rows.filter({ hasText: productName });
  }

  private productPrice(productName: string) {
    const row = this.productRow(productName);
    return row.getByRole('cell').and(row.locator('.cart_price'));
  }

  private productQuantity(productName: string) {
    const row = this.productRow(productName);
    return row.getByRole('cell').and(row.locator('.cart_quantity'));
  }

  private productTotal(productName: string) {
    const row = this.productRow(productName);
    return row.getByRole('cell').and(row.locator('.cart_total'));
  }
}
