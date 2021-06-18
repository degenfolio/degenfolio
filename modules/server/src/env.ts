export const env = {
  etherscanKey: process.env.DEGENFOLIO_ETHERSCAN_KEY || "",
  logLevel: process.env.DEGENFOLIO_LOG_LEVEL || "info",
  port: parseInt(process.env.DEGENFOLIO_PORT || "8080", 10),
};
