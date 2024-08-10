import { type JabutiGrammarListener } from 'jabuti-dsl-language-antlr/JabutiGrammarListener';
import {
  ClauseContext,
  type TimeoutContext,
  type DateContext,
  type DueDateContext,
  type BeginDateContext,
  type DatesContext,
  type MessageContentContext,
  type ClausesContext
} from 'jabuti-dsl-language-antlr/JabutiGrammarParser';
import { findDuplicateWords, getDaysInMonth } from '../utils';

export class SemanticValidor implements JabutiGrammarListener {
  enterDate(ctx: DateContext) {
    const month = +ctx.month().text;
    const day = +ctx.day().text;
    const year = +ctx.year().text;

    const maxDays = getDaysInMonth(year, month);

    if (day > maxDays) {
      throw new Error('The date given appears to be invalid.');
    }
  }

  enterTimeout(ctx: TimeoutContext) {
    const clause = ctx.parent?.parent?.parent?.parent as ClauseContext;
    const operation = clause.operation().children?.[2].text;
    if (operation !== 'response') {
      throw new Error('Timeout should only be present in clauses with response type operations');
    }
  }

  enterBeginDate(ctx: BeginDateContext) {
    const dates = ctx.parent as DatesContext;
    const beginDate = dates.beginDate()[0].children?.[2].text;
    const dueDate = dates.dueDate()[0].children?.[2].text;

    if (beginDate && dueDate && new Date(beginDate) > new Date(dueDate)) {
      throw new Error('dueDate should be greater than beginDate');
    }
  }

  enterDueDate(ctx: DueDateContext) {
    const dates = ctx.parent as DatesContext;
    const beginDate = dates.beginDate()[0].children?.[2].text;
    const dueDate = dates.dueDate()[0].children?.[2].text;

    if (beginDate && dueDate && new Date(beginDate) > new Date(dueDate)) {
      throw new Error('beginDate should be greater than dueDate');
    }
  }

  exitMessageContent(ctx: MessageContentContext) {
    if (
      ctx.childCount === 4 &&
      !['$.', '//', 'sum($.', 'count($.', 'sum(//', 'count(//'].some(item =>
        ctx.children?.[2].text.startsWith(`"${item}`)
      )
    ) {
      throw new Error('MessageContent should either contain an xpath or a jsonpath');
    }
  }

  enterClause(ctx: ClauseContext) {
    const clauses = (ctx.parent as ClausesContext).children?.filter(
      child => child instanceof ClauseContext
    ) as unknown as ClauseContext[];
    const clausesName = clauses?.map(
      (clause: ClauseContext) => `${clause.children?.[0].text}${clause.children?.[1].text}`
    );
    if (clausesName?.length && findDuplicateWords(clausesName).length) {
      throw new Error('The name of the clause with the type must be unique');
    }
  }

  enterEveryRule() {}
  exitEveryRule() {}
  visitErrorNode() {}
  visitTerminal() {}
}
