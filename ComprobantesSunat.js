async function consultRuc(ruc) {
  const token = "apis-token-6936.MkLDvPnb9xAQiRvcaitjA08RMxqmvQsK";
  const url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`;

  try {
    const resp = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      throw new Error(`¡Error HTTP! estado: ${resp.status}`);
    }

    const data = await resp.json();
    return data;
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    return null;
  }
}


module.exports = consultRuc;