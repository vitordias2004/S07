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
});
