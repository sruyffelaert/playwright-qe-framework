import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('Remove item from cart', async ({ page, environmentData }) => {
  const firstProduct = environmentData.PRODUCTS['First in-stock product allowing multiple quantities'];
  const secondProduct = environmentData.PRODUCTS['Second in-stock product allowing multiple quantities'];
  const quantity = 1;
  const homePage = new HomePage(page);
  await homePage.open();
  const productsPage = await homePage.navigateToProducts();

  await productsPage.fillSearch(firstProduct.search);
  await productsPage.clickSearch();
  const firstProductTile = productsPage.productTile(firstProduct.name);
  await firstProductTile.clickAddToCart();
  await productsPage.clickContinueShopping();

  await productsPage.fillSearch(secondProduct.search);
  await productsPage.clickSearch();
  const secondProductTile = productsPage.productTile(secondProduct.name);
  await secondProductTile.clickAddToCart();
  await productsPage.clickContinueShopping();

  const cartPage = await productsPage.navigateToCart();
  const firstProductRow = cartPage.productRow(firstProduct.name);
  const secondProductRow = cartPage.productRow(secondProduct.name);

  await cartPage.validateProductCount(2);
  await firstProductRow.validatePrice(`${environmentData.Currency} ${firstProduct.price}`);
  await firstProductRow.validateQuantity(quantity);
  await secondProductRow.validatePrice(`${environmentData.Currency} ${secondProduct.price}`);
  await secondProductRow.validateQuantity(quantity);
  await firstProductRow.validateName(firstProduct.name);

  await firstProductRow.clickRemove();

  await firstProductRow.validateRemoved();
  await cartPage.validateProductCount(1);
  await secondProductRow.validateName(secondProduct.name);
  await secondProductRow.validatePrice(`${environmentData.Currency} ${secondProduct.price}`);
  await secondProductRow.validateQuantity(quantity);
});
