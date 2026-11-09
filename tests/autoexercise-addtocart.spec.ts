import { test, expect } from '@fixtures/fixtures';

test('Add multiple items to shopping cart', async ( { page } ) => {
    
    await page.goto('https://automationexercise.com');

    const products_LNK = page.getByRole('link', { name: ' Products' });
    const shoppingCart_LNK = page.getByRole('link', { name: ' Cart' });
    const searchBox_TXT = page.getByRole('textbox', { name: 'Search Product' });
    const search_BTN = page.locator('#submit_search');
    const productWrapper_FRM = page.locator('.product-image-wrapper')
    const blueTop_FRM = productWrapper_FRM.filter({ has: page.getByText('Blue Top', { exact: true }) });
    const menTshirt_FRM = productWrapper_FRM.filter({ has: page.getByText('Men Tshirt', { exact: true }) });
    const continueShopping_BTN = page.getByRole('button', { name: 'Continue Shopping' });


    await products_LNK.click();
    await searchBox_TXT.fill('Blue Top');
    await search_BTN.click();

    await blueTop_FRM.locator('.productinfo').locator('.btn').getByText('Add to cart', { exact: true }).click();

    await continueShopping_BTN.click();

    await searchBox_TXT.fill('Men tshirt');
    await search_BTN.click();

    await menTshirt_FRM.locator('.productinfo').locator('.btn').getByText('Add to cart', { exact: true }).click();

    await continueShopping_BTN.click();

    await shoppingCart_LNK.click();

    const cartTable_TBL = page.locator('.table');

    await expect(cartTable_TBL.getByRole('row')).toHaveCount(3);

    const blueTop_ROW = cartTable_TBL.getByRole('row').filter( { has: page.getByRole('link', { name: 'Blue Top', exact: true }) });
    const menTshirt_ROW = cartTable_TBL.getByRole('row').filter( { has: page.getByRole('link', { name: 'Men Tshirt', exact: true }) });


    const blueTop_LNK = blueTop_ROW.getByRole('link', { name: 'Blue Top', exact: true });
    const blueTopPrice_LBL = blueTop_ROW.locator('.cart_total_price');
    const blueTopQty_LBL = blueTop_ROW.locator('.cart_quantity');

    const menTshirt_LNK = menTshirt_ROW.getByRole('link', { name: 'Men Tshirt', exact: true });
    const menTshirtPrice_LBL = menTshirt_ROW.locator('.cart_total_price');
    const menTshirtQty_LBL = menTshirt_ROW.locator('.cart_quantity');

    await expect(blueTop_LNK).toBeVisible();
    await expect(menTshirt_LNK).toBeVisible();
    await expect(blueTopPrice_LBL).toBeVisible();
    await expect(menTshirtPrice_LBL).toBeVisible();

    await expect(blueTopPrice_LBL).toHaveText('Rs. 500');
    await expect(menTshirtPrice_LBL).toHaveText('Rs. 400');

    await expect(blueTopQty_LBL).toHaveText('1');
    await expect(menTshirtQty_LBL).toHaveText('1');

});