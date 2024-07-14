import { HyperledgerFabricGolangFormatter } from '../formatters';
import { HyperledgerFabricGolangGenerator } from '../generators';
import { type Factory } from '../models';
import { CanonicalParser, GrammarParser } from '../parsers';

export class HyperledgerFabricGolangFactory implements Factory {
  transform(constract: string) {
    const formatter = new HyperledgerFabricGolangFormatter();
    const grammar = new GrammarParser();
    const canonical = new CanonicalParser(grammar);
    const generator = new HyperledgerFabricGolangGenerator(formatter, canonical);

    return generator.generate(constract);
  }
}
