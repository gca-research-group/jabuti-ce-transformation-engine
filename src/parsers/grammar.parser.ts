import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { JabutiGrammarLexer } from 'jabuti-dsl-grammar-antlr/JabutiGrammarLexer';
import { JabutiGrammarParser } from 'jabuti-dsl-grammar-antlr/JabutiGrammarParser';

export class GrammarParser {
  parse(contract: string) {
    const inputStream = CharStreams.fromString(contract);
    const lexer = new JabutiGrammarLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new JabutiGrammarParser(tokenStream);

    return parser;
  }
}
