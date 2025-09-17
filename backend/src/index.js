const express = require("express");
const path = require("path");
const apiRoutes = require("./routes");
require("./config/db");

const app = express();
app.use(express.json());

const clientDist = path.join(__dirname, "../../../frontend/dist");
app.use(express.static(clientDist));

app.use("/api", apiRoutes);

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

if (require.main === module) {
  const PORT = 3000;
  app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
}

module.exports = app;