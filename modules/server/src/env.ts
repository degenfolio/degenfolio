export const env = {
  etherscanKey: process.env.DEGENFOLIO_ETHERSCAN_KEY || "",
  ethProvider: process.env.DEGENFOLIO_ETH_PROVIDER || process.env.VM_ETH_PROVIDER || "",
  logLevel: process.env.DEGENFOLIO_LOG_LEVEL || "info",
  port: parseInt(process.env.DEGENFOLIO_PORT || "8080", 10),
};
