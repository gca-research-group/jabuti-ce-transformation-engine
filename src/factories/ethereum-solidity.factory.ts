import { EthereumSolidityGenerator } from '../generators';
import { CanonicalParser, GrammarParser } from '../parsers';

export class EthereumSolidityFactory {
  run(constract: string) {
    const grammar = new GrammarParser();
    const canonical = new CanonicalParser(grammar);
    const generator = new EthereumSolidityGenerator(canonical);

    return generator.generate(constract);
  }
}
