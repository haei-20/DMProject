const express = require("express");
const app = express();

const PORT = parseInt(process.env.PORT, 10);
if (!PORT) {
  console.error("process.env.PORT not set");
  process.exit(1);
}

app.get("/", (req, res) => res.send("Api is running"));

app.listen(PORT, () => {
  console.log(`Api running on port ${PORT}`);
});
