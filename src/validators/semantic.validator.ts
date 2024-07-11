import { type JabutiGrammarListener } from 'jabuti-dsl-language-antlr/JabutiGrammarListener';
import { type DateContext } from 'jabuti-dsl-language-antlr/JabutiGrammarParser';

export class SemanticValidor implements JabutiGrammarListener {
  enterDate(ctx: DateContext) {
    const month = ctx.month().text;
    const day = ctx.day().text;

    if (+month === 2 && +day > 29) {
      throw new Error('In February, there should be no more than 29 days.');
    }
  }

  enterEveryRule() {}
  exitEveryRule() {}
  visitErrorNode() {}
  visitTerminal() {}
}
