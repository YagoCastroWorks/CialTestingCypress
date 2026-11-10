import Header from '../support/pages/Header';
import CustomerServicePage from '../support/pages/CustomerServicePage';
import HelpArticlePage from '../support/pages/HelpArticlePage';

describe('Task 2 - Customer Service: "Where\'s My Stuff?"', () => {
  beforeEach(function () {
    cy.fixture('customerService').as('cs');
    cy.fixture('shipping').then(({ country }) => cy.openHomeDeliveringTo(country));
  });

  it('should display the main menu items', function () {
    this.cs.mainMenuItems.forEach((item) => {
      Header.mainMenuItem(item).should('be.visible').and('have.attr', 'href').and('not.be.empty');
    });
  });

  it('should find the "Where\'s My Stuff?" help article from the Customer Service page', function () {
    const { searchTerm, expectedArticle } = this.cs;

    Header.openMainMenuItem('Customer Service');
    CustomerServicePage.shouldBeOpen();

    CustomerServicePage.searchHelp(searchTerm);
    CustomerServicePage.firstResult().should('contain.text', expectedArticle.title);

    CustomerServicePage.openFirstResult();
    HelpArticlePage.shouldBeArticle(expectedArticle);
  });
});
