
// Import commands.js using ES2015 syntax:
import './commands'

Cypress.on('uncaught:exception', () => false);

afterEach(function () {
  const title    = this.currentTest.title;
  const suite    = this.currentTest.parent?.title || 'sem suite';
  const status   = this.currentTest.state === 'passed' ? 'passed' : 'failed';
  const duration = this.currentTest.duration || 0;
  const error    = this.currentTest.err?.message || null;

  cy.logResult(title, status, suite, duration, error);
});