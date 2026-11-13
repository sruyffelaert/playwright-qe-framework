import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('Add multiple quantities to cart', async ({ page, environmentData }) => {
  const product = environmentData.PRODUCTS['First in-stock product allowing multiple quantities'];
  const quantity = 4;
  const homePage = new HomePage(page);
  await homePage.open();
  const productsPage = await homePage.navigateToProducts();

  await productsPage.fillSearch(product.search);
  await productsPage.clickSearch();
  const productTile = productsPage.productTile(product.name);
  const productDetailsPage = await productTile.navigateToViewProduct();

  await productDetailsPage.fillQuantity(String(quantity));
  await productDetailsPage.clickAddToCart();
  await productDetailsPage.clickContinueShopping();
  const cartPage = await productDetailsPage.navigateToCart();
  const productRow = cartPage.productRow(product.name);

  await cartPage.validateProductCount(1);
  await productRow.validateQuantity(quantity);
  await productRow.validateTotal(`${environmentData.Currency} ${product.price * quantity}`);
});
