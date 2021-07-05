import { execSync } from "child_process";
import fs from "fs";

import { getLogger } from "@valuemachine/utils";
import express from "express";

import { env } from "./env";
import {
  getLogAndSend,
  STATUS_MY_BAD,
} from "./utils";

const log = getLogger(env.logLevel).child({
  // level: "debug",
  module: "Taxes",
});

export const taxesRouter = express.Router();

taxesRouter.post("/", async (req, res) => {
  const logAndSend = getLogAndSend(res);
  const { rows } = req.body;
  log.info(rows, `Getting taxes for ${rows.length} rows`);
  if (rows[0].description) {
    try {
      fs.writeFileSync("/tmp/f8949.json", JSON.stringify({
        ["topmostSubform[0].Page1[0].Table_Line1[0].Row1[0].f1_3[0]"]: rows[0].description,
      }));
      const cmd = "bash taxes/f8949.sh";
      const stdout = execSync(cmd);
      log.info(`Got output from ${cmd}: ${stdout}`);
      res.sendFile("/tmp/f8949.pdf");
      return;
    } catch (e) {
      logAndSend(e.message, STATUS_MY_BAD);
      return;
    }
  }
  logAndSend("You owe 1 million dollars");
});

