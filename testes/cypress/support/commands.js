Cypress.Commands.add('logResult', (title, status, suite, duration, error) => {
  cy.env(['NODE_APP_URL'], { log: false }).then(({ NODE_APP_URL }) => {
    const nodeAppUrl = NODE_APP_URL || 'http://localhost:3000';

    cy.request({
      method: 'POST',
      url: `${nodeAppUrl}/api/results`,
      body: { title, status, suite, duration, error: error || null },
      failOnStatusCode: false
    });
  });
});
