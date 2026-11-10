import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('Remove item from cart', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.open();
  const productsPage = await homePage.navigateToProducts();

  await productsPage.fillSearch('Blue Top');
  await productsPage.clickSearch();
  const blueTopTile = productsPage.productTile('Blue Top');
  await blueTopTile.clickAddToCart();
  await productsPage.clickContinueShopping();

  await productsPage.fillSearch('Men Tshirt');
  await productsPage.clickSearch();
  const menTshirtTile = productsPage.productTile('Men Tshirt');
  await menTshirtTile.clickAddToCart();
  await productsPage.clickContinueShopping();

  const cartPage = await productsPage.navigateToCart();
  const blueTopRow = cartPage.productRow('Blue Top');
  const menTshirtRow = cartPage.productRow('Men Tshirt');

  await cartPage.validateProductCount(2);
  await blueTopRow.validatePrice('Rs. 500');
  await blueTopRow.validateQuantity(1);
  await menTshirtRow.validatePrice('Rs. 400');
  await menTshirtRow.validateQuantity(1);
  await blueTopRow.validateName('Blue Top');

  await blueTopRow.clickRemove();

  await blueTopRow.validateRemoved();
  await cartPage.validateProductCount(1);
  await menTshirtRow.validateName('Men Tshirt');
  await menTshirtRow.validatePrice('Rs. 400');
  await menTshirtRow.validateQuantity(1);
});
