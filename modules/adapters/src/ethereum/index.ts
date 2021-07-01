import { aaveSource, aaveAddresses, aaveParser } from "./aave";
import { idleSource, idleAddresses, idleParser } from "./idle";

export const appSources = [
  aaveSource,
  idleSource,
];

export const ethAddresses = [
  ...aaveAddresses,
  ...idleAddresses,
];

export const appParsers = [
  aaveParser,
  idleParser,
];
