# Projeto de Testes com Cypress

Este repositorio contem um projeto de automacao de testes com Cypress.

## Requisitos na maquina

- Git instalado
- Node.js LTS instalado (recomendado: Node 18 ou superior)

Para conferir se esta tudo certo:

```bash
git --version
node --version
npm --version
```

## Como clonar e preparar o projeto

1. Clone o repositorio:

```bash
git clone <URL_DO_REPOSITORIO>
```

2. Entre na pasta do projeto:

```bash
cd S07
```

3. Entre na pasta de testes:

```bash
cd testes
```

4. Instale as dependencias:

```bash
npm install
```

## Como executar os testes

Modo interativo (abre a interface do Cypress):

```bash
npx cypress open
```

Modo terminal (headless):

```bash
npx cypress run
```

## Como criar novos testes

1. Crie um novo arquivo em `testes/cypress/e2e/` com o padrao:

```text
nome-do-teste.cy.js
```

2. Escreva seus cenarios usando `describe` e `it`.

3. Execute com `npx cypress open` para validar.

4. Ao finalizar, atualize a secao "Responsaveis por teste" deste README.

## Estrutura principal

```text
testes/
  cypress/
    e2e/
      playground.cy.js
    fixtures/
    support/
  cypress.config.js
  package.json
```

## Responsaveis por teste

| Arquivo de teste | Responsavel |
| --- | --- |
| `testes/cypress/e2e/playground_vitor.cy.js` | Vitor |

## Observacoes

- A pasta `node_modules/` nao deve ser versionada.
- Se forem gerados artefatos pelo Cypress, mantenha o `.gitignore` atualizado para ignorar videos e screenshots.