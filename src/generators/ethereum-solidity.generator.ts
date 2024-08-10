import { type Contract, type Generator } from '../models';
import { ETHEREUM_SOLIDITY_TEMPLATE } from '../templates';
import { BaseGenerator } from './base.generator';

export class EthereumSolidityGenerator extends BaseGenerator implements Generator<{ content: string }> {
  generate(data: Contract) {
    const content = super.render(ETHEREUM_SOLIDITY_TEMPLATE, data);
    return { content };
  }
}
