import Header from './Header';

const parsePrice = (text) => Number(String(text).replace(/[^0-9.]/g, ''));

/**
 * Shopping cart page (/cart).
 */
class CartPage {
  get selectors() {
    return {
      cartContainer: '#sc-active-cart',
      // Removed items stay in the DOM with a "was removed" message, so only "active" rows count.
      activeItem: '.sc-list-item[data-asin]:not(.sc-list-item-removed):not([class*="optimist"])',
      itemByAsin: (asin) => `.sc-list-item[data-asin="${asin}"]`,
      increaseQuantity: '[data-a-selector="increment"]',
      deleteButton: 'input[data-feature-id="item-delete-button"]',
      buyBox: '#sc-buy-box',
      subtotalAmount: '#sc-subtotal-amount-buybox',
    };
  }

  visit() {
    cy.visitAmazon('/cart');
    this.shouldBeOpen();
  }

  shouldBeOpen() {
    cy.get(this.selectors.cartContainer, { timeout: 30000 }).should('be.visible');
  }

  item(asin) {
    return cy.get(this.selectors.itemByAsin(asin));
  }

  activeItems() {
    return cy.get(this.selectors.activeItem);
  }

  shouldContainItem(asin, { quantity } = {}) {
    this.item(asin).should('be.visible');
    if (quantity !== undefined) {
      this.item(asin).should('have.attr', 'data-quantity', String(quantity));
    }
  }

  /** The row's data-quantity attribute is updated by the cart after the server confirms the change. */
  quantity(asin) {
    return this.item(asin).invoke('attr', 'data-quantity');
  }

  /**
   * Clicks "+" once per unit and waits for the server-confirmed quantity before the next click.
   * If a click lands before the cart's scripts are bound it is a no-op; in that case (and only
   * when the quantity is still unchanged) the click is repeated once, so a unit is never added twice.
   */
  increaseQuantity(asin, times) {
    cy.document().its('readyState').should('eq', 'complete');
    this.quantity(asin).then((current) => {
      const start = Number(current);
      Cypress._.times(times, (i) => {
        const expected = String(start + i + 1);
        this.clickIncrease(asin);
        this.waitForQuantity(asin, expected, 8000).then((updated) => {
          if (!updated) this.clickIncrease(asin);
        });
        this.quantity(asin).should('eq', expected);
      });
    });
  }

  clickIncrease(asin) {
    this.item(asin).find(this.selectors.increaseQuantity).filter(':visible').first().click();
  }

  /** Polls without failing; yields true if the quantity reached `expected` within `ms`. */
  waitForQuantity(asin, expected, ms) {
    const selector = this.selectors.itemByAsin(asin);
    return cy.document().then({ timeout: ms + 2000 }, (doc) =>
      new Cypress.Promise((resolve) => {
        const started = Date.now();
        const poll = () => {
          const row = doc.querySelector(selector);
          if (row && row.getAttribute('data-quantity') === expected) return resolve(true);
          if (Date.now() - started > ms) return resolve(false);
          return setTimeout(poll, 250);
        };
        poll();
      }),
    );
  }

  subtotal() {
    return cy.get(this.selectors.subtotalAmount).invoke('text').then(parsePrice);
  }

  /**
   * Yields { threshold, subtotal, qualifies, message } from the free-shipping
   * progress block in the buy box, e.g.:
   *  "$35 Add $4.20 of eligible items to your order for FREE Shipping."
   *  "$35 Your order qualifies for FREE Shipping."
   */
  freeShippingStatus() {
    return cy
      .get(this.selectors.buyBox)
      .should('contain.text', 'FREE Shipping')
      .invoke('text')
      .then((raw) => {
        const message = raw.replace(/\s+/g, ' ').trim();
        const thresholdMatch = message.match(/^\$\s?([\d.,]+)/);
        expect(thresholdMatch, `free shipping threshold in "${message}"`).to.not.equal(null);
        return this.subtotal().then((subtotal) => ({
          threshold: parsePrice(thresholdMatch[1]),
          subtotal,
          qualifies: /qualifies for FREE Shipping/i.test(message),
          message,
        }));
      });
  }

  /**
   * Deletes every item, one at a time, then reloads the cart and asserts it is empty.
   * The header counter can lag behind after a delete, so the loop relies on the
   * cart rows themselves; the counter is only checked on the freshly loaded page.
   */
  empty() {
    const deleteNext = () => {
      cy.get(this.selectors.cartContainer).then(($cart) => {
        const $button = $cart.find(this.selectors.deleteButton).filter(':visible').first();
        if (!$button.length) return;

        const asin = $button.closest('.sc-list-item').attr('data-asin');
        cy.wrap($button).click();
        cy.get(this.selectors.cartContainer).should(($c) => {
          const $row = $c.find(this.selectors.itemByAsin(asin));
          const removed = $row.length === 0 || /was removed from Shopping Cart/i.test($row.text());
          expect(removed, `item ${asin} removed`).to.eq(true);
        });
        deleteNext();
      });
    };

    deleteNext();
    this.visit();
    this.shouldBeEmpty();
  }

  shouldBeEmpty() {
    cy.contains(this.selectors.cartContainer, /Your Amazon Cart is empty/i).should('be.visible');
    cy.get(this.selectors.cartContainer).find(this.selectors.deleteButton).should('not.exist');
    Header.shouldHaveCartCount(0);
  }
}

export default new CartPage();
