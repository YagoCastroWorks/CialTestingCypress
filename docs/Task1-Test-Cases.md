# Task 1 – Amazon.com: Test Cases

## 1.2 – The 5 most important test titles

Chosen by business risk: they cover the path that turns a visitor into a paid order
(find → choose → cart → checkout) plus the post-purchase support that keeps customers.

| #  | Title | Area | Priority |
|----|-------|------|----------|
| TC-01 | Guest user can find a product by keyword and add it to the cart from the product page | Search / Cart | **Critical** |
| TC-02 | Cart subtotal, item count and quantity update correctly when items are added, changed or removed | Cart | Critical |
| TC-03 | Registered user can sign in with valid credentials and is rejected with a clear message for invalid ones | Account | Critical |
| TC-04 | Signed-in user can complete checkout (address, shipping speed, payment) and receives an order confirmation | Checkout | Critical |
| TC-05 | Free shipping eligibility and delivery estimate are shown correctly for the selected delivery country | Shipping | High |

---

## 1.3 – Full test case: TC-01

| Field | Value |
|-------|-------|
| **ID** | TC-01 |
| **Title** | Guest user can find a product by keyword and add it to the cart from the product page |
| **Module** | Search / Product page / Cart |
| **Priority / Severity** | Critical / Blocker |
| **Type** | Functional, E2E, regression (smoke) |
| **Author** | QA Automation candidate |
| **Environment** | https://www.amazon.com — Chrome (latest), desktop 1440×900 |

### Preconditions
1. The user is **not** signed in (guest session, cookies cleared).
2. The cart is empty (header cart counter shows `0`).
3. The delivery location is set to **Hong Kong** (“Deliver to” in the header).
4. The test product is in stock for the selected location.

### Test data
| Data | Value |
|------|-------|
| Search keyword | `Bostitch Electric Pencil Sharpener EPS4-KTGRAY` |
| Expected product | Bostitch Electric Pencil Sharpener, Gray — model **EPS4-KTGRAY** (ASIN `B088T419ZW`) |
| Quantity | 1 |

### Steps and expected results
| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open https://www.amazon.com | Home page loads; logo, search box, “Deliver to Hong Kong” and cart counter `0` are displayed. |
| 2 | Type the search keyword in the search box and press **Enter** (or click the magnifier). | Results page opens; URL contains the keyword; the expected product is listed with title, image, rating and price. |
| 3 | Click the expected product’s title. | Product page opens for ASIN `B088T419ZW`; title, main image, price, availability (“In Stock”) and **Add to cart** are displayed; the model number EPS4-KTGRAY is shown in the product details. |
| 4 | Note the price shown on the product page. | The price is a valid amount (e.g. `$17.81`). |
| 5 | Click **Add to cart**. | “**Added to cart**” confirmation is displayed with the product image and color (Gray). |
| 6 | Check the header cart counter and the side cart. | Counter shows `1`; the side cart lists the product with quantity `1` and a subtotal equal to the price from step 4. |
| 7 | Click **Go to Cart**. | Cart page lists exactly one line: the expected product, quantity `1`; “Subtotal (1 item)” equals the price from step 4. |

### Postconditions / cleanup
- Delete the product from the cart → cart shows “Your Amazon Cart is empty” and counter `0`.

### Pass / fail criteria
- **Pass:** every expected result above is met.
- **Fail:** any expected result is not met — e.g. wrong product added, counter not updated,
  subtotal different from the product price, or no confirmation displayed.

### Notes / risks
- Prices, title wording and shipping rules change on the live site. Assertions compare values
  read at run time (price on the product page vs. cart subtotal) instead of hard-coded prices,
  and the product is identified by its ASIN, which is stable.
- Amazon may show a bot-protection CAPTCHA to automated browsers. That is an environment
  blocker, not a product defect, and must be reported as such.
