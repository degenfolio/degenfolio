import { ethAddresses } from "./ethereum";
import { polygonAddresses } from "./polygon";

export const appAddresses = [
  ...ethAddresses,
  ...polygonAddresses,
];
export * from "./ethereum";
export * from "./harmony";
export * from "./polygon";
