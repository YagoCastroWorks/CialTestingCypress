# Amazon.com – Cypress E2E Tests (QA Automation Assignment)

End-to-end tests for https://www.amazon.com written with [Cypress](https://www.cypress.io/),
using the Page Object pattern, fixtures for test data and custom commands.

| Task | Deliverable |
|------|-------------|
| Task 1 – test design | [docs/Task1-Test-Cases.md](docs/Task1-Test-Cases.md) (5 test titles + 1 full test case) |
| Task 2 – first automated test | [cypress/e2e/task2-customer-service.cy.js](cypress/e2e/task2-customer-service.cy.js) |
| Task 3 – cart test suite | [cypress/e2e/task3-cart-free-shipping.cy.js](cypress/e2e/task3-cart-free-shipping.cy.js) |

## Requirements

- [Node.js](https://nodejs.org/) 18 or later (tested with Node 22)
- Google Chrome (tested with Chrome 157)
- Internet access to amazon.com

## Setup

```bash
git clone <repository-url>
cd <repository-folder>
npm install          # installs Cypress (and downloads its binary)
```

## Running the tests

| Command | What it does |
|---------|--------------|
| `npm run cy:open` | Opens the Cypress UI (interactive) |
| `npm test` | Runs all specs headless in Chrome |
| `npm run test:headed` | Runs all specs in a visible Chrome window |
| `npm run test:task2` | Runs only Task 2 |
| `npm run test:task3` | Runs only Task 3 |

Screenshots of failures are saved to `cypress/screenshots/`.

> **Running from a VS Code terminal?** VS Code sets `ELECTRON_RUN_AS_NODE=1`, which makes Cypress fail with
> `bad option: --smoke-test`. Run from a regular terminal, or unset it first:
> `env -u ELECTRON_RUN_AS_NODE npm test` (bash) / `Remove-Item Env:ELECTRON_RUN_AS_NODE` (PowerShell).

## Project structure

```
cypress/
├── e2e/
│   ├── task2-customer-service.cy.js     # Task 2
│   └── task3-cart-free-shipping.cy.js   # Task 3
├── fixtures/                            # Test data
│   ├── customerService.json             # menu items, help search term, expected article
│   ├── products.json                    # pencil sharpener & scissors
│   └── shipping.json                    # delivery country (Hong Kong)
└── support/
    ├── commands.js                      # cy.visitAmazon, cy.openHomeDeliveringTo
    ├── e2e.js
    └── pages/                           # Page Objects
        ├── Header.js                    # search, main menu, delivery country, cart counter
        ├── CustomerServicePage.js
        ├── HelpArticlePage.js
        ├── SearchResultsPage.js
        ├── ProductPage.js
        ├── AddedToCartPage.js           # "Added to cart" confirmation + side cart
        └── CartPage.js                  # quantities, subtotal, free shipping, empty cart
docs/
└── Task1-Test-Cases.md
```

## What the tests cover

### Task 2 – Customer Service
1. Opens amazon.com delivering to Hong Kong.
2. Validates the main menu: *Today's Deals, Customer Service, Registry, Gift Cards, Sell*.
3. Opens **Customer Service** from the menu, searches for *"where is my stuff"*.
4. Opens the first result and validates the **"Where's My Stuff?"** article (title, *Shipping and Delivery*
   breadcrumb, *Find more solutions* search box).

### Task 3 – Cart & free shipping
`beforeEach` runs steps 1–9 so every test starts from the same state: two items in the cart.
`afterEach` empties the cart, so tests don't depend on each other and could run in parallel.

| Test | Checks |
|------|--------|
| should qualify for free shipping only after ordering 3 more pencil sharpeners | Steps 10–12: not eligible at first → +3 sharpeners → eligible; previous products still in the cart |
| should keep the selected scissors color in the cart | The cart lines keep the chosen variants (Red, Black, Blue / Gray) |
| should update the subtotal and item count when the quantity changes | Counter and subtotal increase after changing a quantity |

## Design decisions

- **Page Objects + fixtures:** selectors live in one place per page; test data lives in `cypress/fixtures`,
  so a UI or data change means editing one file, not every test.
- **No fixed waits (`cy.wait(ms)`):** every step waits on an observable state (confirmation message,
  counter value, server-confirmed `data-quantity`, etc.).
- **Avoiding false positives:**
  - the product image is checked as *actually loaded* (`naturalWidth > 0`), not just present in the DOM;
  - free shipping is checked with the page message **and** the numbers (subtotal vs. threshold read from the page);
  - quantities are asserted after the server confirms them, not right after the click;
  - emptying the cart ends with a reload and an "empty cart" assertion;
  - the specs were deliberately broken (wrong expected value) to confirm they fail.
- **Delivery country set before each test:** the main menu, prices and free-shipping rules depend on it.
  After changing it, the home page is loaded again so the whole page reflects the new country.
- **Retries:** `retries.runMode = 1` absorbs transient infrastructure problems of a live third-party
  site (HTTP 503 rate limiting, bot challenges). Failures are still reported and screenshotted.

## Differences between the assignment and the live site (found while implementing)

| Assignment | Live site (Nov 2026) | How the tests handle it |
|------------|----------------------|-------------------------|
| Sharpener title *"Bostitch Office Personal Electric Pencil Sharpener … Gray (EPS4-KTGRAY)"* | The EPS4-KTGRAY listing was renamed to *"Bostitch Electric Pencil Sharpener for Classroom and Desk, Gray"* (ASIN `B088T419ZW`) | Searches with the assignment's text, picks the result **by ASIN** and verifies the model number EPS4-KTGRAY on the product page |
| Free shipping over **$49** | For Hong Kong the threshold shown is **$35** | The threshold is **read from the page**, not hard-coded |
| Main menu with *Customer Service* | Only shown for non-US delivery locations | Delivery country is set to Hong Kong first |
| Choosing "Red, Black, Blue" on the scissors page | Picking a color switches to another ASIN (variant) | The ASIN is read from the clicked swatch and used to find the item in the cart |

## Known limitations

Amazon actively protects against automated browsers. Runs may occasionally hit:
- an **AWS WAF JavaScript challenge** – handled automatically (the test waits for the real page);
- a **"Continue shopping" interstitial** – handled automatically (clicked);
- an **image CAPTCHA** – cannot (and should not) be bypassed; the test fails with an explicit message
  explaining it is bot protection, not a product defect;
- **HTTP 503** rate limiting – `cy.visitAmazon` backs off (10 s, 20 s) and tries again before failing;
- **temporary IP block** after many consecutive runs (connections time out / `EHOSTUNREACH`) – nothing a
  test can do; wait some minutes (or change network) and run again.

Results can also vary with the network's geographic location (prices, availability).
