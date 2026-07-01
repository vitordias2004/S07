const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";

describe("Playground - api", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Felipe
  it("deve exibir erro ao testar a API 404", () => {
    cy.get('[data-testid="test-404"]').click({ force: true });
    cy.get('[data-testid="test-404"]').click({ force: true });

    cy.get('[data-testid="api-error"]').should("be.visible");
  });

it('deve cobrir rotas auxiliares do node-app', () => {
  const baseUrl = 'http://node-app:3000'; // Usa o alias da rede Docker

  // Cobre GET /
  cy.request(`${baseUrl}/`).then(res => {
    expect(res.status).to.eq(200);
  });

  // Cobre POST com body inválido (sem title)
  cy.request({
    method: 'POST',
    url: `${baseUrl}/api/results`,
    body: { status: 'passed' },
    failOnStatusCode: false
  }).then(res => {
    expect(res.status).to.eq(400);
  });

  // Cobre DELETE /api/results
  cy.request({
    method: 'DELETE',
    url: `${baseUrl}/api/results`
  }).then(res => {
    expect(res.status).to.eq(200);
  });
});
});
