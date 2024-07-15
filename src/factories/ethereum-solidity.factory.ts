import { EthereumSolidityGenerator } from '../generators';
import { type Factory } from '../models';
import { CanonicalParser, GrammarParser } from '../parsers';

export class EthereumSolidityFactory implements Factory {
  transform(contract: string) {
    const grammarParser = new GrammarParser();
    const grammarContext = grammarParser.parse(contract);

    const canonicalParser = new CanonicalParser();
    const canonicalContext = canonicalParser.parse(grammarContext);

    const generator = new EthereumSolidityGenerator();

    return generator.generate(canonicalContext);
  }
}
