import { expect, type Locator, type Page } from '@playwright/test';
import { CartPage } from '../cart/cart-page';

export class ProductDetailsPage {
  private readonly page: Page;
  private readonly path: string;
  private readonly heading: Locator;
  private readonly productName: string;
  private readonly quantityInput: Locator;
  private readonly addToCartButton: Locator;
  private readonly continueShoppingButton: Locator;
  private readonly cartLink: Locator;

  constructor(page: Page, productId: number, productName: string) {
    this.page = page;
    this.path = `/product_details/${productId}`;
    this.productName = productName;
    this.heading = page.locator('.product-information').getByRole('heading', { level: 2 });
    this.quantityInput = page.locator('#quantity');
    this.addToCartButton = page.getByRole('button', { name: ' Add to cart', exact: true });
    this.continueShoppingButton = page.getByRole('button', {
      name: 'Continue Shopping', exact: true,
    });
    this.cartLink = page.getByRole('link', { name: ' Cart', exact: true });
  }

  async open() {
    await this.page.goto(this.path);
    await this.assertLoaded();
    return this;
  }

  /** Verifies the page's distinct title is visible and correct. */
  async assertLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText(this.productName);
  }

  async fillQuantity(value: string) { await this.quantityInput.fill(value); }

  /** Completes when the cart confirmation is ready for interaction. */
  async clickAddToCart() {
    await this.addToCartButton.click();
    await expect(this.continueShoppingButton).toBeVisible();
    await expect(this.continueShoppingButton).toBeEnabled();
  }

  async clickContinueShopping() {
    await this.continueShoppingButton.click();
    await expect(this.continueShoppingButton).toBeHidden();
    await this.assertLoaded();
    return this;
  }

  async clickCart() {
    await this.cartLink.click();
    const destination = new CartPage(this.page);
    await destination.assertLoaded();
    return destination;
  }

  async getQuantity() {
    await expect(this.quantityInput).toBeVisible();
    return this.quantityInput.inputValue();
  }

  async validateQuantity(expected: string) {
    await expect(this.quantityInput).toBeVisible();
    await expect(this.quantityInput).toHaveValue(expected);
  }
}
