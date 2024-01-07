const express = require("express");
const axios = require("axios");
const ConsultaRuc = require("./ComprobantesSunat");
const procesarArchivoExcel = require("./probar");
const cors = require("cors");
const app = express();
const PORT = 5000;

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // El directorio donde se guardarán los archivos
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Usando el nombre original del archivo
  },
});
const upload = multer({ storage: storage });
app.use(cors());
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
    console.error("Error:", error);
    return null;
  }
}
let archivo = null;
async function validarComprobante() {
  try {
    const token = await obtenerToken();
    const data = await archivo;

    if (!token) {
      throw new Error("No se pudo obtener el token");
    }

    const myHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Asegúrate de que necesitas la cookie aquí
      Cookie:
        "TS012c881c=019edc9eb86a210574fef57c676d1807717eb303f3c75f74ae29d2c3e22635b1053d6fddbed86c96d128d99cbb52f83eca87f85027",
    };

    const tamañoLote = 40; // Puedes ajustar este valor
    let resultados = [];
 
    // Usar Promise.all para enviar solicitudes en paralelo
    for (let i = 0; i < data.length; i += tamañoLote) {
      const lote = data.slice(i, i + tamañoLote);
      const promesas = await lote.map((item) => {
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          data: item,
          url: "https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/20611460873/validarcomprobante",
        };
        return axios(requestOptions).then((response) => response.data);
      });

      const resultadosLote = await Promise.all(promesas);
      resultados =  [...resultados, ...resultadosLote];


      // Opcional: pausa entre lotes
      
    }

    return resultados;
  } catch (error) {
    throw error;
  
  }
}
// Ruta para validar el comprobante
let ruc = null;
app.post("/recibir-datos", upload.single("file"), (req, res) => {
  console.log("Archivo recibido:", req.file);
  console.log("Datos adicionales recibidos:", req.body);
  ruc = req.body.ruc;
  archivo = procesarArchivoExcel(req.file.originalname, req.body.ruc);
  res.send("Archivo recibido con éxito");
});
app.get("/validar-comprobante", async (req, res) => {
  if (!archivo) {
    return res.status(400).send("No se ha subido ningún archivo");
  }
  try {
    const resultadoValidacion = await validarComprobante();
    const datosDelRuc = await ConsultaRuc(ruc);
    res.send({ resultadoValidacion, archivo, datosDelRuc });
  } catch (error) {
    
    res.status(500).send({ message: "Error al validar el comprobante" });
  }
});
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en el puerto ${PORT}`);
});
