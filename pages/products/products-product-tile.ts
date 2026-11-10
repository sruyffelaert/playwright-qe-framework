import { expect, type Locator } from '@playwright/test';
import { ProductDetailsPage } from '../product-details/product-details-page';

export class ProductTile {
  private readonly tile: Locator;
  private readonly productName: string;
  private readonly image: Locator;
  private readonly name: Locator;
  private readonly price: Locator;
  private readonly addToCartButton: Locator;
  private readonly viewProductLink: Locator;

  constructor(tile: Locator, productName: string) {
    this.tile = tile;
    this.productName = productName;
    const productInfo = tile.locator('.single-products').locator('.productinfo');
    this.image = productInfo.locator('img');
    this.name = productInfo.locator('p');
    this.price = productInfo.getByRole('heading', { level: 2 });
    this.addToCartButton = productInfo.locator('.btn');
    this.viewProductLink = tile.locator('.choose').getByRole('link');
  }

  async assertLoaded() {
    await expect(this.name).toBeVisible();
    await expect(this.name).toHaveText(this.productName);
  }

  async clickAddToCart() {
    await expect(this.tile).toBeVisible();
    await this.addToCartButton.click();
  }

  async navigateToViewProduct() {
    await expect(this.tile).toBeVisible();
    const page = this.tile.page();
    const href = await this.viewProductLink.getAttribute('href');
    const productPath = href && new URL(href, page.url()).pathname;
    const match = productPath && /^\/product_details\/(\d+)$/.exec(productPath);
    if (!match) {
      throw new Error('View Product must link to a product-details route.');
    }
    const destination = new ProductDetailsPage(page, this.productName);
    await this.viewProductLink.click();
    await destination.assertLoaded();
    return destination;
  }

  async getName() {
    await expect(this.name).toBeVisible();
    return (await this.name.innerText()).trim();
  }

  async getPrice() {
    await expect(this.price).toBeVisible();
    return (await this.price.innerText()).trim();
  }

  async validateImageVisible() {
    await expect(this.image).toBeVisible();
  }

  async validateName(expected: string) {
    await expect(this.name).toBeVisible();
    await expect(this.name).toHaveText(expected);
  }

  async validatePrice(expected: string) {
    await expect(this.price).toBeVisible();
    await expect(this.price).toHaveText(expected);
  }
}
