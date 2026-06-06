FROM cypress/included:15.13.1

LABEL maintainer="Grupo S07 - DevOps"
LABEL description="Imagem oficial do Cypress para executar os testes E2E"

WORKDIR /e2e

COPY testes/ ./

CMD ["--spec", "cypress/e2e/**/*.cy.js", "--browser", "electron"]
