# DevOps S07 — NP2

Projeto da disciplina **S07 - Gerência de Configuração e Evolução de Software (INATEL)** demonstrando práticas DevOps modernas com Docker, Jenkins e CI/CD.

## 🏗️ Arquitetura

O sistema é composto por **4 containers**:

| Container | Imagem | Origem | Função |
|-----------|--------|--------|--------|
| `jenkins-s07` | `Dockerfile.jenkins` | Build local | CI/CD Pipeline |
| `cypress-s07` | `Dockerfile` | Build local | Testes E2E |
| `nginx-s07` | `nginx:alpine` | Docker Hub | Servidor web |
| `node-app-s07` | `app/Dockerfile` | Build local | API mock |

Os containers `cypress-s07` e `node-app-s07` se comunicam via rede `devops-network`. O Jenkins também acessa o Docker host via socket montado.

### Como sistema, compose e pipeline se conectam

- `docker-compose.yml` sobe o ambiente demonstravel: Jenkins, Nginx, Node app e a imagem Cypress.
- `nginx/html/index.html` e a interface web servida pelo container `nginx-s07` em `http://localhost:80`.
- `app/server.js` e a API mock Express servida pelo container `node-app-s07` em `http://localhost:3000`, com `/health` e `/api/data`.
- No pipeline, a imagem criada pelo `Dockerfile` executa os testes Cypress contra `CYPRESS_BASE_URL=http://nginx:80`, usando o Nginx como alvo da demonstracao.
- O Jenkins executa o build, os testes, o empacotamento do repositorio, o push em `main` e a notificacao por e-mail no bloco `post`, mesmo quando alguma etapa falha.

## 🚀 Instalação e Execução

### Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (para o script de e-mail local)
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/vitordias2004/S07.git
cd S07
```

### 2. Instalar dependências do script de e-mail

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

### 5. Acessar os serviços

| Serviço | URL |
|---------|-----|
| Jenkins | http://localhost:8080 |
| Nginx | http://localhost:80 |
| Node App | http://localhost:3000 |

## ⚙️ Configurando o Pipeline no Jenkins

### Credenciais obrigatórias

Acesse **Jenkins → Manage Jenkins → Credentials** e crie:

| ID da Credential | Tipo | Descrição |
|-----------------|------|-----------|
| `email-remetente` | Secret text | E-mail que vai enviar as notificações |
| `email-destino` | Secret text | E-mail que vai receber as notificações |
| `email-senha` | Secret text | Senha de app do Gmail (não a senha da conta) |
| `docker-hub-credentials` | Username with password | Token de acesso do Docker Hub (username: seu-usuario, password: token de acesso) |

> Para criar uma senha de app no Gmail: Conta Google → Segurança → Verificação em duas etapas → Senhas de app
> Para gerar um token de acesso no Docker Hub: Docker Hub → Account Settings → Personal access tokens → Generate new token (com permissões Read e Write). Use esse token como senha no Jenkins.

### Criar o pipeline

1. Jenkins → **New Item** → Pipeline
2. Em *Pipeline definition*, selecione **Pipeline script from SCM**
3. SCM: Git | URL: `https://github.com/vitordias2004/S07.git`
4. Branch: `main`
5. Script Path: `Jenkinsfile`
6. Salvar e executar

## 🔧 Estrutura do Projeto

```
S07/
├── Dockerfile              # Imagem Cypress (testes E2E)
├── Dockerfile.jenkins      # Jenkins com Node.js + Docker CLI
├── Jenkinsfile             # Pipeline CI/CD, build, testes, artefatos e notificacao
├── docker-compose.yml      # Orquestração dos 4 containers
├── script-email.js         # Notificação por e-mail pós-pipeline
├── package.json            # Dependencia: nodemailer
├── docs/
│   └── plano_de_testes_cypress.pdf
├── app/
│   ├── Dockerfile          # Imagem da API mock
│   ├── package.json
│   └── server.js           # Express: /health, /api/data
├── nginx/
│   └── html/
│       └── index.html      # Página estática servida pelo Nginx
└── testes/
    └── cypress/
        └── e2e/            # Testes Cypress organizados por funcionalidade
```

## 🔄 Pipeline Jenkins

O `Jenkinsfile` contem os stages principais e uma notificacao em `post always`:

1. **Install Email Dependencies** - Executa `npm install --omit=dev` na raiz para instalar o `nodemailer` usado por `script-email.js`.
2. **Build Docker Image** - Gera a imagem Docker usada para executar os testes Cypress.
3. **Testes** - Executa Cypress headless, gera relatorio JUnit e publica no Jenkins.
4. **Build** - Empacota o projeto inteiro em `.tar.gz`, excluindo apenas diretorios gerados como `.git`, `node_modules`, `build` e `test-results`.
5. **Push to Docker Hub** - Sobe a imagem gerada ao Docker Hub quando o branch e `main`.

A notificacao por e-mail nao e stage normal: ela fica no bloco `post { always { ... } }`, por isso e executada mesmo quando build, testes ou push falham.

Artefatos gerados e arquivados:
- `build/app-build-<timestamp>.tar.gz`
- `test-results/cypress-results.xml`

## 📧 Script de E-mail

```bash
# Uso manual (para testes)
node script-email.js \
  --from "remetente@gmail.com" \
  --to "destino@gmail.com" \
  --password "senha-de-app" \
  --status "SUCCESS" \
  --build "42"
```

O endereço de e-mail **nunca está hardcoded** — vem sempre de variáveis de ambiente ou credenciais do Jenkins.

## 🐳 Docker Hub

- **Imagem publicada:** *(adicionar link após publicar)*

```bash
# Publicar manualmente
docker build -t SEU_USER/s07-devops:latest .
docker push SEU_USER/s07-devops:latest
```

## 🧪 Testes

Os testes E2E com Cypress ficam em `testes/cypress/e2e/`.
Os arquivos de spec sao organizados por funcionalidade, e cada caso traz um comentario curto indicando a autoria original do teste.

```bash
# Rodar localmente
cd testes
npm install
npx cypress run         # headless
npx cypress open        # interface interativa
```

Cobertura funcional evidenciada: **100%**, acima da meta **>= 90%**.

Evidencia: existem **7 specs Cypress** versionadas em `testes/cypress/e2e/`, com **20 casos automatizados** cobrindo **10 fluxos funcionais mapeados**. Calculo usado: `10 fluxos cobertos / 10 fluxos mapeados = 100%`. O Jenkins executa esses testes e arquiva o resultado JUnit em `test-results/cypress-results.xml`.

## 🤖 Uso de IA

### Modelos utilizados
- **Claude (Anthropic)** — principal ferramenta usada pelo grupo

### Para quê foi usado
- Geração inicial do `Dockerfile`, `Jenkinsfile` e `docker-compose.yml`
- Debugging de erros de interpolação de variáveis no Jenkinsfile (aspas simples vs duplas no Groovy)
- Correção do `script-email.js` para remover e-mail hardcoded
- Criação do `Dockerfile.jenkins` com Node.js + Docker CLI
- Estruturação deste README

### Exemplos de prompts usados

**Prompt 1** (geração do Jenkinsfile):
> "Crie um Jenkinsfile com 3 stages: execução de testes Cypress, build empacotando em tar.gz e notificação por e-mail. O e-mail não pode ser hardcoded, deve vir de credentials do Jenkins."

Resposta: aceita com ajustes — foi necessário corrigir manualmente as aspas simples que impediam a interpolação de `currentBuild.currentResult`.

**Prompt 2** (bug de interpolação):
> "No meu Jenkinsfile, a variável `${currentBuild.currentResult}` está vindo vazia dentro do sh. Por quê?"

Resposta: aceita — a IA explicou que aspas simples (`'''`) no Groovy não interpolam variáveis e sugeriu usar aspas duplas (`"""`).

**Prompt 3** (Dockerfile do Jenkins):
> "Como faço para instalar Node.js 18 dentro de uma imagem jenkins/jenkins:lts via Dockerfile?"

Resposta: aceita com pequeno ajuste — removemos `libgconf-2-4` que não existe mais no Debian atual.

**Prompt 4** (docker-compose):
> "Tenho 4 containers: Jenkins, Cypress, Nginx e Node app. Como configurar comunicação entre eles e volumes para persistência no docker-compose.yml?"

Resposta: aceita parcialmente — ajustamos os paths dos volumes do Cypress que estavam incorretos.

### O que foi feito à mão (sem IA)
- Escrita dos testes Cypress em `testes/cypress/e2e/`
- Configuração das credentials no Jenkins (feita via interface)
- Decisões de arquitetura: separação app/testes, escolha de `nginx:alpine`, healthchecks
- Commits e organização do repositório por cada membro
- Testes e validação do pipeline rodando de ponta a ponta

---

**INATEL — S07 Gerência de Configuração e Evolução de Software — 2025**
