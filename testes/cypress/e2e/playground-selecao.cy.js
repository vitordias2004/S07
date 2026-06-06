const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";

describe("Playground - selecao e opcoes", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Sofia
  it("deve exibir o campo de data vazio inicialmente", () => {
    cy.get('[data-testid="input-date"]')
      .should("be.visible")
      .and("have.attr", "type", "date")
      .and("have.value", "");
  });

  // Caso originalmente adicionado por: Sofia
  it("deve exibir o dropdown customizado com o placeholder padrao", () => {
    cy.contains('[data-testid="card-title"]', "Seleção")
      .parents('[data-testid="card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="select-input"]')
          .should("be.visible")
          .and("contain", "Escolha uma opção")
          .and("have.attr", "aria-expanded", "false");
      });
  });

  // Caso originalmente adicionado por: Sofia
  it("deve iniciar o contador de checkboxes zerado", () => {
    cy.get('[data-testid="checkbox-count"]').should("contain", "Selecionados: 0");
  });
});
