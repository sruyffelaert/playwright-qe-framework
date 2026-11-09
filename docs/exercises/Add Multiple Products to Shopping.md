Test: Add Multiple Products to Shopping Cart
Site: Automation Exercise

Steps:
1. Navigate to the Products page.
2. Add Blue Top to the cart.
3. Select Continue Shopping.
4. Add Men Tshirt to the cart.
5. Navigate to the shopping cart.
Assertions:
- Exactly two products appear.
- Both product names are correct.
- Both unit prices are correct.
- Each product has a quantity of 1.
- Each line total equals unit price × quantity.
Approach: Write everything inline to practice Playwright's test scaffolding, locators, and assertions. No helper functions or page objects.