import axios from "axios";
import { config } from "dotenv";

config();

const urlNuvem = "https://api.tiendanube.com/v1";
const urlOnlog = "https://apponlog.com.br/nuvemshop/pedido/incluirpedido"

const pegarPedidoNuvem = async (id, user_id) => {
  const dataClient = await pegarIntegracaoOnlog(user_id);

  console.log(dataClient);

  const response = await axios.get(`${urlNuvem}/${user_id}/orders/${id}`, {
    "headers": {
      "Authentication": `Bearer ${dataClient.data.tokenLoja}`
    }
  });

  console.log(response.data);

  return response.data;
}

const converterPedidoPraOnlog = async (id, user_id) => {
  const data = await pegarPedidoNuvem(id, user_id);
  const separaOperadorEModalidade = data.shipping_option_reference.split('-').map(Number);

  const operador = separaOperadorEModalidade[0];
  const modalidade = separaOperadorEModalidade[1];

  const dataClient = await pegarIntegracaoOnlog(user_id);

  const loja = await axios.get(`${urlNuvem}/${data.store_id}/store`, {
    "headers": {
      "Authentication": `bearer ${dataClient.data.tokenLoja}`
    }
  });

  const searchLocations = await axios.get(`${urlNuvem}/${data.store_id}/locations`, {
    "headers": {
      "Authentication": `bearer ${dataClient.data.tokenLoja}`
    }
  });

  let remetente = []

  if (searchLocations.data.length > 1) {
    const getLocationInOrder = await axios.get(`${urlNuvem}/${data.store_id}/orders/${id}/fulfillment-orders`, {
      "headers": {
        "Authentication": `bearer ${dataClient.data.tokenLoja}`
      }
    });
    const getLocation = await axios.get(`${urlNuvem}/${data.store_id}/locations/${getLocationInOrder.data[0].assigned_location.location_id}`, {
      "headers": {
        "Authentication": `bearer ${dataClient.data.tokenLoja}`
      }
    });
    remetente.push(getLocation.data);
  } else {
    remetente = searchLocations
  }

  const destinatario = data.shipping_address;

  const pegarEndereco = await axios.get(`https://viacep.com.br/ws/${destinatario.zipcode}/json/`)

  const lojaEndereco = await axios.get(`https://viacep.com.br/ws/${remetente.data[0].address.zipcode}/json/`);

  const endereco = pegarEndereco.data;

  const enderecoRemetente = lojaEndereco.data;

  const volumeProdutos = data.products.map((prod) => {
    const objOnlog = {
      "altura": prod.height,
      "largura": prod.width,
      "profundidade": prod.depth,
      "peso": prod.weight,
      "valorDeclarado": prod.price,
      "quantidade": prod.quantity,
      "codigoVolume": prod.id.toString()
    }
    return objOnlog
  })

  const objOnlog = {
    "idOperador": operador,
    "idModalidade": modalidade,
    "pedido": data.number,
    "obs": "",
    "remetente": {
      "nome": loja.data.business_name,
      // "telefonePrincipal": loja.data.phone,
      "telefonePrincipal": "",
      "emailPrincipal": loja.data.email,
      "cpfCnpj": loja.data.business_id,
      "rgIe": "", //Tem que colocar caso for CNPJ
      "cep": remetente.data[0].address.zipcode,
      "logradouro": enderecoRemetente.logradouro.split(" ")[0] || remetente.data[0].address.locality,
      "endereco": enderecoRemetente.logradouro || remetente.data[0].address.street,
      "numero": remetente.data[0].address.number,
      "complemento": remetente.data[0].address.floor,
      "bairro": enderecoRemetente.bairro || remetente.data[0].address.locality,
      "cidade": enderecoRemetente.localidade || remetente.data[0].address.city,
      "uf": enderecoRemetente.uf || remetente.data[0].address.province.code
    },
    "destinatario": {
      "nome": destinatario.name,
      "telefonePrincipal": destinatario.phone,
      "telefoneOpcional": "",
      "emailPrincipal": "",
      "emailSecundario": "",
      "cpfCnpj": data.contact_identification || data.costumer.identification,
      "rgIe": "", //Tem que colocar caso for CNPJ
      "cep": destinatario.zipcode,
      "logradouro": endereco.logradouro.split(" ")[0],
      "endereco": endereco.logradouro,
      "numero": destinatario.number,
      "complemento": destinatario.floor,
      "bairro": endereco.bairro,
      "cidade": endereco.localidade,
      "uf": endereco.uf
    },
    "volume": volumeProdutos,
    "dfe": {
      "cfop": "",
      "danfeCte": "",
      "nrDoc": "",
      "serie": "",
      "tpDocumento": "",
      "valor": ""
    }
  }

  return objOnlog;
}

const gerarEtiquetaOnlog = async (id, user_id) => {
  const convertParaOnlog = await converterPedidoPraOnlog(id, user_id)
  const response = await axios.post(urlOnlog, convertParaOnlog, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.TOKEN}`
    }
  });
  return response.data
}

const pegarIntegracaoOnlog = async (user_id) => {
  const { data } = await axios.post("https://apponlog.com.br/nuvemshop/integracao/listar", { usuarioId: user_id }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.TOKEN}`
    }
  });

  return data;
}

export const gerarEtiquetaEAtualizarPedido = async (id, user_id) => {
  const dataClient = await pegarIntegracaoOnlog(user_id);
  const responseOnlog = await gerarEtiquetaOnlog(id, user_id);
  const objAttPedido = {
    shipping_tracking_url: `https://onlog.app.br/rastreio/${responseOnlog.data.postagens[0].objeto}`,
    shipping_tracking_number: responseOnlog.data.postagens[0].objeto
  }
  await axios.post(`${urlNuvem}/${user_id}/orders/${id}/fulfill`, objAttPedido, {
    "headers": {
      "Authentication": `bearer ${dataClient.data.tokenLoja}`,
      "Content-Type": 'application/json'
    }
  });
}
