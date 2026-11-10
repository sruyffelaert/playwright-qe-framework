import { expect, type Locator, type Page } from '@playwright/test';
import { waitForAutomationExerciseReady } from '../../support/automation-exercise-readiness';

export class ProductDetailsPage {
  private readonly page: Page;
  private readonly url: string;
  private readonly productInformation: Locator;
  private readonly quantityInput: Locator;
  private readonly addToCartButton: Locator;
  private readonly continueShoppingButton: Locator;
  private readonly cartLink: Locator;

  constructor(page: Page, productId: number, baseUrl = 'https://automationexercise.com') {
    this.page = page;
    this.url = new URL(`/product_details/${productId}`, baseUrl).href;
    this.productInformation = page.locator('.product-information');
    this.quantityInput = page.locator('#quantity');
    this.addToCartButton = page.getByRole('button', { name: ' Add to cart', exact: true });
    this.continueShoppingButton = page.getByRole('button', {
      name: 'Continue Shopping', exact: true,
    });
    this.cartLink = page.getByRole('link', { name: ' Cart', exact: true });
  }

  async open() {
    await this.page.goto(this.url);
    await this.assertLoaded();
  }

  /** Exact product route, initialized handlers, and editable quantity control. */
  async assertLoaded() {
    await expect(this.page, 'Product details URL matches').toHaveURL(this.url);
    await waitForAutomationExerciseReady(this.page);
    await expect(this.productInformation, 'Product information is visible').toBeVisible();
    await expect(this.quantityInput, 'Product quantity is visible').toBeVisible();
    await expect(this.quantityInput, 'Product quantity is editable').toBeEditable();
    await expect(this.addToCartButton, 'Add to cart is visible').toBeVisible();
    await expect(this.addToCartButton, 'Add to cart is enabled').toBeEnabled();
  }

  async fillQuantity(value: string) { await this.quantityInput.fill(value); }

  /** Completes when the cart confirmation is ready for interaction. */
  async clickAddToCart() {
    await this.addToCartButton.click();
    await expect(this.continueShoppingButton, 'Cart confirmation is visible').toBeVisible();
    await expect(this.continueShoppingButton, 'Continue Shopping is enabled').toBeEnabled();
  }

  async clickContinueShopping() {
    await this.continueShoppingButton.click();
    await expect(this.continueShoppingButton, 'Cart confirmation is dismissed').toBeHidden();
  }

  async clickCart() { await this.cartLink.click(); }

  async getQuantity() {
    await expect(this.quantityInput).toBeVisible();
    return this.quantityInput.inputValue();
  }

  async validateQuantity(expected: string) {
    await expect(this.quantityInput, 'Product quantity is visible').toBeVisible();
    await expect(this.quantityInput, 'Product quantity matches exactly').toHaveValue(expected);
  }
}
