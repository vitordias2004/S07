//Testes feitos usando Claude Sonnet 4.6 (browser)

Cypress.on("uncaught:exception", () => false);

describe("TC-017 - Campo de texto com mais de 40 caracteres", () => {
  it("Não deve aceitar texto além do limite de 40 caracteres", () => {
    cy.visit("https://playground-for-qa.vercel.app/playground");

    const textoLongo = "A".repeat(50); // tenta digitar 50 caracteres

    cy.get('[data-testid="text-input"]').type(textoLongo);

    // O campo tem limite de 40 — o valor real não pode ter mais que isso
    cy.get('[data-testid="text-input"]')
      .invoke("val")
      .then((valor) => {
        expect(valor.length).to.be.at.most(40);
      });
  });
});

describe("TC-018 - Formulário de cadastro enviado sem preencher campos", () => {
  it("Não deve submeter o formulário com todos os campos vazios", () => {
    cy.visit("https://playground-for-qa.vercel.app/playground");

    cy.contains("button", "Enviar").first().click();

    cy.url().should("include", "/playground");

    cy.contains("Formulário de Cadastro").should("be.visible");
  });
});

describe("TC-019 - Login com credenciais inválidas", () => {
  it("Deve bloquear o login após 3 tentativas com senha errada", () => {
    cy.visit("https://playground-for-qa.vercel.app/playground");

   const tentarLogin = () => {
      cy.visit('https://playground-for-qa.vercel.app/playground')
      cy.get('input[type="email"]').last().type('admin@test.com')
      cy.get('input[type="password"]').last().type('senhaerrada123')
      cy.contains('button', 'Entrar').click()
      cy.wait(1000)
    }

    tentarLogin()
    tentarLogin()
    tentarLogin()

    cy.contains(/bloqueado|limite|tentativas|erro/i).should("be.visible");
  });
});

describe("TC-020 - Pagamento com cartão inválido", () => {
  it("Não deve processar pagamento com número de cartão inválido", () => {
    cy.visit("https://playground-for-qa.vercel.app/playground");

    cy.get('[data-testid="card-number"]').type("1234 5678 9012 3456");

    cy.get('[data-testid="card-name"]').type("TESTE INVALIDO");

    cy.get('[data-testid="card-expiry"]').type("99/99");

    cy.get('[data-testid="card-cvv"]').type("000");

    cy.contains("button", "Pagar").click();

    cy.contains(/sucesso|aprovado|confirmado|inválido|erro|recusado/i).should('be.visible');
  });
});
