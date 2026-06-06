const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";

const selectors = {
  inputName: '[data-testid="input-name"]',
  inputEmail: '[data-testid="input-email"]',
  inputPassword: '[data-testid="input-password"]',
  inputConfirmPassword: '[data-testid="input-confirm-password"]',
  checkboxTerms: '[data-testid="checkbox-terms"]',
  submitButton: '[data-testid="submit-button"]',
};

function preencherFormulario({
  name = "Felipe",
  email = "teste@teste.com",
  password = "12345678",
  confirmPassword = password,
  acceptTerms = true,
} = {}) {
  cy.get(selectors.inputName).type(name, { force: true });
  cy.get(selectors.inputEmail).type(email, { force: true });
  cy.get(selectors.inputPassword).type(password, { force: true });
  cy.get(selectors.inputConfirmPassword).type(confirmPassword, { force: true });

  if (acceptTerms) {
    cy.get(selectors.checkboxTerms).click({ force: true });
  }
}

describe("Playground - formulario de cadastro", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Felipe
  it("deve exibir erro para senha com menos de 8 caracteres", () => {
    preencherFormulario({
      password: "123",
      confirmPassword: "123",
    });

    cy.get(selectors.submitButton).click({ force: true });

    cy.contains(/Senha deve ter no m.nimo 8 caracteres/).should("be.visible");
  });

  // Caso originalmente adicionado por: Felipe
  it("deve exigir todos os campos obrigatorios antes do envio", () => {
    cy.get(selectors.submitButton).click({ force: true });

    cy.url().should("include", "/playground");
    cy.get(selectors.inputName).should("have.value", "");
    cy.get(selectors.inputEmail).should("have.value", "");
    cy.get(selectors.inputPassword).should("have.value", "");
    cy.get(selectors.checkboxTerms).should("not.be.checked");
  });

  // Caso originalmente adicionado por: Felipe
  it("deve exigir o aceite dos termos para enviar o formulario", () => {
    preencherFormulario({
      password: "12345678",
      confirmPassword: "12345678",
      acceptTerms: false,
    });

    cy.get(selectors.submitButton).click({ force: true });

    cy.contains(/Voc. deve aceitar os termos/).should("be.visible");
  });

  // Caso originalmente adicionado por: Eduardo
  it("deve permanecer na pagina ao tentar enviar o formulario vazio", () => {
    cy.get(selectors.submitButton).click({ force: true });

    cy.url().should("include", "/playground");
    cy.contains(/Formul.rio de Cadastro/).should("be.visible");
  });
});
