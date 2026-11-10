/**
 * "Help & Customer Service" hub and its search results.
 */
class CustomerServicePage {
  get selectors() {
    return {
      helpSearchInput: '#hubHelpSearchInput',
      resultTitles: 'h2.a-size-medium',
    };
  }

  shouldBeOpen() {
    cy.location('pathname').should('include', '/gp/help/customer');
    cy.contains('h1', 'Welcome to Amazon Customer Service').should('be.visible');
  }

  searchHelp(term) {
    cy.get(this.selectors.helpSearchInput).should('be.visible').clear().type(`${term}{enter}`);
    cy.location('search').should('include', 'help_keywords=');
  }

  results() {
    return cy.get(this.selectors.resultTitles).filter(':visible');
  }

  firstResult() {
    return this.results().first();
  }

  openFirstResult() {
    this.firstResult().find('a').click();
  }
}

export default new CustomerServicePage();
