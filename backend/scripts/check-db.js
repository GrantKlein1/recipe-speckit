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
    "Trying connect as",
    cfg.user,
    "@",
    `${cfg.host}:${cfg.port}`,
    "password=" + (cfg.password ? "set" : "empty")
  );
  console.log("DB_NAME from env:", process.env.DB_NAME || "(missing)");
  try {
    const conn = await mysql.createConnection(cfg);
    const [rows] = await conn.query("SELECT VERSION() AS v, USER() AS u");
    console.log("OK version", rows[0].v, "as", rows[0].u);
    const [dbs] = await conn.query("SHOW DATABASES LIKE 'recipe-speckit%'");
    console.log(
      "Existing recipe-speckit DBs:",
      dbs.length ? dbs.map((r) => Object.values(r)[0]).join(", ") : "(none)"
    );
    await conn.end();
  } catch (e) {
    console.error("FAIL", e.code || "", e.message);
    process.exit(1);
  }
})();
