const axios = require("axios");

async function consultRuc(ruc) {
  const token = "apis-token-6936.MkLDvPnb9xAQiRvcaitjA08RMxqmvQsK";
  const url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`;

  try {
    const resp = await axios(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return resp.data;
  } catch (error) {
    return null;
  }
}


module.exports = consultRuc;