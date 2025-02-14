---
title: "Dockerizando um projeto Node.js"
date: '2023-12-11'
spoiler: "Quanto tempo você perde até fazer um curl localmente?"
---

Um dos princípios para ter um projeto bem estruturado é tornar a configuração inicial tão simples quanto possível. Com menos impedimento para de fato "rodar" o projeto, é possível inserir mais desenvolvedores no fluxo de trabalho de forma acelerada.

Um dos grandes gargalos, sem dúvidas, é montar a infraestrutura necessária, otimizada para o ambiente de desenvolvimento. As práticas e conceitos do mundo DevOps entram para auxiliar e, nesse artigo, vamos abordar docker e conteinerização de um backend feito com Nodejs e mongodb. Além disso, no fim vamos ver uma dica para visualizar melhor os dados.

Primeiro, vamos criar uma aplicação com node. Você pode utilizar algum projeto que já esteja configurado (e, caso o faça, pule pro próximo tópico). Verifique que ele possui um script "start" que possa ser utilizado.

## Iniciando o projeto
Utilizando o yarn:
```bash
$ yarn init
yarn init v1.22.4
question name (example_docker): 
question version (1.0.0): 
question description: A simple backend
question entry point (index.js): 
question repository url: 
question author: jrmmendes <jrmmendes@outlook.com>
question license (MIT): 
question private: 
success Saved package.json
Done in 22.54s.
```
## Instalando pacotes necessários
Vamos instalar o `express.js` (para construir a aplicação) e o `dotenv` (para carregar variáveis de ambiente mais facilmente):
```bash
$ yarn add express dotenv
```
> Numa aplicação real, outros pacotes são de fato importantes, sobre tudo para questões ligadas à segurança de dados. Esse exemplo é apenas ilustrativo.

Além disso, para conexão com o banco de dados, vamos instalar o `mongoose`:
```bash
$ yarn add mongoose
```
## Escrevendo os arquivos da aplicação
Vamos criar o `index.js` com o seguinte conteúdo:
```javascript
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Definição da aplicação
const app = express();
dotenv.config({ path: '.env' });
app.use(express.json());

// Configuração do acesso ao banco de dados
mongoose.connect(process.env.MONGO_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
  console.log('Conectado ao banco de dados');
});

mongoose.connection.on('error', (e) => {
  console.log('Error ao tentar conectar-se ao banco de dados');
  console.error(e);
});

// Rotas de teste
app.route('/ping').all((req, res) => {
  res.status(200).json({ data: 'PONG!' });
});

// Inicialização do servidor
app.listen(process.env.PORT || 3000, () => { 
  console.log('Servidor Iniciado');
});
```
Vamos também criar o arquivo `.env`, com as variáveis de ambiente `PORT` e `MONGO_URI`:
```bash
MONGO_URI="mongodb://root:toor@mongo:27017/development-db?authSource=admin"
```
Por fim, vamos adicionar ao arquivo `package.json` um script `start`, para iniciar o projeto. Ele deve estar assim:
```json
{
  "name": "example_docker",
  "version": "1.0.0",
  "description": "A simple backend",
  "main": "index.js",
  "author": "jrmmendes <jrmmendes@outlook.com>",
  "license": "MIT",
  "dependencies": {
    "dotenv": "^8.2.0",
    "express": "^4.17.1"
  }
}
```
De modo que vamos editá-lo, adicionando uma chave "scripts":
```json
{
  "name": "example_docker",
  "version": "1.0.0",
  "description": "A simple backend",
  "scripts": {
    "start": "node index.js"
  },
  "main": "index.js",
  "author": "jrmmendes <jrmmendes@outlook.com>",
  "license": "MIT",
  "dependencies": {
    "dotenv": "^8.2.0",
    "express": "^4.17.1",
    "mongoose": "^5.9.7"
  }
}
```
Essa é a estrutura que o projeto deve ter no fim:
```
example_docker
├── index.js
├── node_modules
├── package.json
└── yarn.lock
```
# Docker
O ponto de partida será criar um arquivo chamado `Dockerfile`. É nele onde vamos especificar como ocorre o setup da aplicação.

> Caso não esteja familiarizado com os conceitos do Docker, imagine que é uma forma de documentar os passos iniciais para instalar dependências, similar a uma script, mas que é executado de forma mais segura e independente do ambiente do desenvolvedor (desde que seja Linux, nesse caso).

Após isso, iremos configurar os outros serviços relacionados à nossa aplicação (como o banco de dados) e a interação entre eles com o Docker Compose. Aqui já podemos notar um benefício bem clássico dessa abordagem: não será necessário instalar nenhum SGBD no sistema operacional, removendo uma possível fonte de problemas de compatibilidade/configuração. 

## Definição da Aplicação
Vamos criar o arquivo `Dockerfile`. Ele terá a seguinte estrutura:
```Dockerfile
# Imagem base
FROM node:12.16

# Configuração do usuário/permissões
USER node
WORKDIR /home/node/

# Instalação das dependências
COPY package.json .
COPY yarn.lock .
RUN yarn install

# Copia dos arquivos do projeto
COPY . .

# Execução
CMD ["yarn", "start"]
```
Vamos estudar mais a fundo cada parte.
### Base
```Dockerfile
FROM node:12.16
```
No mundo do Docker, existe o **DockerHub**, que funciona de maneira análoga ao Github, nos fornecendo um lugar para enviar e utilizar partes reutilizáveis. Nesse caso, vamos tirar proveito da existência de imagens já configuradas do node, em específico das versões `12.16.x`, nos livrando da necessidade de instalar o próprio node e suas ferramentas, como o yarn.

### Configuração do usuário/permissões
```Dockerfile
USER node
WORKDIR /home/node/
```
Nessa parte, estamos definindo qual usuário será utilizado dentro do contêiner da aplicação. Essa parte é importante para evitar que todos os comandos sejam executados como superusuário (o que, dentre outros impactos, causa um problema de permissões em alguns arquivos, sendo no mínimo inconveniente).

Também alteramos a pasta onde estaremos copiando e executando instruções `RUN`, `COPY`, `ADD`, `CMD` e `ENTRYPOINT`.

### Instalação das dependências
```Dockerfile
COPY package.json .
COPY yarn.lock .
RUN yarn install
```
Aqui instalamos os pacotes que a aplicação necessita. É possível substituir essa fase por algo mais complexo como um `multistage build`, mas isso é algo que não vamos ver nesse artigo.

### Copia dos arquivos do projeto
```Dockerfile
COPY . .
```
Nessa fase os arquivos que escrevemos (`.env`, `index.js`) são copiados para dentro do contêiner. Apenas para ficar claro, estamos copiando da mesma pasta em que o arquivo Dockerfile se encontra para a que definimos com o comando `WORKDIR` (`/home/node`). Vale também lembrar que a segunda se refere ao contêiner, não ao nosso sistema de arquivos normal.

### Execução
```Dockerfile
CMD ["yarn", "start"]
```
Aqui, iniciamos o projeto. Indicamos qual comando deve ser executado após o setup da aplicação.

## Serviços e integração
Para definir os outros serviços e conectar todos os contêineres, além de facilitar a execução do projeto, vamos criar o arquivo `docker-compose.yml`, com o seguinte conteúdo:
```
version: '3'

services:
  api:
    build: 
      dockerfile: ./Dockerfile
      context: .
    volumes:
      - .:/home/node
      - /home/node/node_modules
    ports:
      - 3000:3000
    command: yarn start
    depends_on: 
      - mongo

  mongo-express:
    image: mongo-express
    ports:
      - 8081:8081
    environment:
      ME_CONFIG_BASICAUTH_USERNAME: mendes
      ME_CONFIG_BASICAUTH_PASSWORD: dotmendes
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_MONGODB_ADMINUSERNAME: root
      ME_CONFIG_MONGODB_ADMINPASSWORD: toor
    depends_on:
      - mongo

  mongo:
    image: mongo
    command: [--auth]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: toor
    ports:
      - 27017:27017
    volumes:
      - ./volumes/db:/data/db
```
Explicando de maneira rápida, estamos definindo três serviços: api, mongo e mongo-express. O primeiro é construído a partir do Dockerfile que definimos anteriormente; o seguinte, é criado diretamente da imagem do mongo no Dockerhub (similar ao que fizemos com a imagem do node, contudo não modificamos nada).

O terceiro serviço é uma interface que nos permite visualizar o banco de dados e manusear documentos e coleções.

Existe, por fim, a criação de alguns volumes, que serão utilizados para sincronizar modificações entre os arquivos e o que está dentro do contêiner. Isso é especialmente útil durante o desenvolvimento, para que possamos adicionar novas funcionalidades e testá-las sem que precise ser realizado outro processo de build da aplicação.

# Conclusão
Após criar todos os arquivos, podemos instalar e executar a aplicação com um simples comando:
```bash
$ docker-compose up
```
De modo que teremos como acessar a aplicação em `http://localhost:3000/ping` e a interface do mongo-express em `http://localhost:8081`.