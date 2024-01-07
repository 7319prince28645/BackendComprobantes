const xlsx = require("xlsx");
const path = require("path");
// Ruta al archivo Excel
function procesarArchivoExcel(filename, ruc) {
  const filePath = path.join(__dirname, `./uploads/${filename}`);
  const workbook = xlsx.readFile(filePath);
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

    let montoFormateado = parseFloat(item.monto).toFixed(2);
    let numeroSerie = item.numeroSerie ? item.numeroSerie.substring(0, 4) : "";
    let numero =
      typeof item.numero === "number"
        ? item.numero
        : item.numero.toString().substring(5);
    if (typeof fechaEmision === "number") {
      fechaEmision = formatDate(ExcelSerialDateToDate(fechaEmision));
    } else if (typeof fechaEmision === "string") {
      fechaEmision = convertirFecha(fechaEmision);
    }

    datos.push({
      numRuc: ruc,
      codComp: item.codComp,
      numeroSerie: numeroSerie,
      numero: `${numero}`,
      fechaEmision: fechaEmision,
      monto: montoFormateado,
    });
    console.log(datos);
  }
  return datos;
}
module.exports = procesarArchivoExcel;
