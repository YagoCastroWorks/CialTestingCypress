/**
 * Confirmation page shown after "Add to cart" (/cart/smart-wagon),
 * including the side bar cart (#ewc-content).
 */
class AddedToCartPage {
  get selectors() {
    return {
      confirmation: '#NATC_SMART_WAGON_CONF_MSG_SUCCESS',
      sideCart: '#ewc-content',
      sideCartItem: (asin) => `#ewc-content .ewc-item[data-asin="${asin}"]`,
      buyBoxActions: '#sw-atc-buy-box a, #sw-atc-buy-box button, #sw-atc-buy-box input[type="submit"]',
    };
  }

  goToCart() {
    cy.contains(this.selectors.buyBoxActions, 'Go to Cart').should('be.visible').click();
    cy.location('pathname', { timeout: 30000 }).should('include', '/cart').and('not.include', 'smart-wagon');
  }

  shouldShowConfirmation() {
    cy.location('pathname', { timeout: 30000 }).should('include', '/cart');
    cy.get(this.selectors.confirmation, { timeout: 30000 })
      .should('be.visible')
      .and('contain.text', 'Added to cart');
  }

  shouldShowInSideCart(asin) {
    cy.get(this.selectors.sideCart).should('be.visible');
    cy.get(this.selectors.sideCartItem(asin)).should('be.visible');
  }
}

export default new AddedToCartPage();
