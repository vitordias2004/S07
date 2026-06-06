const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";

const selectors = {
  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginButton: '[data-testid="login-button"]',
  loginError: '[data-testid="login-error"]',
  loginAttempts: '[data-testid="login-attempts"]',
};

describe("Playground - autenticacao", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Eduardo
  it("deve bloquear o login apos 3 tentativas com senha errada", () => {
    cy.get(selectors.loginEmail)
      .should("be.visible")
      .type("admin@test.com", { force: true });
    cy.get(selectors.loginPassword)
      .should("be.visible")
      .type("senhaerrada123", { force: true });

    cy.get(selectors.loginButton).click();
    cy.get(selectors.loginButton).click();
    cy.get(selectors.loginButton).click();

    cy.get(selectors.loginAttempts).should("contain", "3").and("contain", "/3");
    cy.get(selectors.loginError).should("be.visible");
  });

  // Caso originalmente adicionado por: Felipe
  it("deve exibir erro ao errar o login 3 vezes seguidas", () => {
    cy.get(selectors.loginEmail).type("teste@teste.com", { force: true });
    cy.get(selectors.loginPassword).type("123", { force: true });

    cy.get(selectors.loginButton).click();
    cy.get(selectors.loginButton).click();
    cy.get(selectors.loginButton).click();

    cy.get(selectors.loginError).should("be.visible");
  });
});
