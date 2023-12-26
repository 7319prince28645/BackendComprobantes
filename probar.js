const xlsx = require("xlsx");
const path = require("path");
// Ruta al archivo Excel
function procesarArchivoExcel(filename, ruc) {
  const filePath =path.join(__dirname,`./uploads/${filename}`);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  const datos = [];

  for (const item of data.slice(4)) {
    if (typeof item.__EMPTY_1 === "string" && item.__EMPTY_1.includes("/")) {
      const fechaParts = item.__EMPTY_1.split("/");
      if (fechaParts.length === 3) {
        const fechaEmisionFormateada = `${item.__EMPTY_1}`;
        datos.push({
          numRuc: String(ruc),
          codComp: item.__EMPTY_3,
          numeroSerie: item.__EMPTY_4,
          numero: String(item.__EMPTY_5),
          fechaEmision: fechaEmisionFormateada,
          monto: String(item.__EMPTY_18),
        });
        console.log(datos.length);
      } else {
        console.error("Formato de fecha inesperado:", item.__EMPTY_1);
      }
    } else {
      console.error(
        "item.__EMPTY_1 no es un string válido o no tiene el formato esperado"
      );
    }
  }

  return datos;
}

module.exports = procesarArchivoExcel;
