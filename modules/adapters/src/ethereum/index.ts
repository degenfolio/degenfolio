import { aaveAddresses, aaveParser } from "./aave";
import { idleAddresses, idleParser } from "./idle";
import { polygonAddresses, polygonParser } from "./polygon";

export const ethAddresses = [
  ...aaveAddresses,
  ...idleAddresses,
  ...polygonAddresses,
];

export const ethParsers = [
  aaveParser,
  idleParser,
  polygonParser,
];
