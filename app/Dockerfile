FROM node:18-alpine

LABEL maintainer="Grupo S07 - DevOps"
LABEL description="Coletor de resultados de testes Cypress"

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "server.js"]