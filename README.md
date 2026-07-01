# DevOps S07 - NP2

Projeto da disciplina **S07 - Qualidade, Gerência de Config. e Evolução de Software** para demonstrar um fluxo DevOps com Docker, Jenkins, Cypress, Nginx e uma API mock em Node.js.

## Arquitetura

O ambiente principal usa 4 containers:

| Container | Imagem | Origem | Funcao |
|-----------|--------|--------|--------|
| `jenkins-s07` | `Dockerfile.jenkins` | Build local | Pipeline CI/CD |
| `cypress-s07` | `vitordias2004/s07-devops:latest` | Tag local ou Docker Hub | Runner dos testes E2E |
| `nginx-s07` | `nginx:alpine` | Docker Hub | Painel web com o historico das notificacoes |
| `node-app-s07` | `app/Dockerfile` | Build local | API mock para coletar resultados dos testes |

### Como as partes se conectam

- `docker-compose.yml` cria a rede `devops-network` e sobe Jenkins, Cypress, Nginx e Node app.
- O `Jenkins` usa o socket Docker do host para construir imagens e executar o pipeline.
- O `Dockerfile` usa `cypress/included:15.13.1` como base para gerar a imagem dos testes.
- O servico `cypress` do Compose consome a tag `vitordias2004/s07-devops:latest`. Se voce alterar `Dockerfile` ou o conteudo de `testes/`, gere novamente essa tag localmente para que o container reflita o codigo do repositorio.
- O `app/Dockerfile` sobe a API mock que recebe os resultados enviados pelo Cypress em `/api/results`.
- O `script-email.js` envia os e-mails da pipeline e grava um resumo de cada tentativa em `nginx/html/data/email-history.json`.
- O `nginx` serve `nginx/html/index.html` e publica o historico em `http://localhost:80`.
- Os testes automatizados ficam em `testes/cypress/e2e/` e, apos cada caso, enviam um resumo para o `node-app`.

## Instalacao e execucao

### Pre-requisitos

- Docker 20.10+
- Docker Compose v2 com o comando `docker compose`
- Git
- Node.js 18+ apenas para uso local do `script-email.js`, do `node-app` ou do Cypress fora do Docker

### 1. Clonar o repositorio

```bash
git clone https://github.com/vitordias2004/S07.git
cd S07
```

### 2. Opcional: instalar dependencias da raiz

Esse passo so e necessario para usar o `script-email.js` manualmente fora do Jenkins.

```bash
npm install
```

### 3. Opcional: instalar dependencias dos testes para uso local

Esse passo so e necessario para rodar o Cypress fora do container.

```bash
cd testes
npm install
cd ..
```

### 4. Gerar a imagem local do Cypress

O Compose referencia a tag `vitordias2004/s07-devops:latest`. Gere essa imagem localmente para evitar divergencia entre o repositorio e o que o container `cypress-s07` executa.

```bash
docker build -t vitordias2004/s07-devops:latest .
```

### 5. Subir os containers

```bash
docker compose up -d --build
```

Observacoes:

- `--build` reconstrui os servicos com `build` definido no Compose, como Jenkins e `node-app`.
- O servico `cypress` nao expoe interface web. Ele e um runner de testes baseado na imagem `vitordias2004/s07-devops:latest`.
- Se voce quiser subir apenas a infraestrutura e deixar o Cypress de fora, use `docker compose up -d jenkins nginx node-app`.

### 6. Verificar status

```bash
docker compose ps
```

### 7. Acessar os servicos

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

Importante sobre variaveis locais:

- o arquivo `.env.example` e apenas uma referencia de configuracao local
- o pipeline Jenkins usa `credentials(...)` no `Jenkinsfile`, nao o `.env` da raiz

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
|-- .env.example
|-- script-email.js
|-- package.json
|-- docs/
|   `-- plano_de_testes_cypress.pdf
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
    |-- package-lock.json
    |-- cypress.config.js
    `-- cypress/
        |-- e2e/
        `-- support/
```

## Pipeline Jenkins

O `Jenkinsfile` executa este fluxo:

1. **Checkout**: baixa o codigo do repositario.
2. **Install Email Dependencies**: instala o `nodemailer` na raiz para o script de notificacao.
3. **Build Docker Images**: gera a imagem dos testes Cypress via `Dockerfile` e a imagem do `node-app` via `app/Dockerfile`.
4. **Testes**: sobe o `node-app` em uma rede Docker isolada, injeta `NODE_APP_URL` no Cypress, executa os specs de `testes/cypress/e2e`, publica o relatorio JUnit e coleta o `results.json` produzido pela API mock.
5. **Build**: empacota o repositorio em `.tar.gz`, excluindo diretorios gerados.
6. **Push to Docker Hub**: publica a imagem quando a branch e `main`, usando as tags `${BUILD_NUMBER}` e `latest`.

No bloco `post { always { ... } }`, o pipeline:

- tenta enviar o e-mail com `script-email.js`
- atualiza `nginx/html/data/email-history.json` mesmo quando o envio falha
- arquiva o `.tar.gz`
- arquiva todos os XMLs JUnit do Cypress
- arquiva o JSON de resultados coletado pelo `node-app`
- limpa o workspace

Se o envio de e-mail falhar por credencial SMTP, o pipeline registra um aviso, grava a falha no painel do Nginx e segue com o resultado principal da build, sem mascarar o status real dos testes.

### Artefatos arquivados

- `build/app-build-<timestamp>.tar.gz`
- `test-results/cypress-results-*.xml`
- `node-results/results.json`

Observacao:

- no `docker-compose.yml`, o volume nomeado `test-results` persiste o arquivo `/data/results.json` do `node-app`
- no Jenkins, a pasta de workspace `test-results/` guarda os XMLs JUnit do Cypress

## Node App API

O `node-app` exposto em `http://localhost:3000` fornece estes endpoints:

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `GET` | `/` | Retorna metadados do servico e a lista de endpoints |
| `GET` | `/health` | Healthcheck da aplicacao |
| `POST` | `/api/results` | Registra o resultado de um caso de teste |
| `GET` | `/api/results` | Retorna resumo agregado e lista completa de resultados |
| `DELETE` | `/api/results` | Limpa o historico salvo em `/data/results.json` |

Payload esperado no `POST /api/results`:

```json
{
  "title": "nome do teste",
  "status": "passed",
  "suite": "Playground - autenticacao",
  "duration": 1234,
  "error": null
}
```

Campos obrigatorios:

- `title`
- `status`

## Painel Nginx de notificacoes

O `nginx` tem uma funcao direta no projeto: exibir os e-mails enviados pela pipeline.

### Como funciona

- O `docker-compose` monta `./nginx/html/data` dentro do container do Jenkins em `/shared/nginx-data`.
- O `Jenkinsfile` exporta `EMAIL_HISTORY_FILE=/shared/nginx-data/email-history.json` antes de chamar `node script-email.js`.
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
- O `index.html` do Nginx faz `fetch` do JSON, renderiza o historico no browser e atualiza a tela automaticamente a cada 30 segundos.

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

O `script-email.js` pode ser usado de duas formas:

- manualmente, via argumentos de linha de comando
- automaticamente, pelo Jenkins, via variaveis de ambiente

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
- O Compose usa a tag `latest`
- O pipeline publica `${BUILD_NUMBER}` e tambem atualiza `latest`

```bash
docker build -t vitordias2004/s07-devops:latest .
docker push vitordias2004/s07-devops:latest
```

## Testes

Os testes E2E ficam em `testes/cypress/e2e/` e exercitam o site `https://playground-for-qa.vercel.app/playground`.

### Rodar localmente

1. Deixe o coletor de resultados disponivel em `http://localhost:3000`, por exemplo com `docker compose up -d node-app`.
2. Instale as dependencias dos testes em `testes/`, caso ainda nao existam.
3. Execute `npx cypress run` ou `npx cypress open` dentro de `testes/`.
4. Se o coletor estiver em outra URL, defina `NODE_APP_URL` antes de abrir o Cypress.

Exemplo:

```bash
cd testes
npm install
npx cypress run
npx cypress open
```

Observacao:

- apos cada teste, o Cypress envia um `POST /api/results` para o `node-app`
- se o `node-app` nao estiver acessivel, os testes ainda executam, mas o registro consolidado de resultados nao sera coletado pela API mock

### Cobertura funcional

- 7 specs Cypress versionadas
- 20 casos automatizados
- o mapeamento funcional detalhado esta em `docs/plano_de_testes_cypress.pdf`

## Uso de IA

A IA foi usada como apoio tecnico iterativo durante o projeto, mas o trabalho nao se limitou a uma unica ferramenta. Ao longo do desenvolvimento, o grupo usou principalmente **Claude (Anthropic)** como apoio nas etapas iniciais e intermediarias, e o historico local desta maquina tambem registra uso de **Codex** nas etapas finais de integracao, debugging, revisao do pipeline e atualizacao do `README`.

### Ferramentas e contexto

- **Claude (Anthropic)** foi uma das principais ferramentas usadas pelo grupo ao longo do projeto
- **Codex** foi usado especialmente na fase final para revisar o estado real do repositorio, interpretar logs do Jenkins, integrar o `node-app`, reaproveitar o `nginx` e alinhar a documentacao com o codigo
- a IA foi usada como apoio de engenharia e documentacao, nao como substituta da implementacao e da validacao humana

### Como a IA foi usada neste projeto

- geracao inicial de `Dockerfile`, `Jenkinsfile` e `docker-compose.yml`
- debugging de erros do Jenkins, incluindo interpolacao de variaveis no Groovy
- correcao do `script-email.js` para evitar informacoes hardcoded
- criacao e ajuste do `Dockerfile.jenkins`
- sugestao e implementacao assistida de ajustes em Docker, Jenkins, Cypress, Node.js e documentacao
- leitura e comparacao de arquivos como `Dockerfile`, `Dockerfile.jenkins`, `Jenkinsfile`, `docker-compose.yml`, `README.md`, `app/server.js` e specs Cypress
- analise de `git diff`, historico de commits e logs reais do Jenkins trazidos para as conversas
- explicacao do funcionamento do pipeline e da arquitetura para apoiar a defesa do projeto

### Exemplos de prompts usados

Os exemplos abaixo foram levemente normalizados e tiveram dados sensiveis omitidos quando necessario.

- `Crie um Jenkinsfile com stages de testes Cypress, build empacotando em tar.gz e notificacao por e-mail. O e-mail nao pode ser hardcoded e deve vir de credentials do Jenkins.`
- `No meu Jenkinsfile, a variavel ${currentBuild.currentResult} esta vindo vazia dentro do sh. Por que?`
- `Como faco para instalar Node.js 18 dentro de uma imagem jenkins/jenkins:lts via Dockerfile?`
- `Tenho 4 containers: Jenkins, Cypress, Nginx e Node app. Como configurar comunicacao entre eles e volumes para persistencia no docker-compose.yml?`
- `Quero saber como esta o projeto... nao faca nenhuma mudanca ainda, quero saber o que falta fazer ou se tem algo que foi implementado incorretamente`
- `em testes\\cypress\\e2e os testes estao separados pelo nome de quem fez... foque o arquivo na funcionalidade testada e mantenha comentarios indicando quem fez`
- `Como configurar o Jenkins... falta criar um job no Jenkins, me passe um passo a passo de acordo com o projeto`
- `Precisamos usar esse nginx para alguma coisa. Quero que ele mostre os e-mails enviados pela pipeline, faca a mudanca e corrija a documentacao`
- `Integre o node-app ao pipeline`
- `O README.md do projeto esta correto? Ele documenta corretamente? Ele pode estar defasado em algum aspecto, investigue`

### Como as respostas foram aproveitadas

- a sugestao inicial do `Jenkinsfile` foi aproveitada com ajustes manuais, porque foi necessario corrigir detalhes de interpolacao e comportamento real do pipeline
- a explicacao sobre aspas simples e duplas no Groovy foi aproveitada para corrigir a interpolacao de `currentBuild.currentResult`
- a orientacao para montar o `Dockerfile.jenkins` foi aproveitada com pequenos ajustes de compatibilidade do ambiente
- sugestoes de `docker-compose.yml` foram aceitas parcialmente e depois adaptadas aos paths, volumes e servicos reais do projeto
- respostas sobre logs e falhas foram usadas como apoio ao diagnostico, mas sempre validadas no codigo, no terminal e no Jenkins

### Exemplos de problemas analisados com ajuda da IA

- falhas reais do Jenkins e do Cypress, incluindo casos de `Cypress verification timed out` e stages puladas no `Push to Docker Hub`
- divergencias entre a tag `latest` usada no Compose e o comportamento descrito pelo codigo versionado
- necessidade de injetar `NODE_APP_URL`, coletar `results.json` e arquivar evidencias da pipeline
- necessidade de transformar o `nginx` em um componente visivel do projeto, exibindo o historico de notificacoes

### O que foi feito a mao pelo grupo

- escrita dos testes Cypress em `testes/cypress/e2e/`
- configuracao das credentials e variaveis de ambiente no Jenkins
- geracao e configuracao do PAT do Docker Hub
- geracao da `App Password` do Google para envio de e-mails
- preenchimento dos valores reais de `email-remetente`, `email-destino`, `email-senha` e `docker-hub-credentials`
- decisoes de arquitetura, como a separacao entre app, testes, Jenkins, Nginx e API mock
- commits, organizacao do repositorio e execucao de `git pull`, builds e validacoes da pipeline
- testes e validacao do pipeline rodando de ponta a ponta

### Revisao humana e limites

- a equipe revisou o codigo gerado, escolheu as decisoes finais de arquitetura e validou o comportamento com leitura de logs, diffs e execucoes locais
- exemplos de credenciais, tokens e dados pessoais nao devem ser mantidos em prompts, commits ou documentacao publica
- a responsabilidade final pelo codigo, pela pipeline e pela documentacao permaneceu com o grupo

---

**INATEL - S07 - Qualidade, Gerência de Config. e Evolução de Software**
