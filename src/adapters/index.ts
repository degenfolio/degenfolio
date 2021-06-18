import { aaveSource, aaveAddresses, aaveParser } from "./aave";

export const appSources = [
  aaveSource,
];

export const appAddresses = [
  ...aaveAddresses,
];

export const appParsers = [
  ...aaveParser,
];
