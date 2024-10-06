import { type JabutiGrammarListener } from 'jabuti-dsl-grammar-antlr/JabutiGrammarListener';
import {
  ClauseContext,
  type TimeoutContext,
  type DueDateContext,
  type BeginDateContext,
  type DatesContext,
  type ClausesContext,
  type ApplicationContext,
  type OperationContext,
  type RolePlayerContext,
  type ProcessContext,
  type TermsContext,
  type DatetimeContext,
  type MessageContentContext,
  MessageContentBooleanContext,
  MessageContentNumericContext,
  MessageContentTextContext
} from 'jabuti-dsl-grammar-antlr/JabutiGrammarParser';
import { findDuplicateWords, getDaysInMonth, string2Date } from '../utils';

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

export class JabutiGrammarListenerImpl implements JabutiGrammarListener {
  enterDate(ctx: DatetimeContext) {
    if (ctx.text === '') {
      return;
    }

    const month = +ctx.month().text;
    const day = +ctx.day().text;
    const year = +ctx.year().text;

    const maxDays = getDaysInMonth(year, month, ctx);

    if (day > maxDays) {
      throw new ValidationError('The date given appears to be invalid.', ctx);
    }
  }

  enterApplication(ctx: ApplicationContext) {
    if (!ctx.String().text) {
      throw new ValidationError('Application is required.', ctx);
    }
  }

  enterProcess(ctx: ProcessContext) {
    if (!ctx.String().text) {
      throw new ValidationError('Process is required.', ctx);
    }
  }

  enterOperation(ctx: OperationContext) {
    if (
      ![ctx.Poll()?.text, ctx.Push()?.text, ctx.Read()?.text, ctx.Request()?.text, ctx.Response()?.text].some(
        item => !!item
      )
    ) {
      throw new ValidationError('Operation is required.', ctx);
    }
  }

  exitTerms(ctx: TermsContext) {
    if ((ctx.children?.length ?? 0) < 4) {
      throw new ValidationError('Terms should not be empty.', ctx);
    }
  }

  enterRolePlayer(ctx: RolePlayerContext) {
    if (!ctx.Application()?.text && !ctx.Process()?.text) {
      throw new ValidationError('RolePlayer is required.', ctx);
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

    if (beginDate && dueDate && string2Date(beginDate, ctx) > string2Date(dueDate, ctx)) {
      throw new ValidationError('dueDate should be greater than beginDate', ctx);
    }
  }

  enterDueDate(ctx: DueDateContext) {
    const dates = ctx.parent as DatesContext;
    const beginDate = dates.beginDate()[0].children?.[2].text;
    const dueDate = dates.dueDate()[0].children?.[2].text;

    if (!dueDate) {
      throw new ValidationError('dueDate is required', ctx);
    }

    if (beginDate && dueDate && string2Date(beginDate, ctx) > string2Date(dueDate, ctx)) {
      throw new ValidationError('dueDate should be greater than beginDate', ctx);
    }
  }

  exitMessageContent(ctx: MessageContentContext) {
    // if (
    //   ctx.childCount === 4 &&
    //   !['$.', '//', 'sum($.', 'count($.', 'sum(//', 'count(//'].some(item =>
    //     ctx.children?.[2].text.startsWith(`"${item}`)
    //   )
    // ) {
    //   throw new ValidationError('MessageContent should either contain an xpath or a jsonpath', ctx);
    // }

    if (ctx.childCount === 4 && !(ctx.children?.[2] instanceof MessageContentBooleanContext)) {
      throw new ValidationError('Invalid MessageContent, expected MessageContent(boolean(<< expression >>)) ', ctx);
    }

    if (ctx.childCount !== 6 && ctx.childCount !== 4) {
      throw new ValidationError('Invalid MessageContent', ctx);
    }

    if (ctx.childCount === 6) {
      const context1 = ctx.children?.[2];
      const context2 = ctx.children?.[4];
      if (
        !(context1 instanceof MessageContentNumericContext) &&
        !(context1 instanceof MessageContentTextContext) &&
        isNaN(Number(context1?.text)) &&
        !context1?.text.startsWith('"')
      ) {
        throw new ValidationError('[1] Invalid MessageContent', ctx);
      }

      if (
        !(context2 instanceof MessageContentNumericContext) &&
        !(context2 instanceof MessageContentTextContext) &&
        isNaN(Number(context2?.text)) &&
        !context2?.text.startsWith('"')
      ) {
        throw new ValidationError('[2] Invalid MessageContent', ctx);
      }
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
