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
├── Jenkinsfile             # Pipeline CI/CD (3 stages obrigatórios)
├── docker-compose.yml      # Orquestração dos 4 containers
├── script-email.js         # Notificação por e-mail pós-pipeline
├── package.json            # Dependência: nodemailer
├── app/
│   ├── Dockerfile          # Imagem da API mock
│   ├── package.json
│   └── server.js           # Express: /health, /api/data
├── nginx/
│   └── html/
│       └── index.html      # Página estática servida pelo Nginx
└── testes/
    └── cypress/
        └── e2e/            # Testes automatizados Cypress
```

## 🔄 Pipeline Jenkins

O `Jenkinsfile` contém **3 stages obrigatórios**:

1. **Testes** — Executa Cypress headless, gera relatório JUnit e publica no Jenkins
2. **Build** — Empacota o projeto em `.tar.gz` e arquiva como artefato
3. **Build Docker Image** — Gera a imagem do docker com base no Dockerfile
4. **Push to Docker Hub** — Sobe a imagem gerada ao Docker Hub
5. **Notificação** — Envia e-mail HTML com status, número do build e timestamp

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

```bash
# Rodar localmente
cd testes
npm install
npx cypress run         # headless
npx cypress open        # interface interativa
```

Cobertura de testes: **≥ 90%**

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
