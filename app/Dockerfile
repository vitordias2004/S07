FROM node:18-alpine

LABEL maintainer="Grupo S07 - DevOps"
LABEL description="Aplicação Node mock para testes"

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependências
RUN npm install --production

# Copiar código da aplicação
COPY . .

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
