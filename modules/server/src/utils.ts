import fs from "fs";

import { getFileStore, getLogger } from "@valuemachine/utils";

import { env } from "./env";

const log = getLogger(env.logLevel).child({ module: "Utils" });

export const store = getFileStore("/data", fs);

export const STATUS_SUCCESS = 200;
export const STATUS_NOT_FOUND = 404;
export const STATUS_YOUR_BAD = 400;
export const STATUS_MY_BAD = 500;

export const getLogAndSend = (res) => (message, code = STATUS_SUCCESS): void => {
  if (code === STATUS_SUCCESS) {
    log.child({ module: "Send" }).info(`Success: ${
      typeof message === "string" ? message : JSON.stringify(message).substring(0, 120) + "..."
    }`);
  } else {
    log.child({ module: "Send" }).warn(`Error ${code}: ${message}`);
  }
  res.status(code).send(message);
  return;
};
