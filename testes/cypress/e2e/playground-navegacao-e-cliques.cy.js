const PLAYGROUND_URL = "https://playground-for-qa.vercel.app/playground";

function extractCounter(texto) {
  return Number(texto.match(/\d+/)[0]);
}

describe("Playground - navegacao e cliques", () => {
  beforeEach(() => {
    cy.visit(PLAYGROUND_URL);
  });

  // Caso originalmente adicionado por: Vitor
  it("deve carregar a pagina corretamente", () => {
    cy.contains("Playground").should("be.visible");
  });

  // Caso originalmente adicionado por: Vitor
  it("deve exibir o botao de clique simples", () => {
    cy.get('[data-testid="click-button"]').should("be.visible");
  });

  // Caso originalmente adicionado por: Vitor
  it("deve aumentar o contador no clique simples", () => {
    cy.get('[data-testid="click-button"]')
      .invoke("text")
      .then((textoAntes) => {
        const numeroAntes = extractCounter(textoAntes);

        cy.get('[data-testid="click-button"]').click();

        cy.get('[data-testid="click-button"]')
          .invoke("text")
          .then((textoDepois) => {
            const numeroDepois = extractCounter(textoDepois);

            expect(numeroDepois).to.eq(numeroAntes + 1);
          });
      });
  });

  // Caso originalmente adicionado por: Vitor
  it("deve alterar o contador no clique duplo", () => {
    cy.get('[data-testid="double-click-button"]')
      .invoke("text")
      .then((textoAntes) => {
        const numeroAntes = extractCounter(textoAntes);

        cy.get('[data-testid="double-click-button"]').dblclick();

        cy.get('[data-testid="double-click-button"]')
          .invoke("text")
          .then((textoDepois) => {
            const numeroDepois = extractCounter(textoDepois);

            expect(numeroDepois).to.not.equal(numeroAntes);
          });
      });
  });
});
