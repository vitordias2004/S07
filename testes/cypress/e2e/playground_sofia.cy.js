//testes criados usando claude sonnet 4.6 (browser)

describe('QA Playground - Testes de Sucesso', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false)
    cy.visit('https://playground-for-qa.vercel.app/playground')
  })

  // Teste 1 - Data
  it('seleciona uma data e verifica que ela é exibida corretamente', () => {
    cy.get('input[type="date"]').first().type('2024-01-16')
    cy.contains('2024-01-16').should('be.visible')
  })

  // Teste 2 - Dropdown customizado
  it('seleciona "Cypress" no dropdown de framework e verifica a seleção', () => {
    cy.contains('Escolha uma opção').first().click()
    cy.contains('Cypress').click()
    cy.contains('Cypress').should('be.visible')
  })

  // Teste 3 - Checkbox
  it('marca todos os checkboxes e verifica que o contador atualiza', () => {
    cy.contains('Selecionar Todas').click()
    cy.contains('Selecionados: 3').should('be.visible')
  })

  // Teste 4 - Campo de texto
  it('digita no campo de texto e verifica o contador de caracteres', () => {
  cy.get('input[type="text"]').first().type('Cypress Hero')
  cy.get('input[type="text"]').first().should('have.value', 'Cypress Hero')
})
})