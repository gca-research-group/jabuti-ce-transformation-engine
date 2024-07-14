import { type JabutiGrammarListener } from 'jabuti-dsl-grammar-antlr/JabutiGrammarListener';
import {
  ClauseContext,
  type TimeoutContext,
  type DateContext,
  type DueDateContext,
  type BeginDateContext,
  type DatesContext,
  type MessageContentContext,
  type ClausesContext
} from 'jabuti-dsl-grammar-antlr/JabutiGrammarParser';
import { findDuplicateWords, getDaysInMonth } from '../utils';

import { type ParserRuleContext } from 'antlr4ts';

export class ValidationError extends Error {
  range?: { start: { line: number; character: number }; end: { line?: number; character?: number } };

  constructor(message: string, ctx: ParserRuleContext) {
    super(message);
    this.range = {
      start: { line: ctx.start.line, character: ctx.start.charPositionInLine },
      end: { line: ctx.stop?.line, character: ctx.stop?.charPositionInLine }
    };
  }
}

export class SemanticValidor implements JabutiGrammarListener {
  enterDate(ctx: DateContext) {
    const month = +ctx.month().text;
    const day = +ctx.day().text;
    const year = +ctx.year().text;

    const maxDays = getDaysInMonth(year, month);

    if (day > maxDays) {
      throw new ValidationError('The date given appears to be invalid.', ctx);
    }
  }

  enterTimeout(ctx: TimeoutContext) {
    const clause = ctx.parent?.parent?.parent?.parent as ClauseContext;
    const operation = clause.operation().children?.[2].text;
    if (operation !== 'response') {
      throw new ValidationError('Timeout should only be present in clauses with response type operations', ctx);
    }
  }

  enterBeginDate(ctx: BeginDateContext) {
    const dates = ctx.parent as DatesContext;
    const beginDate = dates.beginDate()[0].children?.[2].text;
    const dueDate = dates.dueDate()[0].children?.[2].text;

    if (!beginDate) {
      throw new ValidationError('beginDate is required', ctx);
    }

    if (beginDate && dueDate && new Date(beginDate) > new Date(dueDate)) {
      throw new ValidationError('dueDate should be greater than beginDate', ctx);
    }
  }

  enterDueDate(ctx: DueDateContext) {
    const dates = ctx.parent as DatesContext;
    const beginDate = dates.beginDate()[0].children?.[2].text;
    const dueDate = dates.dueDate()[0].children?.[2].text;

    if (!beginDate) {
      throw new ValidationError('dueDate is required', ctx);
    }

    if (beginDate && dueDate && new Date(beginDate) > new Date(dueDate)) {
      throw new ValidationError('beginDate should be greater than dueDate', ctx);
    }
  }

  exitMessageContent(ctx: MessageContentContext) {
    if (
      ctx.childCount === 4 &&
      !['$.', '//', 'sum($.', 'count($.', 'sum(//', 'count(//'].some(item =>
        ctx.children?.[2].text.startsWith(`"${item}`)
      )
    ) {
      throw new ValidationError('MessageContent should either contain an xpath or a jsonpath', ctx);
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
      throw new ValidationError('The name of the clause with the type must be unique', ctx);
    }
  }

  enterEveryRule() {}
  exitEveryRule() {}
  visitErrorNode() {}
  visitTerminal() {}
}
