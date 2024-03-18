import express from "express";
import { config } from "dotenv";
import { routes } from "./router/index.js";
import cors from 'cors'
import { ClientRepository } from "./entities/Client.js"

config()

const app = express();
app.use(express.json());
app.use(routes);
app.use(cors());
const port = process.env.PORT || 3001;

const database = process.env.POSTGRESQL_DATABASE;
const user = process.env.POSTGRESQL_USER;
const password = process.env.POSTGRESQL_PASSWORD;
const host = process.env.POSTGRESQL_HOST;
const schema = process.env.POSTGRESQL_SCHEMA;

const dados = {
  host,
  user,
  password,
  schema,
  database
}

console.log(dados)

try {
  // await ClientRepository.sync();
  
  console.log("Tabela sincronizada com sucesso!");
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
} catch (error) {
  console.error("Erro ao sincronizar tabela:", error);
}

