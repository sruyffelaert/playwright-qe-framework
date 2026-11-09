# Test 5: User Login and Logout

Site: Automation Exercise

Suite: User Interactions

Prerequisite:
- A registered test account with known credentials.
- Credentials must not be hardcoded or committed to Git.

Steps:
1. Navigate to the homepage.
2. Open the Signup / Login page.
3. Enter valid credentials.
4. Submit the login form.
5. Verify successful authentication.
6. Log out.
7. Verify the user is no longer authenticated.

Assertions:
- Login form is displayed.
- Authenticated user's name is displayed after login.
- Logout option becomes available.
- After logout, the login page is displayed.
- The authenticated user indicator is no longer present.

Approach:
Write everything inline from scratch. No helper functions or page objects. The test must run independently of other tests.

Skills:
Authentication, credential management, session state, navigation, and positive/negative assertions.

Stretch Goal:
Verify that navigating back after logout does not restore the authenticated session.
