/**
 * Global navigation bar shared by every Amazon page:
 * search box, delivery location, main menu (#nav-xshop) and cart counter.
 */
class Header {
  get selectors() {
    return {
      searchInput: '#twotabsearchtextbox',
      searchSubmit: '#nav-search-submit-button',
      mainMenuLinks: '#nav-xshop a',
      cartCount: '#nav-cart-count',
      deliverTo: '#nav-global-location-popover-link',
      deliverToLabel: '#glow-ingress-line2',
      countryDropdown: '#GLUXCountryList',
      countryDoneButton: '[name="glowDoneButton"]',
    };
  }

  search(term) {
    cy.get(this.selectors.searchInput).clear().type(term);
    cy.get(this.selectors.searchSubmit).click();
  }

  mainMenuItem(name) {
    return cy.contains(this.selectors.mainMenuLinks, new RegExp(`^\\s*${Cypress._.escapeRegExp(name)}\\s*$`));
  }

  openMainMenuItem(name) {
    this.mainMenuItem(name).should('be.visible').click();
  }

  cartCount() {
    return cy.get(this.selectors.cartCount);
  }

  /** Asserts the cart counter reaches the expected value (retries while the page updates). */
  shouldHaveCartCount(expected) {
    this.cartCount().should('have.text', String(expected));
  }

  setDeliveryCountry({ code, name }) {
    cy.get(this.selectors.deliverTo).click();
    cy.get(this.selectors.countryDropdown).select(code, { force: true });
    cy.get(this.selectors.countryDoneButton).filter(':visible').click();
    this.shouldDeliverTo({ name });
  }

  shouldDeliverTo({ name }) {
    cy.get(this.selectors.deliverToLabel, { timeout: 30000 }).should('contain.text', name);
  }
}

export default new Header();
