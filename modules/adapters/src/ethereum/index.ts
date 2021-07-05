import { aaveAddresses, aaveParser } from "./aave";
import { idleAddresses, idleParser } from "./idle";
import { polygonAddresses, polygonParser } from "./polygon";
import { harmonyAddresses, harmonyParser } from "./harmony";
import { uniswapAddresses, uniswapParser } from "./uniswapv3";

export const ethAddresses = [
  ...aaveAddresses,
  ...idleAddresses,
  ...polygonAddresses,
  ...harmonyAddresses,
  ...uniswapAddresses,
];

export const ethParsers = [
  aaveParser,
  idleParser,
  polygonParser,
  harmonyParser,
  uniswapParser,
];
