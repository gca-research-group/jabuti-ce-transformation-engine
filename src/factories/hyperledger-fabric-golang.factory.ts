import { HyperledgerFabricGolangFormatter } from '../formatters';
import { HyperledgerFabricGolangGenerator } from '../generators';
import { type Factory } from '../models';
import { CanonicalParser, GrammarParser } from '../parsers';

export class HyperledgerFabricGolangFactory implements Factory {
  transform(contract: string) {
    const grammarParser = new GrammarParser();
    const grammarContext = grammarParser.parse(contract);

    const canonicalParser = new CanonicalParser();
    const canonicalContext = canonicalParser.parse(grammarContext);

    const generator = new HyperledgerFabricGolangGenerator();
    const generated = generator.generate(canonicalContext);

    const formatter = new HyperledgerFabricGolangFormatter();

    return { ...generated, content: formatter.format(generated.content) };
  }
}
