const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";
const textInput = '[data-testid="text-input"]';

describe("Playground - campos de texto", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Sofia
  it("deve aceitar digitacao no campo de texto", () => {
    cy.get(textInput).type("Cypress Hero").should("have.value", "Cypress Hero");
  });

  // Caso originalmente adicionado por: Eduardo
  it("deve limitar a digitacao a 40 caracteres", () => {
    const textoLongo = "A".repeat(50);

    cy.get(textInput).type(textoLongo);
    cy.get(textInput)
      .invoke("val")
      .then((valor) => {
        expect(valor.length).to.be.at.most(40);
      });
  });

  // Caso originalmente adicionado por: Vitor
  it("deve refletir o texto digitado no campo", () => {
    const texto = "Teste Cypress";

    cy.get(textInput).type(texto).should("have.value", texto);
  });

  // Caso originalmente adicionado por: Vitor
  it("deve exibir o placeholder correto", () => {
    cy.get(textInput).should("have.attr", "placeholder", "Digite algo...");
  });
});
