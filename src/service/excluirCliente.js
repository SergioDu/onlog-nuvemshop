import { ClientRepository } from "../entities/Client.js";

export const deleteClient = async (user_id) => {
  await ClientRepository.destroy({ where: { user_id } });
}
