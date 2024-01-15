const xlsx = require("xlsx");
const axios = require("axios");

function procesarArchivoExcel(buffer, ruc) {
  const workbook = xlsx.read(buffer);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  const datos = [];
  function ExcelSerialDateToDate(serial) {
    // Fecha base de Excel (1 de enero de 1900)
    const excelBaseDate = new Date(1900, 0, 1);

    // Corregir el bug de Excel que cuenta el año 1900 como bisiesto
    const dayCorrection = serial > 60 ? -2 : -1;

    // Convertir el número serial en milisegundos
    const milliseconds = (serial + dayCorrection) * 86400000; // Días a ms

    // Crear la nueva fecha
    const date = new Date(excelBaseDate.getTime() + milliseconds);

    return date;
  }
  function convertirFecha(fechaConHora) {
    const [fecha, hora] = fechaConHora.split(" ");
    // Verifica si la fecha coincide con el formato YYYY-MM-DD o YYYY/MM/DD
    const regex = /^(\d{4})[-/](\d{2})[-/](\d{2})$/;
    const matches = fecha.match(regex);

    if (matches) {
      // Extrae las partes de la fecha
      const year = matches[1];
      const month = matches[2];
      const day = matches[3];

      // Convierte formato DD/MM/YYYY
      return `${day}/${month}/${year}`;
    }

    // Si no es un formato reconocido, devuelve la fecha original
    return fechaConHora;
  }
  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Enero es 0
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  for (const item of data) {
    let fechaEmision = item.fechaEmision;
    let codComp =
      typeof item.codComp === "number" ? `0${item.codComp}` : item.codComp;
    let montoFormateado = parseFloat(item.monto).toFixed(2);
    let numeroSerie = item.numeroSerie ? item.numeroSerie.substring(0, 4) : "";
    let numero =
      typeof item.numero === "number"
        ? item.numero
        : item.numero
        ? item.numero.toString().substring(5)
        : "";
    if (typeof fechaEmision === "number") {
      fechaEmision = formatDate(ExcelSerialDateToDate(fechaEmision));
    } else if (typeof fechaEmision === "string") {
      fechaEmision = convertirFecha(fechaEmision);
    }

    datos.push({
      numRuc: ruc,
      codComp: codComp,
      numeroSerie: numeroSerie,
      numero: `${numero}`,
      fechaEmision: fechaEmision,
      monto: montoFormateado,
    });
  }
  return datos;
}
async function obtenerToken() {
  try {
    const myHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie:
        "BIGipServerpool-e-plataformaunica-https=!iOqrTIlreGRzJI3GcbIyeUf4pF1JTCenl0LUIzNkcyoDeYerD2gIgp/54aqSBZzYoKVAvcRNvsAHWg==; TS019e7fc2=014dc399cbfb7a0c02e6c123359aa042c2a11c569f9f045ae58a2f7a41f4eeb6332bdf4b33c9d4e59e945c78dd28f9ae4e04baba04",
    };

    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    urlencoded.append(
      "scope",
      "https://api.sunat.gob.pe/v1/contribuyente/contribuyentes"
    );
    urlencoded.append("client_id", "06f30e41-1c42-4e1a-abbe-7d849af8aa93");
    urlencoded.append("client_secret", "1Hl9NyUHA8m/cJX1/fw5/g==");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      data: urlencoded,
      url: "https://api-seguridad.sunat.gob.pe/v1/clientesextranet/06f30e41-1c42-4e1a-abbe-7d849af8aa93/oauth2/token/",
    };

    const response = await axios(requestOptions);
    return response.data.access_token;
  } catch (error) {
    return null;
  }
}

async function solicitarConReintento(item, myHeaders, intentosMaximos = 5) {
  try {
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      data: item,
      url: "https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/20611460873/validarcomprobante",
    };
    const response = await axios(requestOptions);
    if (
      response.data &&
      Object.keys(response.data).length === 0 &&
      intentosMaximos > 0
    ) {
      console.log("Data vacío, intentando de nuevo...");
      return solicitarConReintento(item, myHeaders, intentosMaximos - 1);
    }
    return response.data;
  } catch (error) {
    console.error(error);
    if (intentosMaximos > 0) {
      console.log("Error en la solicitud, intentando de nuevo...");
      return solicitarConReintento(item, myHeaders, intentosMaximos - 1);
    }
    // Devuelve un objeto de error o null para que puedas identificarlo después
    return { error: true, item };
  }
}

async function validarComprobante(data) {
  try {
    const token = await obtenerToken();

    if (!token) {
      throw new Error("No se pudo obtener el token");
    }

    const myHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Asumiendo que la cookie es necesaria aquí
      Cookie:
        "TS012c881c=019edc9eb86a210574fef57c676d1807717eb303f3c75f74ae29d2c3e22635b1053d6fddbed86c96d128d99cbb52f83eca87f85027",
    };

    const tamañoLote = 20; // Ajusta según sea necesario
    let resultados = [];

    for (let i = 0; i < data.length; i += tamañoLote) {
      const lote = data.slice(i, i + tamañoLote);
      const promesas = lote.map((item) =>
        solicitarConReintento(item, myHeaders)
      );

      const resultadosLote = await Promise.all(promesas);
      resultados = resultados.concat(resultadosLote.filter((r) => !r.error));

      // Opcional: pausa entre lotes
      // await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("resultados", resultados);
    return resultados;
  } catch (error) {
    console.error("Error en validarComprobante: ", error);
    throw error;
  }
}

module.exports = {
  validarComprobante,
  obtenerToken,
  procesarArchivoExcel,
};
