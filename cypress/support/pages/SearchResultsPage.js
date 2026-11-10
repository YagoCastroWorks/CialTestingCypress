/**
 * Product search results (/s?k=...).
 */
class SearchResultsPage {
  get selectors() {
    return {
      result: '[data-component-type="s-search-result"]',
    };
  }

  resultByAsin(asin) {
    return cy.get(`${this.selectors.result}[data-asin="${asin}"]`).first();
  }

  openResultByAsin(asin) {
    this.resultByAsin(asin).scrollIntoView().find(`a[href*="${asin}"]`).first().click();
  }
}

export default new SearchResultsPage();
