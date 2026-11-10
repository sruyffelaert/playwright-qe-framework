import { expect, type Locator, type Page } from '@playwright/test';

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

  async removeProduct(productName: string) {
    await this.productRow(productName).locator('.cart_quantity_delete').click();
    await this.validateProductRemoved(productName);
  }

  async validateProductCount(expected: number) {
    await expect(this.cartContent).toBeVisible();
    await expect(this.productRows).toHaveCount(expected);
  }

  async validateProductVisible(productName: string) {
    const name = this.productRow(productName).getByRole('link', { name: productName, exact: true });
    await expect(name).toBeVisible();
    await expect(name).toHaveText(productName);
  }

  async validateProductRemoved(productName: string) {
    await expect(this.productRow(productName)).toHaveCount(0);
  }

  async validateProductPrice(productName: string, expected: string) {
    const price = this.productPrice(productName);
    await expect(price).toBeVisible();
    await expect(price).toHaveText(expected);
  }

  async validateProductQuantity(productName: string, expected: number) {
    const quantity = this.productQuantity(productName);
    await expect(quantity).toBeVisible();
    await expect(quantity).toHaveText(String(expected));
  }

  async validateProductTotal(productName: string, expected: string) {
    const total = this.productTotal(productName);
    await expect(total).toBeVisible();
    await expect(total).toHaveText(expected);
  }

  async getProductName(productName: string) {
    const name = this.productRow(productName).getByRole('link', { name: productName, exact: true });
    await expect(name).toBeVisible();
    return (await name.innerText()).trim();
  }

  async getProductUnitPrice(productName: string) {
    const price = this.productPrice(productName);
    await expect(price).toBeVisible();
    return (await price.innerText()).trim();
  }

  async getProductQuantity(productName: string) {
    const quantity = this.productQuantity(productName);
    await expect(quantity).toBeVisible();
    return (await quantity.innerText()).trim();
  }

  async getProductTotal(productName: string) {
    const total = this.productTotal(productName);
    await expect(total).toBeVisible();
    return (await total.innerText()).trim();
  }

  private productRow(productName: string) {
    return this.productRows.filter({
      has: this.page.getByRole('link', { name: productName, exact: true }),
    });
  }

  private productPrice(productName: string) {
    return this.productRow(productName).locator('.cart_price');
  }

  private productQuantity(productName: string) {
    return this.productRow(productName).locator('.cart_quantity');
  }

  private productTotal(productName: string) {
    return this.productRow(productName).locator('.cart_total');
  }
}
