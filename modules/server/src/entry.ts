import { getLogger } from "@valuemachine/utils";
import express from "express";

import { env } from "./env";
import { pricesRouter } from "./prices";
import { ethereumRouter } from "./ethereum";
import { polygonRouter } from "./polygon";
import { harmonyRouter } from "./harmony";
import { taxesRouter } from "./taxes";
import { getLogAndSend, STATUS_NOT_FOUND } from "./utils";

const log = getLogger(env.logLevel).child({ module: "Entry" });

log.info(`Starting server in env: ${JSON.stringify(env, null, 2)}`);

const app = express();

app.use(express.json({ limit: "10mb" }));

app.use("/prices", pricesRouter);
app.use("/ethereum", ethereumRouter);
app.use("/polygon", polygonRouter);
app.use("/harmony", harmonyRouter);
app.use("/taxes", taxesRouter);

app.use((req, res) => {
  return getLogAndSend(res)(`not found`, STATUS_NOT_FOUND);
});

app.listen(env.port, () => {
  log.info(`Server is listening on port ${env.port}`);
});
