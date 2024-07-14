import { EthereumSolidityGenerator } from '../generators';
import { type Factory } from '../models';
import { CanonicalParser, GrammarParser } from '../parsers';

export class EthereumSolidityFactory implements Factory {
  transform(constract: string) {
    const grammar = new GrammarParser();
    const canonical = new CanonicalParser(grammar);
    const generator = new EthereumSolidityGenerator(canonical);

    return generator.generate(constract);
  }
}
