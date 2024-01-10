const express = require("express");
const cors = require("cors");
const mainRouter = require("./router/index.router");
const app = express();
const PORT = 5000;

app.use(cors());

app.use("/", mainRouter);

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en el puerto ${PORT}`);
});
