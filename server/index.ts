import "./env";
import app from "./app";
process.env.NODE_ENV ||= "production";
const port = Number(process.env.API_PORT || process.env.PORT || 4000);
app.listen(
  port,
  process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
  () => console.log(`Backend ready at http://localhost:${port}`),
);
