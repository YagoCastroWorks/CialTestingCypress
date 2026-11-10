import Header from './pages/Header';

const PAGE_READY = '#nav-logo-sprites';
const CAPTCHA_FORM = 'form[action*="validateCaptcha"]';
const ERROR_PAGE_TITLE = /Service Unavailable|Something went wrong|503/i;
const MAX_VISIT_ATTEMPTS = 3;
const BACKOFF_MS = 10000;

// Reads the document of the current <body>: the WAF challenge reloads the page, so a captured one would be stale.
const pageState = ($body) => {
  if ($body.find(PAGE_READY).length) return 'ready';
  if ($body.find(CAPTCHA_FORM).length) return 'captcha';
  if (ERROR_PAGE_TITLE.test($body[0].ownerDocument.title)) return 'error';
  return 'loading';
};

/**
 * Visits an Amazon page and waits until the real page is rendered.
 *
 * Amazon may answer an automated browser with:
 *  1. An AWS WAF JavaScript challenge that reloads the page by itself -> we wait for the real page.
 *  2. A "Continue shopping" interstitial (captcha form with a single button) -> we click it.
 *  3. HTTP 503 rate limiting -> we back off and try again (up to MAX_VISIT_ATTEMPTS).
 *  4. A real image captcha -> cannot be solved by design; we fail with an explicit message
 *     instead of letting a later step fail with a misleading "element not found".
 */
Cypress.Commands.add('visitAmazon', (path = '/', attempt = 1) => {
  cy.visit(path, { failOnStatusCode: false });

  cy.get('body', { timeout: 30000 })
    .should(($body) => {
      expect(pageState($body), 'Amazon page state').to.not.eq('loading');
    })
    .then(($body) => {
      const state = pageState($body);

      if (state === 'error') {
        const { title } = $body[0].ownerDocument;
        if (attempt >= MAX_VISIT_ATTEMPTS) {
          throw new Error(`Amazon kept answering "${title}" for ${path} after ${attempt} attempts (rate limiting).`);
        }
        cy.log(`Amazon answered "${title}" (attempt ${attempt}); backing off before retrying`);
        cy.wait(BACKOFF_MS * attempt); // intentional backoff for rate limiting, not a synchronization wait
        cy.visitAmazon(path, attempt + 1);
        return;
      }

      if (state === 'captcha') {
        if ($body.find('input#captchacharacters').length) {
          throw new Error(
            'Amazon is showing an image CAPTCHA (bot protection). The run cannot continue automatically — ' +
              'please retry later or from another network.',
          );
        }
        cy.get(CAPTCHA_FORM).find('button[type="submit"], input[type="submit"]').first().click();
        cy.get(PAGE_READY, { timeout: 30000 }).should('exist');
      }
    });
});

/**
 * Opens the home page delivering to the given country (prices, main menu and shipping rules depend on it).
 * The location label is updated via AJAX before the page re-renders, so the home page is loaded again
 * to make sure everything on it (e.g. the main menu) reflects the new country.
 */
Cypress.Commands.add('openHomeDeliveringTo', (country) => {
  cy.visitAmazon('/');
  Header.setDeliveryCountry(country);
  cy.visitAmazon('/');
  Header.shouldDeliverTo(country);
});
