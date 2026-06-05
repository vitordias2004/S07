const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";

const selectors = {
  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginButton: '[data-testid="login-button"]',
  loginError: '[data-testid="login-error"]',
};

describe("Playground - autenticacao", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Eduardo
  it("deve bloquear o login apos 3 tentativas com senha errada", () => {
    const tentarLogin = () => {
      cy.visit(PLAYGROUND_URL);
      cy.get('input[type="email"]').last().type("admin@test.com");
      cy.get('input[type="password"]').last().type("senhaerrada123");
      cy.contains("button", "Entrar").click();
      cy.wait(1000);
    };

    tentarLogin();
    tentarLogin();
    tentarLogin();

    cy.contains(/bloqueado|limite|tentativas|erro/i).should("be.visible");
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
