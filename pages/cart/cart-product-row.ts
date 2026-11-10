import { expect, type Locator } from '@playwright/test';

export class CartProductRow {
  private readonly row: Locator;
  private readonly productName: string;
  private readonly item: Locator;
  private readonly description: Locator;
  private readonly name: Locator;
  private readonly price: Locator;
  private readonly quantity: Locator;
  private readonly total: Locator;
  private readonly removeButton: Locator;

  constructor(row: Locator, productName: string) {
    this.row = row;
    this.productName = productName;
    this.item = row.locator('.cart_product');
    this.description = row.locator('.cart_description');
    this.name = this.description.getByRole('link', { name: productName, exact: true });
    this.price = row.locator('.cart_price');
    this.quantity = row.locator('.cart_quantity');
    this.total = row.locator('.cart_total');
    this.removeButton = row.locator('.cart_quantity_delete');
  }

  async assertLoaded() {
    await expect(this.name).toBeVisible();
    await expect(this.name).toHaveText(this.productName);
  }

  async clickRemove() {
    await this.removeButton.click();
    await this.validateRemoved();
  }

  async getName() {
    await expect(this.name).toBeVisible();
    return (await this.name.innerText()).trim();
  }

  async getDescription() {
    await expect(this.description).toBeVisible();
    return (await this.description.innerText()).trim();
  }

  async getPrice() {
    await expect(this.price).toBeVisible();
    return (await this.price.innerText()).trim();
  }

  async getQuantity() {
    await expect(this.quantity).toBeVisible();
    return (await this.quantity.innerText()).trim();
  }

  async getTotal() {
    await expect(this.total).toBeVisible();
    return (await this.total.innerText()).trim();
  }

  async validateItemVisible() {
    await expect(this.item).toBeVisible();
  }

  async validateName(expected: string) {
    await expect(this.name).toBeVisible();
    await expect(this.name).toHaveText(expected);
  }

  async validateDescription(expected: string) {
    await expect(this.description).toBeVisible();
    await expect(this.description).toHaveText(expected);
  }

  async validatePrice(expected: string) {
    await expect(this.price).toBeVisible();
    await expect(this.price).toHaveText(expected);
  }

  async validateQuantity(expected: number) {
    await expect(this.quantity).toBeVisible();
    await expect(this.quantity).toHaveText(String(expected));
  }

  async validateTotal(expected: string) {
    await expect(this.total).toBeVisible();
    await expect(this.total).toHaveText(expected);
  }

  async validateRemoved() {
    await expect(this.row).toHaveCount(0);
  }
}
