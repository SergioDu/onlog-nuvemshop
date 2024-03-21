import axios from "axios";
import { config } from "dotenv";
import { ClientRepository } from "../entities/Client.js";

config()

const urlGerarToken = 'https://www.tiendanube.com/apps/authorize/token';

const urlNuvem = "https://api.tiendanube.com/v1";

export const gerarToken = async (code) => {
  const objSecret = {
    client_id: process.env.APP_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: "authorization_code",
    code
  }
  const data = await axios.post(urlGerarToken, objSecret, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  const headers = {
    "headers": {
      "Authentication": `bearer ${ data.data.access_token }`,
      "Content-Type": 'application/json'
    },
  }

  const body = {
    "name": "Onlog Express",
    "callback_url": `${process.env.URL_CALLBACK}/calculoFrete`,
    "types": "ship",
  }

  const shippingCarriers = await axios.post(`${urlNuvem}/${data.data.user_id}/shipping_carriers`, body, headers);

  // console.log('shippingCarrier: ', shippingCarriers.data);

  const urlFretes = "https://apponlog.com.br/nuvemshop/frete/disponibilidade"
  const res = await axios.post(urlFretes, "", {
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`
    }
  });

  const fretes = res.data.data;

  fretes.forEach( async (frete) => {
    const urlNuvemOptions = `https://api.tiendanube.com/v1/${data.data.user_id}/shipping_carriers/${shippingCarriers.data.id}/options`;
    const objNuvemOption = {
      code: frete.ModalidadeId,
      name: `${frete.Operador} ${frete.Modalidade}`
    };

    const resOption = await axios.post(urlNuvemOptions, objNuvemOption, {
      headers: {
        Authentication: `bearer ${data.data.access_token}`,
        "Content-Type": "application/json"
      }
    });

    setTimeout(() => {
      console.log('option: ', resOption.data);
    }, 700);
  });

  await axios.post(`${urlNuvem}/${data.data.user_id}/webhooks`, { event: "order/paid", url: `${process.env.URL_CALLBACK}/pedidoPago` }, headers);
}
