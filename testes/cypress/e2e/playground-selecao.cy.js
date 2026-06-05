const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";

describe("Playground - selecao e opcoes", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Sofia
  it("deve selecionar uma data e exibi-la corretamente", () => {
    cy.get('input[type="date"]').first().type("2024-01-16");

    cy.contains("2024-01-16").should("be.visible");
  });

  // Caso originalmente adicionado por: Sofia
  it("deve selecionar um framework no dropdown customizado", () => {
    cy.contains(/Escolha uma op..o/).first().click();
    cy.contains("Cypress").click();

    cy.contains("Cypress").should("be.visible");
  });

  // Caso originalmente adicionado por: Sofia
  it("deve marcar todos os checkboxes e atualizar o contador", () => {
    cy.contains(/Selecionar Todas/).click();

    cy.contains(/Selecionados: 3/).should("be.visible");
  });
});
