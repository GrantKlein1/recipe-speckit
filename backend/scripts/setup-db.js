require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const mysql = require("mysql2/promise");

(async () => {
  const cfg = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PW || "",
    port: Number(process.env.DB_PORT || 3306),
  };

  console.log(
    "Connecting as",
    cfg.user,
    "@",
    `${cfg.host}:${cfg.port}`,
    "password=" + (cfg.password ? "set" : "empty")
  );

  const conn = await mysql.createConnection(cfg);
  await conn.query("CREATE DATABASE IF NOT EXISTS `recipe-speckit_db`");
  await conn.query("CREATE DATABASE IF NOT EXISTS `recipe-speckit_db-test`");
  const [dbs] = await conn.query("SHOW DATABASES LIKE 'recipe-speckit%'");
  console.log(
    "Databases ready:",
    dbs.map((r) => Object.values(r)[0]).join(", ")
  );
  await conn.end();
  console.log("OK");
})().catch((e) => {
  console.error("FAIL", e.code || "", e.message);
  process.exit(1);
});
