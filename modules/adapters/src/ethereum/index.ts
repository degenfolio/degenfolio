import { aaveSource, aaveAddresses, aaveParser } from "./aave";
import { idleSource, idleAddresses, idleParser } from "./idle";
import { polygonSource, polygonAddresses, polygonParser } from "./polygon";

export const appSources = [
  aaveSource,
  idleSource,
  polygonSource,
];

export const ethAddresses = [
  ...aaveAddresses,
  ...idleAddresses,
  ...polygonAddresses,
];

export const appParsers = [
  aaveParser,
  idleParser,
  polygonParser,
];
