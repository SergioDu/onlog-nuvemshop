import { Sequelize } from "sequelize";
import pg from 'pg';

const database = process.env.POSTGRESQL_DATABASE;
const user = process.env.POSTGRESQL_USER;
const password = process.env.POSTGRESQL_PASSWORD;
const host = process.env.POSTGRESQL_HOST;
const schema = process.env.POSTGRESQL_SCHEMA;

const client = new Sequelize(database, user, password, {
  host,
  dialect: 'postgres',
  port: 5432,
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true
    }
  }
})

export const ClientRepository = client.define("Clients", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: Sequelize.STRING,
  access_token: Sequelize.STRING,
  token_type: Sequelize.STRING,
  scope: Sequelize.STRING,
  id_shipping_carrier: Sequelize.INTEGER
}, { schema, tableName: "onlog_express_nuvemshop" });
