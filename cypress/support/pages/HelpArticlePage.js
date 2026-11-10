/**
 * A single help article page (e.g. "Where's My Stuff?").
 */
class HelpArticlePage {
  get selectors() {
    return {
      title: 'h1',
      breadcrumbLinks: '.help-content a, #a-page a',
      findMoreSolutionsInput: '#helpsearch, input[name="help_keywords"]',
    };
  }

  shouldBeArticle({ title, breadcrumb }) {
    cy.location('pathname').should('include', '/gp/help/customer/display.html');
    cy.contains(this.selectors.title, title).should('be.visible');
    cy.contains(this.selectors.breadcrumbLinks, breadcrumb).should('be.visible');
    cy.contains('Find more solutions').should('be.visible');
    cy.get(this.selectors.findMoreSolutionsInput).filter(':visible').should('have.length.at.least', 1);
  }
}

export default new HelpArticlePage();
