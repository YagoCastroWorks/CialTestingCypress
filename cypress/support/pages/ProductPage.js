/**
 * Product detail page (/dp/{ASIN}).
 */
class ProductPage {
  get selectors() {
    return {
      title: '#productTitle',
      mainImage: '#landingImage',
      addToCartButton: '#add-to-cart-button',
      colorSwatches: '[id^="inline-twister-row-color_name"] li[data-asin], [id*="color_name"] li[data-asin]',
      selectedColorLabel: '#inline-twister-expanded-dimension-text-color_name',
    };
  }

  title() {
    return cy.get(this.selectors.title).filter(':visible');
  }

  shouldBeProduct(asin) {
    cy.location('pathname').should('include', asin);
    this.title().should('be.visible');
  }

  /** The image must be visible AND actually loaded (naturalWidth > 0), not just present in the DOM. */
  shouldDisplayMainImage() {
    cy.get(this.selectors.mainImage)
      .should('be.visible')
      .and(($img) => {
        expect($img[0].complete, 'image finished loading').to.eq(true);
        expect($img[0].naturalWidth, 'image natural width').to.be.greaterThan(0);
      });
  }

  colorSwatch(colorName) {
    return cy
      .get(this.selectors.colorSwatches)
      .filter(`:has(img[alt="${colorName}"])`)
      .first();
  }

  /**
   * Selects a color variant and yields the ASIN of the selected variant
   * (picking a color switches the product to a different ASIN).
   */
  selectColor(colorName) {
    return this.colorSwatch(colorName).then(($swatch) => {
      const variantAsin = $swatch.attr('data-asin');
      cy.wrap($swatch).click();
      return cy.wrap(variantAsin);
    });
  }

  selectedColor() {
    return cy.get(this.selectors.selectedColorLabel);
  }

  addToCart() {
    cy.get(this.selectors.addToCartButton).should('be.visible').click();
  }
}

export default new ProductPage();
