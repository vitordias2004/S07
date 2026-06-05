FROM node:20-slim
LABEL maintainer="Grupo S07 - DevOps"
LABEL description="Imagem customizada para testes Cypress"

RUN apt-get update && apt-get install -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY testes/package.json testes/package-lock.json ./
RUN npm ci

COPY testes/ ./

CMD ["npx", "cypress", "run", "--spec", "cypress/e2e/**/*.cy.js"]
