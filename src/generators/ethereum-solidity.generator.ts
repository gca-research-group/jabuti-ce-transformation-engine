import { type Generator } from '../models';
import { ETHEREUM_SOLIDITY_TEMPLATE } from '../templates';
import { BaseGenerator } from './base.generator';

export class EthereumSolidityGenerator extends BaseGenerator implements Generator {
  generate(contract: string) {
    const content = super.render(contract, ETHEREUM_SOLIDITY_TEMPLATE);
    return [content];
  }
}
