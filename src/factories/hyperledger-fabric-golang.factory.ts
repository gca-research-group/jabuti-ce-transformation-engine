import { HyperledgerFabricGolangFormatter } from '../formatters';
import { HyperledgerFabricGolangGenerator } from '../generators';
import { CanonicalParser, GrammarParser } from '../parsers';

export class HyperledgerFabricGolangFactory {
  run(constract: string) {
    const formatter = new HyperledgerFabricGolangFormatter();
    const grammar = new GrammarParser();
    const canonical = new CanonicalParser(grammar);
    const generator = new HyperledgerFabricGolangGenerator(formatter, canonical);

    return generator.generate(constract);
  }
}
