//Testes criados usando chatGPT 5.3 (browser) menos os de texto, esses eu fiz mesmo

Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})

describe('Teste no Playground QA', () => {
  it('Deve carregar a página corretamente', () => {
    cy.visit('https://playground-for-qa.vercel.app/playground')

    cy.contains('Playground').should('be.visible')
  })
})

describe('Teste do botão Clique aqui', () => {
  it('Deve exibir o botão', () => {
    
    cy.visit('https://playground-for-qa.vercel.app/playground')

    cy.get('[data-testid="click-button"]')
      .should('be.visible')
  })
})

it('Deve aumentar o contador corretamente', () => {
  cy.visit('https://playground-for-qa.vercel.app/playground')

  cy.get('[data-testid="click-button"]')
    .invoke('text')
    .then((textoAntes) => {

      const numeroAntes = parseInt(textoAntes.match(/\d+/)[0])

      cy.get('[data-testid="click-button"]').click()

      cy.get('[data-testid="click-button"]')
        .invoke('text')
        .then((textoDepois) => {
          const numeroDepois = parseInt(textoDepois.match(/\d+/)[0])

          expect(numeroDepois).to.eq(numeroAntes + 1)
        })
    })
})

describe('Teste de duplo clique com validação', () => {

  it('Deve alterar o contador ao dar double click', () => {

    Cypress.on('uncaught:exception', () => false)

    cy.visit('https://playground-for-qa.vercel.app/playground')

    cy.get('[data-testid="double-click-button"]')
      .invoke('text')
      .then((textoAntes) => {

        const numeroAntes = parseInt(textoAntes.match(/\d+/)[0])

        cy.get('[data-testid="double-click-button"]').dblclick()

        cy.get('[data-testid="double-click-button"]')
          .invoke('text')
          .then((textoDepois) => {

            const numeroDepois = parseInt(textoDepois.match(/\d+/)[0])

            expect(numeroDepois).to.not.equal(numeroAntes)
          })
      })

  })

})

//Eu que fiz
describe('Teste do input de texto', () => {

  it('Deve permitir digitação', () => {

    Cypress.on('uncaught:exception', () => false)

    cy.visit('https://playground-for-qa.vercel.app/playground')

    cy.get('[data-testid="text-input"]')
      .should('be.visible')
      .type('Teste Cypress')
      .should('have.value', 'Teste Cypress')

  })

})

//Eu que fiz
describe('Teste de digitação e output', () => {

  it('Deve refletir o texto digitado', () => {

    Cypress.on('uncaught:exception', () => false)

    cy.visit('https://playground-for-qa.vercel.app/playground')

    const texto = 'Teste Cypress'

    cy.get('[data-testid="text-input"]')
      .type(texto)
      .should('have.value', texto)

  })

})
it('Deve exibir placeholder correto', () => {

  cy.visit('https://playground-for-qa.vercel.app/playground')

  cy.get('[data-testid="text-input"]')
    .should('have.attr', 'placeholder', 'Digite algo...')

})