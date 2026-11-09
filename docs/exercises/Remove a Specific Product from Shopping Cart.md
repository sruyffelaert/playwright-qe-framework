# Test: Remove a Specific Product from Shopping Cart

Site: Automation Exercise

Steps:
1. Navigate to the Products page.
2. Add Blue Top to the cart.
3. Select Continue Shopping.
4. Add Men Tshirt to the cart.
5. Navigate to the shopping cart.
6. Remove Blue Top.

Assertions:
- Exactly one product remains in the cart.
- Blue Top is no longer present.
- Men Tshirt is still present.
- Men Tshirt's quantity remains 1.
- Men Tshirt's displayed price remains Rs. 400.

Approach: Write everything inline from scratch for practice. No helper functions or page objects. The test must run independently of other tests.