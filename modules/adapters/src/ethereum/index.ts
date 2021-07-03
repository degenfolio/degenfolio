import { aaveSource, aaveAddresses, aaveParser } from "./aave";
import { idleSource, idleAddresses, idleParser } from "./idle";
import { polygonSource, polygonAddresses, polygonParser } from "./polygon";

export const ethSources = [
  aaveSource,
  idleSource,
  polygonSource,
];

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
