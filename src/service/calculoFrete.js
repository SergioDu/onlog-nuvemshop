import axios from "axios";
import { config } from "dotenv";

config();

const url = "https://apponlog.com.br/nuvemshop/frete/valores";

function pad(num) {
  return num < 10 ? '0' + num : num;
}

function addBusinessDays(businessDays) {
  const startDate = new Date();
  let count = 0;

  while (count < businessDays) {
    startDate.setDate(startDate.getDate() + 1);

    if (startDate.getDay() !== 0 && startDate.getDay() !== 6) {
      count++;
    }
  }

  const timezoneOffset = startDate.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const offsetMinutes = Math.abs(timezoneOffset) % 60;
  const offsetSign = timezoneOffset > 0 ? '-' : '+';

  const formattedDate = startDate.toISOString().replace(/\.\d{3}Z$/, `${offsetSign}${pad(offsetHours)}${pad(offsetMinutes)}`);

  return formattedDate;
}

const converterNuvemParaOnlog = (obj) => {
  const infoProdutos = obj.items.map((item) => {
    const infoOnlog = {
      produtoId: item.product_id,
      nome: item.name,
      largura: parseInt(item.dimensions.width),
      altura: parseInt(item.dimensions.height),
      profundidade: parseInt(item.dimensions.depth),
      peso: item.grams / 1000,
      quantidade: item.quantity,
      preco: item.price
    }
    return infoOnlog
  });

  const usuarioLojaId = obj.store_id;

  const objOnlog = {
    "frete": {
      "idcotacao": 1,
      "cepori": obj.origin.postal_code,
      "cepdes": obj.destination.postal_code,
      "usuarioLojaId": usuarioLojaId,
      "produtos": infoProdutos
    }
  };

  return objOnlog;
}

const calcularFrete = async (body) => {
  const bodyOnlog = converterNuvemParaOnlog(body);
  const response = await axios.post(url, bodyOnlog, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.TOKEN}`
    }
  });
  return response.data
};

export const converterOnlogParaNuvemResponse = async (obj) => {
  const responseOnlog = await calcularFrete(obj);
  if (obj.status === "error") {
    return obj
  }
  const tiposDeEnvioOnlogPraNuvem = responseOnlog.data.Cotacoes.map((elem) => {
    const converteParaNuvem = {
      "name": elem.ModalidadeNome,
      "code": elem.Modalidade.toString(),
      "price": elem.VlTotal,
      "price_merchant": elem.VlTotal,
      "currency": "BRL",
      "type": "ship",
      "min_delivery_date": addBusinessDays(elem.PrazoEntrega),
      "max_delivery_date": addBusinessDays(elem.PrazoEntrega),
      "phone_required": false,
      "reference": `${elem.Operador}-${elem.Modalidade}`
    }
    return converteParaNuvem
  })
  const responseParaNuvem = {
    rates: tiposDeEnvioOnlogPraNuvem
  }

  return responseParaNuvem
}
