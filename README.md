# DevOps S07 - NP2

Projeto da disciplina **S07 - Gerencia de Configuracao e Evolucao de Software (INATEL)** para demonstrar um fluxo DevOps com Docker, Jenkins, Cypress, Nginx e uma API mock em Node.js.

## Arquitetura

O ambiente principal usa 4 containers:

| Container | Imagem | Origem | Funcao |
|-----------|--------|--------|--------|
| `jenkins-s07` | `Dockerfile.jenkins` | Build local | CI/CD Pipeline |
| `cypress-s07` | `vitordias2004/s07-devops:latest` | Docker Hub | Ambiente de execucao dos testes E2E |
| `nginx-s07` | `nginx:alpine` | Docker Hub | Dashboard web com historico das notificacoes |
| `node-app-s07` | `app/Dockerfile` | Build local | API mock |

### Como as partes se conectam

- `docker-compose.yml` sobe Jenkins, Cypress, Nginx e Node app na rede `devops-network`.
- O `Jenkins` usa o socket Docker do host para construir imagens e executar o pipeline.
- O `Dockerfile` usa a imagem oficial `cypress/included:15.13.1` como base para evitar problemas de dependencias graficas no ambiente do Jenkins.
- O `app/Dockerfile` sobe a API mock que recebe os resultados enviados pelo Cypress em `/api/results`.
- O `script-email.js` envia os e-mails da pipeline e grava um resumo de cada tentativa em `nginx/html/data/email-history.json`.
- O `nginx` serve `nginx/html/index.html` e publica o historico em `http://localhost:80`.
- Os testes automatizados ficam em `testes/cypress/e2e/` e sao executados pelo pipeline via Cypress headless.

## Instalacao e execucao

### Pre-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ para uso local do `script-email.js`
- Git

### 1. Clonar o repositorio

```bash
git clone https://github.com/vitordias2004/S07.git
cd S07
```

### 2. Instalar dependencias da raiz

```bash
npm install
```

### 3. Subir os containers

```bash
docker-compose up -d
```

### 4. Verificar status

```bash
docker-compose ps
```

### 5. Acessar os servicos

| Servico | URL |
|---------|-----|
| Jenkins | http://localhost:8080 |
| Nginx dashboard | http://localhost:80 |
| Node App | http://localhost:3000 |

## Configurando o pipeline no Jenkins

### Credenciais obrigatorias

Crie estas credentials em **Jenkins -> Manage Jenkins -> Credentials**:

| ID da credential | Tipo | Uso |
|------------------|------|-----|
| `email-remetente` | Secret text | E-mail que enviara a notificacao |
| `email-destino` | Secret text | E-mail que recebera a notificacao |
| `email-senha` | Secret text | Senha de app do Gmail |
| `docker-hub-credentials` | Username with password | Usuario e token do Docker Hub |

Importante para Gmail:

- a conta usada em `email-remetente` precisa estar com verificacao em duas etapas ativada
- o valor de `email-senha` nao deve ser a senha normal da conta
- o valor correto e uma `App Password` de 16 caracteres gerada no Google Account
- se isso nao estiver configurado, o Jenkins falha no envio com erro `534-5.7.9 Application-specific password required`

### Criar o job

1. Jenkins -> **New Item** -> Pipeline
2. Em *Pipeline definition*, selecione **Pipeline script from SCM**
3. SCM: Git
4. URL: `https://github.com/vitordias2004/S07.git`
5. Branch: `main`
6. Script Path: `Jenkinsfile`
7. Salve e execute

## Estrutura do projeto

```text
S07/
|-- Dockerfile
|-- Dockerfile.jenkins
|-- Jenkinsfile
|-- docker-compose.yml
|-- script-email.js
|-- package.json
|-- app/
|   |-- Dockerfile
|   |-- package.json
|   `-- server.js
|-- nginx/
|   `-- html/
|       |-- index.html
|       `-- data/
|           `-- email-history.json
`-- testes/
    |-- package.json
    |-- cypress.config.js
    `-- cypress/
        `-- e2e/
```

## Pipeline Jenkins

O `Jenkinsfile` executa este fluxo:

1. **Checkout**: baixa o codigo do repositario.
2. **Install Email Dependencies**: instala o `nodemailer` na raiz para o script de notificacao.
3. **Build Docker Images**: gera a imagem dos testes Cypress e a imagem do `node-app`.
4. **Testes**: sobe o `node-app` em uma rede Docker isolada, injeta `NODE_APP_URL` no Cypress, executa os specs de `testes/cypress/e2e`, publica o relatorio JUnit e coleta o `results.json`.
5. **Build**: empacota o repositorio em `.tar.gz`, excluindo diretorios gerados.
6. **Push to Docker Hub**: publica a imagem quando a branch e `main`.

No bloco `post { always { ... } }`, o pipeline:

- tenta enviar o e-mail com `script-email.js`
- atualiza `nginx/html/data/email-history.json` mesmo quando o envio falha
- arquiva o `.tar.gz`
- arquiva o XML do Cypress
- arquiva o JSON de resultados coletado pelo `node-app`
- limpa o workspace

Se o envio de e-mail falhar por credencial SMTP, o pipeline registra um aviso, grava a falha no painel do Nginx e segue com o resultado principal da build, sem mascarar o status real dos testes.

### Artefatos arquivados

- `build/app-build-<timestamp>.tar.gz`
- `test-results/cypress-results.xml`
- `node-results/results.json`

## Painel Nginx de notificacoes

O `nginx` agora tem uma funcao direta no projeto: exibir os e-mails enviados pela pipeline.

### Como funciona

- O `docker-compose` monta `./nginx/html/data` dentro do container do Jenkins em `/shared/nginx-data`.
- O `Jenkinsfile` chama o `script-email.js` com `--history-file "/shared/nginx-data/email-history.json"`.
- Depois de cada tentativa, o script grava um registro com:
  - `buildNumber`
  - `status` da build
  - `deliveryStatus` do e-mail (`SENT` ou `FAILED`)
  - `subject`
  - `messageId`
  - `buildUrl`
  - horario do envio
  - remetente e destinatario mascarados
  - mensagem de erro, quando existir
- O `index.html` do Nginx faz `fetch` do JSON e renderiza o historico no browser.

### O que aparece na tela

- status da build
- status do envio do e-mail
- numero da build
- assunto do e-mail
- horario do envio
- link da build, quando disponivel
- remetente e destinatario mascarados
- erro de autenticacao ou transporte, quando houver

## Script de e-mail

Exemplo de uso manual:

```bash
node script-email.js \
  --from "remetente@gmail.com" \
  --to "destino@gmail.com" \
  --password "senha-de-app" \
  --status "SUCCESS" \
  --build "42" \
  --build-url "http://localhost:8080/job/S07/42/" \
  --history-file "./nginx/html/data/email-history.json"
```

O endereco de e-mail nunca fica hardcoded. Ele sempre vem de argumentos ou de variaveis de ambiente. O historico publicado pelo Nginx guarda apenas e-mails mascarados.

## Docker Hub

- Imagem publicada: https://hub.docker.com/r/vitordias2004/s07-devops

```bash
docker build -t vitordias2004/s07-devops:latest .
docker push vitordias2004/s07-devops:latest
```

## Testes

Os testes E2E ficam em `testes/cypress/e2e/`.

### Rodar localmente

```bash
cd testes
npm install
npx cypress run
npx cypress open
```

### Cobertura funcional

- 7 specs Cypress versionadas
- 20 casos automatizados
- 10 fluxos funcionais mapeados
- 100% de cobertura sobre os fluxos definidos

## Uso de IA

Modelos e assistentes foram usados como apoio para:

- estrutura inicial de `Dockerfile`, `Jenkinsfile` e `docker-compose.yml`
- debugging do pipeline Jenkins
- ajuste do `script-email.js`
- organizacao inicial da documentacao

O grupo revisou e ajustou manualmente a integracao final, os testes Cypress, as credenciais e as decisoes de arquitetura.

---

**INATEL - S07 Gerencia de Configuracao e Evolucao de Software - 2025**
