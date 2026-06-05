const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";

const selectors = {
  cardNumber: '[data-testid="card-number"]',
  cardName: '[data-testid="card-name"]',
  cardExpiry: '[data-testid="card-expiry"]',
  cardCvv: '[data-testid="card-cvv"]',
  payButton: '[data-testid="pay-button"]',
};

describe("Playground - pagamento", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Eduardo
  it("deve rejeitar um cartao invalido", () => {
    cy.get(selectors.cardNumber).type("1234 5678 9012 3456");
    cy.get(selectors.cardName).type("TESTE INVALIDO");
    cy.get(selectors.cardExpiry).type("99/99");
    cy.get(selectors.cardCvv).type("000");

    cy.get(selectors.payButton).click({ force: true });

    cy.contains(/inv.lido|erro|recusado/i).should("be.visible");
  });

  // Caso originalmente adicionado por: Felipe
  it("deve exibir mensagens de erro para cartao invalido", () => {
    cy.get(selectors.cardNumber).type("1234567890123456", { force: true });
    cy.get(selectors.cardName).type("Felipe da Silva", { force: true });
    cy.get(selectors.cardExpiry).type("1225", { force: true });
    cy.get(selectors.cardCvv).type("123", { force: true });

    cy.get(selectors.payButton).click({ force: true });

    cy.get('[data-testid="error-0"]').should("be.visible");
    cy.get('[data-testid="error-1"]').should("be.visible");
  });
});
