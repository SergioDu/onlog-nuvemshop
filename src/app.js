import express from "express";
import { config } from "dotenv";
import { routes } from "./router/index.js";
import cors from 'cors'

config()

const app = express();
app.use(express.json());
app.use(routes);
app.use(cors());
const port = 3003;

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

try {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
} catch (error) {
  console.error("Erro ao sincronizar tabela:", error);
}

