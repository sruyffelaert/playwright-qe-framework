import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('Add multiple quantities to cart', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.open();
  const productsPage = await homePage.navigateToProducts();

  await productsPage.fillSearch('Blue Top');
  await productsPage.clickSearch();
  const blueTopTile = productsPage.productTile('Blue Top');
  const productDetailsPage = await blueTopTile.navigateToViewProduct();

  await productDetailsPage.fillQuantity('4');
  await productDetailsPage.clickAddToCart();
  await productDetailsPage.clickContinueShopping();
  const cartPage = await productDetailsPage.navigateToCart();
  const blueTopRow = cartPage.productRow('Blue Top');

  await cartPage.validateProductCount(1);
  await blueTopRow.validateQuantity(4);
  await blueTopRow.validateTotal('Rs. 2000');
});
