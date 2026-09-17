const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, "..", ".env.test");
const examplePath = path.join(__dirname, "..", ".env.test.example");

dotenv.config({ path: examplePath });
dotenv.config({ path: envPath, override: true });

process.env.NODE_ENV = "test";
