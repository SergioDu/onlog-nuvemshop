import { Router } from "express";
import { converterOnlogParaNuvemResponse } from "../service/calculoFrete.js";
import { gerarEtiquetaEAtualizarPedido } from "../service/gerarEtiqueta.js";
import { gerarToken } from "../service/criarToken.js";
import { deleteClient } from "../service/excluirCliente.js";

export const routes = Router();

routes.post('/api/v2/nuvemshop/test', (req, res) => {
  res.status(200).send('API FUNCIONANDO');
})

routes.get('/api/v2/nuvemshop/authorization', async (req, res) => {
  try {
    const { code } = req.query;
    await gerarToken(code);
    res.status(200).send('OK');
  } catch (e) {
    res.status(500).json({ message: e.message });
    console.log(JSON.stringify(e));
  }
})

routes.post('/api/v2/nuvemshop/calculoFrete', async (req, res) => {
  try {

    const responseNuvem = await converterOnlogParaNuvemResponse(req.body);
    if (responseNuvem?.status === "error") {
      res.status(500).json({ message: responseNuvem.data });
    } else {
      res.status(200).json(responseNuvem);
    }
  } catch(e) {
    console.log(JSON.stringify(e));
    res.status(500).json({ message: e.message });
  }
});

routes.post('/api/v2/nuvemshop/pedidoPago', async (req, res) => {
  console.log(req.body);

  try {
    const { id, store_id } = req.body;
    await gerarEtiquetaEAtualizarPedido(id.toString().replace(" ", ""), store_id.toString().replace(" ", ""));
    res.status(200).send("OK");
  } catch (e) {
    console.log(JSON.stringify(e));
    res.status(500).json({ message: e.response.data.message });
  }
})

routes.post('/api/v2/nuvemshop/excluirCliente', async (req, res) => {
  const { store_id } = req.body;
  await deleteClient(store_id);
  res.status(200).send('OK');
})