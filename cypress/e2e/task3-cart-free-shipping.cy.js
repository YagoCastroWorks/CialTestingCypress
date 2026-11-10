import Header from '../support/pages/Header';
import SearchResultsPage from '../support/pages/SearchResultsPage';
import ProductPage from '../support/pages/ProductPage';
import AddedToCartPage from '../support/pages/AddedToCartPage';
import CartPage from '../support/pages/CartPage';

describe('Task 3 - Shopping cart & free shipping', () => {
  /**
   * Steps 1-9 of the assignment: every test starts with the same two items in the cart.
   * Aliases exposed to the tests: @products, @sharpenerAsin, @scissorsAsin.
   */
  beforeEach(function () {
    cy.fixture('products').as('products');
    cy.fixture('shipping').then(({ country }) => {
      // 1. Navigate to amazon.com (delivering to Hong Kong)
      cy.openHomeDeliveringTo(country);
    });

    cy.get('@products').then(({ pencilSharpener, scissors }) => {
      // 2. Search for the pencil sharpener
      Header.search(pencilSharpener.searchTerm);

      // 3. Open the product and add it to the cart
      SearchResultsPage.openResultByAsin(pencilSharpener.asin);
      ProductPage.shouldBeProduct(pencilSharpener.asin);
      cy.contains(pencilSharpener.modelNumber).should('exist');
      ProductPage.addToCart();

      // 4. Confirmation + product shown in the side bar cart
      AddedToCartPage.shouldShowConfirmation();
      AddedToCartPage.shouldShowInSideCart(pencilSharpener.asin);
      Header.shouldHaveCartCount(1);
      cy.wrap(pencilSharpener.asin).as('sharpenerAsin');

      // 5. Navigate to the scissors page
      cy.visitAmazon(scissors.path);
      ProductPage.title().should('contain.text', scissors.titleKeyword);

      // 6. Image is displayed; selecting the color updates the "Color" label
      ProductPage.shouldDisplayMainImage();
      ProductPage.selectColor(scissors.color).as('scissorsAsin');
      ProductPage.selectedColor().should('have.text', scissors.color);

      // 7. Add to cart
      ProductPage.addToCart();

      // 8. "Added to cart" confirmation
      AddedToCartPage.shouldShowConfirmation();
    });

    // 9. Both products are in the cart
    cy.get('@scissorsAsin').then((scissorsAsin) => {
      AddedToCartPage.shouldShowInSideCart(scissorsAsin);
      Header.shouldHaveCartCount(2);

      AddedToCartPage.goToCart();
      CartPage.shouldBeOpen();
      CartPage.shouldContainItem(this.sharpenerAsin, { quantity: 1 });
      CartPage.shouldContainItem(scissorsAsin, { quantity: 1 });
      CartPage.activeItems().should('have.length', 2);
    });
  });

  // 13. Clear the cart, so every test leaves no state behind and can run independently.
  afterEach(() => {
    CartPage.visit();
    CartPage.empty();
  });

  it('should qualify for free shipping only after ordering 3 more pencil sharpeners', function () {
    // 10. Does not qualify for free shipping yet
    CartPage.freeShippingStatus().then(({ threshold, subtotal, qualifies, message }) => {
      expect(qualifies, message).to.eq(false);
      expect(message).to.match(/Add \$[\d.,]+ of eligible items to your order for FREE Shipping/);
      expect(subtotal, 'subtotal is below the free shipping threshold').to.be.lessThan(threshold);
    });

    // 11. Order 3 additional pencil sharpeners (4 in total)
    CartPage.increaseQuantity(this.sharpenerAsin, 3);
    Header.shouldHaveCartCount(5);

    // 12. Now qualifies for free shipping
    CartPage.freeShippingStatus().then(({ threshold, subtotal, qualifies, message }) => {
      expect(qualifies, message).to.eq(true);
      expect(subtotal, 'subtotal reached the free shipping threshold').to.be.at.least(threshold);
    });

    // Previous products are still in the cart
    CartPage.shouldContainItem(this.sharpenerAsin, { quantity: 4 });
    CartPage.shouldContainItem(this.scissorsAsin, { quantity: 1 });
  });

  it('should keep the selected scissors color in the cart', function () {
    CartPage.item(this.scissorsAsin).should('contain.text', this.products.scissors.color);
    CartPage.item(this.sharpenerAsin).should('contain.text', this.products.pencilSharpener.color);
  });

  it('should update the subtotal and item count when the quantity changes', function () {
    CartPage.subtotal().then((initialSubtotal) => {
      CartPage.increaseQuantity(this.scissorsAsin, 1);
      Header.shouldHaveCartCount(3);
      cy.get(CartPage.selectors.subtotalAmount).should(($subtotal) => {
        const updated = Number($subtotal.text().replace(/[^0-9.]/g, ''));
        expect(updated, 'subtotal increased').to.be.greaterThan(initialSubtotal);
      });
    });
  });
});
