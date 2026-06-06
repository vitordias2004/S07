const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";
const textInput = '[data-testid="text-input"]';

describe("Playground - campos de texto", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Sofia
  it("deve exibir o campo de texto vazio com limite de 40 caracteres", () => {
    cy.get(textInput)
      .should("be.visible")
      .and("have.value", "")
      .and("have.attr", "maxlength", "40");
  });

  // Caso originalmente adicionado por: Eduardo
  it("deve exibir o contador inicial zerado", () => {
    cy.get('[data-testid="char-counter"]').should("contain", "0/40 caracteres");
  });

  // Caso originalmente adicionado por: Vitor
  it("deve iniciar sem texto preenchido", () => {
    cy.get(textInput).should("have.value", "");
  });

  // Caso originalmente adicionado por: Vitor
  it("deve exibir o placeholder correto", () => {
    cy.get(textInput).should("have.attr", "placeholder", "Digite algo...");
  });
});
