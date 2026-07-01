FROM node:18-alpine

LABEL maintainer="Grupo S07 - DevOps"
LABEL description="Coletor de resultados de testes Cypress"

WORKDIR /app

COPY package.json ./
RUN npm install --production && npm install --save-dev nyc

COPY . .

RUN mkdir -p /data /coverage

EXPOSE 3000

CMD ["npm", "run", "start:coverage"]