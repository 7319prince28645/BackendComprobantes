const router = require("express").Router();
const upload = require("../controller/files.controller");
const { procesarArchivoExcel, validarComprobante } = require("../service/comprobantes.service")
const ConsultaRuc = require("../service/ruc.service");


router.post("/recibir-datos", upload.single("file"), async (req, res) => {
  const ruc = req.body.ruc;
  if(!req.file){
    return res.status(400).json({message: "No se envió un archivo"});
  }
  if(!ruc){
    return res.status(400).json({message: "No se envió el ruc"});
  }
  
  const data =  procesarArchivoExcel(req.file.buffer, ruc);
  const resultadoValidacion = await validarComprobante(data);
  const datosDelRuc = await ConsultaRuc(ruc);
  res.json({
    message: "El archivo se ha recibido con exito",
    data: {
      data,
      resultadoValidacion,
      datosDelRuc
    }
  });
});

module.exports = router;
