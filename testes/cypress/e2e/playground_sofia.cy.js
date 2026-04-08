//testes criados usando claude sonnet 4.6 (browser)

describe('Cypress Playground - Testes Sofia (de sucesso)', () => {
  beforeEach(() => {
    const date = new Date(Date.UTC(1982, 3, 15))
    cy.clock(date)
    cy.visit('https://cypress-playground.s3.eu-central-1.amazonaws.com/index.html')
  })

 it('seleciona uma data e verifica que ela é exibida corretamente', () => {
  cy.get('#input-date input[type="date"]')
    .type('2024-01-16')
    .blur()

  cy.contains('#input-date p#date-paragraph', "The date you've selected is: 2024-01-16")
    .should('be.visible')
})

  it('seleciona apenas "Apple" no dropdown de múltipla seleção e verifica a mensagem', () => {
    cy.contains('p', "You haven't selected any fruit yet.")
    cy.get('#select select[multiple]').select(['Apple'])
    cy.contains('p', "You've selected the following fruits: apple")
  })

  it('digita uma assinatura, marca o checkbox e confirma que o preview é exibido', () => {
    const assinatura = 'Cypress Hero'
    cy.get('#check textarea').type(assinatura)
    cy.get('#check input[type="checkbox"]').check()
    cy.contains('#check em', assinatura).should('be.visible')
  })

  it('seleciona o nível 5 no input range e confirma a mensagem correta', () => {
    const nivel = 5
    cy.get('#input-range input[type="range"]')
      .invoke('val', nivel)
      .should('have.value', String(nivel))
      .trigger('change')
    cy.contains('#input-range p', `You're on level: ${nivel}`)
      .should('be.visible')
  })
})