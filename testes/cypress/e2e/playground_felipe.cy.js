describe('Teste falha formulário', () => {

  it('Senha com menos de 8 caracteres', () => {

    Cypress.on('uncaught:exception', () => false)

    cy.visit('https://playground-for-qa.vercel.app/playground')

    const inputName = '[data-testid="input-name"]';
    const inputPassword = '[data-testid="input-password"]';
    const inputEmail = '[data-testid="input-email"]';

    cy.get(inputName).click();
    cy.get(inputName).type('Felipe', { force: true });
    cy.get(inputName).should('have.value', 'Felipe');

    cy.get(inputPassword).click();
    cy.get(inputPassword).type('123', { force: true });
    cy.get(inputPassword).should('have.value', '123');

    cy.get(inputEmail).click();
    cy.get(inputEmail).type('teste@teste.com', { force: true });
    cy.get(inputEmail).should('have.value', 'teste@teste.com');

    cy.get('[data-testid="input-confirm-password"]').click();
    cy.get('[data-testid="input-confirm-password"]').type('123', { force: true });
    cy.get('[data-testid="input-confirm-password"]').should('have.value', '123');

    cy.get('[data-testid="checkbox-terms"]').click({ force: true });
    cy.get('[data-testid="checkbox-terms"]').should('be.checked');

    cy.get('[data-testid="submit-button"]').click({ force: true });

    cy.contains('Senha deve ter no mínimo 8 caracteres').should('be.visible');

  })

})

describe('Teste autenticação', () => {

    it('Mensagem de erro e bloqueio ao errar 3 vezes', () => {

        Cypress.on('uncaught:exception', () => false)

        cy.visit('https://playground-for-qa.vercel.app/playground')

        const loginEmail = '[data-testid="login-email"]';
        const loginPassword = '[data-testid="login-password"]';
        const loginbutton = cy.get('[data-testid="login-button"]')
        
        cy.get(loginEmail).click();
        cy.get(loginEmail).type('teste@teste.com', { force: true });
        cy.get(loginEmail).should('have.value', 'teste@teste.com');

        cy.get(loginPassword).click();
        cy.get(loginPassword).type('123', { force: true });
        cy.get(loginPassword).should('have.value', '123');

        loginbutton.click();
        loginbutton.click();
        loginbutton.click();

        cy.get('[data-testid="login-error"]').should('be.visible');

    })

})

describe('Preencher cartão inválido', () => {

    it('Deve exibir mensagem de erro', () => {

        Cypress.on('uncaught:exception', () => false)

        cy.visit('https://playground-for-qa.vercel.app/playground')

        const cardNumber = '[data-testid="card-number"]';
        const cardName = '[data-testid="card-name"]';
        const cardExpiry = '[data-testid="card-expiry"]';
        const cardCvv = '[data-testid="card-cvv"]';
      
        cy.get(cardNumber).click();
        cy.get(cardNumber).type('1234567890123456', { force: true });
        cy.get(cardNumber).should('have.value', '1234 5678 9012 3456');

        cy.get(cardName).click();
        cy.get(cardName).type('Felipe da Silva', { force: true });
        cy.get(cardName).should('have.value', 'FELIPE DA SILVA');

        cy.get(cardExpiry).click();
        cy.get(cardExpiry).type('1225', { force: true });
        cy.get(cardExpiry).should('have.value', '12/25');

        cy.get(cardCvv).click();
        cy.get(cardCvv).type('123', { force: true });
        cy.get(cardCvv).should('have.value', '123');

        cy.get('[data-testid="pay-button"]').click({ force: true });

        cy.get('[data-testid="error-0"]').should('be.visible');
        cy.get('[data-testid="error-1"]').should('be.visible');

    })

})

describe('Teste falha botão submit', () => {

  it('Clickar no botão submit sem preencher os campos', () => {

    Cypress.on('uncaught:exception', () => false)

    cy.visit('https://playground-for-qa.vercel.app/playground')

    cy.get('[data-testid="submit-button"]').click({ force: true });

    cy.get('[data-testid="submit-button"]').click({ force: true });
    cy.contains('Nome é obrigatório').should('be.visible');
    cy.contains('Email é obrigatório').should('be.visible');
    cy.contains('Senha é obrigatória').should('be.visible');
    cy.contains('Você deve aceitar os termos').should('be.visible');
  })

})

describe('Teste falha checkbox', () => {

    it('Formulário sem aceitar os termos', () => {

        Cypress.on('uncaught:exception', () => false)

        cy.visit('https://playground-for-qa.vercel.app/playground')

        const inputName = '[data-testid="input-name"]';
        const inputPassword = '[data-testid="input-password"]';
        const inputEmail = '[data-testid="input-email"]';

        cy.get(inputName).click();
        cy.get(inputName).type('Felipe', { force: true });
        cy.get(inputName).should('have.value', 'Felipe');

        cy.get(inputPassword).click();
        cy.get(inputPassword).type('12345678', { force: true });
        cy.get(inputPassword).should('have.value', '12345678');

        cy.get(inputEmail).click();
        cy.get(inputEmail).type('teste@teste.com', { force: true });
        cy.get(inputEmail).should('have.value', 'teste@teste.com');

        cy.get('[data-testid="input-confirm-password"]').click();
        cy.get('[data-testid="input-confirm-password"]').type('12345678', { force: true });
        cy.get('[data-testid="input-confirm-password"]').should('have.value', '12345678');

        cy.get('[data-testid="submit-button"]').click({ force: true });

        cy.contains('Você deve aceitar os termos').should('be.visible');

    })

})

describe('Teste falha API', () => {

it('Deve exibir erro ao testar API 404', () => {
    
    Cypress.on('uncaught:exception', () => false)
    
    cy.visit('https://playground-for-qa.vercel.app/playground')
    
    const testButton = '[data-testid="test-404"]';
    const apiError = '[data-testid="api-error"]';
    
    cy.get(testButton).click({ force: true });
    cy.get(testButton).click({ force: true });
    cy.get(apiError).should('be.visible');
})

})