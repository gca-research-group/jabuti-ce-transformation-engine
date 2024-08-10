import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { JabutiGrammarLexer } from 'jabuti-dsl-language-antlr/JabutiGrammarLexer';
import { JabutiGrammarParser } from 'jabuti-dsl-language-antlr/JabutiGrammarParser';

export class GrammarParser {
  parse(contract: string) {
    const inputStream = CharStreams.fromString(contract);
    const lexer = new JabutiGrammarLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    return new JabutiGrammarParser(tokenStream).contract();
  }
}
