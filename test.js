import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require("./template.json");
import { db } from "./db.js";
import { user } from "./users.js";
var dbc = new user("510482750458036224");