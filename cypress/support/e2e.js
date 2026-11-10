import './commands';

// Errors thrown by Amazon's own third-party scripts (ads, metrics) are not under test
// and must not fail our specs. Assertions in the specs are what decide pass/fail.
Cypress.on('uncaught:exception', () => false);
