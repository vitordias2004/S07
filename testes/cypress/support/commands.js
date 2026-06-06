const NODE_APP_URL = Cypress.env('NODE_APP_URL') || 'http://localhost:3000';

Cypress.Commands.add('logResult', (title, status, suite, duration, error) => {
  cy.request({
    method: 'POST',
    url: `${NODE_APP_URL}/api/results`,
    body: { title, status, suite, duration, error: error || null },
    failOnStatusCode: false
  });
});