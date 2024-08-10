import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { JabutiGrammarLexer } from 'jabuti-dsl-grammar-antlr/JabutiGrammarLexer';
import { JabutiGrammarParser } from 'jabuti-dsl-grammar-antlr/JabutiGrammarParser';

import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';
import { SemanticValidor } from '../validators';

export class GrammarParser {
  parse(contract: string) {
    const inputStream = CharStreams.fromString(contract);
    const lexer = new JabutiGrammarLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new JabutiGrammarParser(tokenStream);

    const walker = new ParseTreeWalker();
    walker.walk(new SemanticValidor(), parser.contract());

    return parser;
  }
}
