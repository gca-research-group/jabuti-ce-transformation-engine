import {
  VariablesContext,
  DatesContext,
  BeginDateContext,
  DueDateContext,
  PartiesContext,
  ApplicationContext,
  ProcessContext,
  VariableStatementContext,
  ClausesContext,
  type JabutiGrammarParser,
  TermsContext,
  TermOrWhenContext,
  MessageContentContext,
  TermContext,
  TimeoutContext,
  ClauseContext,
  OnBreachContext,
  DatetimeContext,
  MessageContentTextContext,
  MessageContentBooleanContext,
  type MessageContentNumericContext
} from 'jabuti-dsl-grammar-antlr/JabutiGrammarParser';
import { capitalizeFirst } from '../utils';
import { type Contract, type Clause, type Variable } from '../models';
import { JabutiGrammarListenerImpl } from '../validators';
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';

export class CanonicalParser {
  parse(parser: JabutiGrammarParser): Contract {
    const tree = parser.contract();

    const listener = new JabutiGrammarListenerImpl();

    ParseTreeWalker.DEFAULT.walk(listener, tree);

    const contractName = tree.ID()?.text ?? '';

    let beginDate: string = '';
    let dueDate: string = '';
    let application: string = '';
    let process: string = '';

    const clauses: Clause[] = [];

    tree.children?.forEach(_item => {
      if (_item instanceof VariablesContext) {
        _item.children?.forEach(_variable => {
          if (_variable instanceof VariableStatementContext) {
            // const name = _variable.children?.[0].text;
            if (_variable.children?.[2] instanceof TermContext) {
              const current = _variable.children?.[2].children?.[0];

              if (current instanceof MessageContentContext) {
                // this.parseMessageContent(current);
              }
            }
          }
        });
      }

      if (_item instanceof DatesContext) {
        _item.children?.forEach(_date => {
          if (_date instanceof BeginDateContext) {
            _date.children?.forEach(_beginDate => {
              if (_beginDate instanceof DatetimeContext) {
                beginDate = _beginDate.text;
              }
            });
          }

          if (_date instanceof DueDateContext) {
            _date.children?.forEach(_dueDate => {
              if (_dueDate instanceof DatetimeContext) {
                dueDate = _dueDate.text;
              }
            });
          }
        });
      }

      if (_item instanceof PartiesContext) {
        _item.children?.forEach(_party => {
          if (_party instanceof ApplicationContext) {
            application = _party.children?.[2].text ?? '';
          }

          if (_party instanceof ProcessContext) {
            process = _party.children?.[2].text ?? '';
          }
        });
      }

      if (_item instanceof ClausesContext) {
        _item.children?.forEach(_clauses => {
          if (_clauses instanceof ClauseContext) {
            const clauseType: string = _clauses.children?.[0].text ?? '';
            const name: string = _clauses.ID().text;
            const clauseName = {
              pascal: `${capitalizeFirst(clauseType)}${capitalizeFirst(name)}`,
              camel: `${clauseType.toLocaleLowerCase()}${capitalizeFirst(name)}`,
              snake: `${clauseType}_${name}`
            };
            const rolePlayer = _clauses.rolePlayer().children?.[2].text;
            const operation = _clauses.operation().children?.[2].text;
            const terms: any[] = [];
            let variables: Record<string, Variable> = {};
            const messages = { error: '', success: '' };

            let termIndex = 0;

            _clauses.children?.forEach(_clause => {
              if (_clause instanceof OnBreachContext) {
                messages.error = _clause.children?.[4].text ?? '';
                return;
              }

              if (!(_clause instanceof TermsContext)) {
                return;
              }

              _clause.children?.forEach(_terms => {
                if (!(_terms instanceof TermOrWhenContext)) {
                  return;
                }

                _terms.children?.forEach(_term => {
                  if (!(_term instanceof TermContext)) {
                    return;
                  }

                  _term.children?.forEach(_operation => {
                    if (_operation instanceof TimeoutContext) {
                      _operation.children?.forEach(_timeout => {
                        if (!isNaN(Number(_timeout?.text))) {
                          const termType = 'timeout';
                          const name = {
                            pascal: `${clauseName.pascal}${capitalizeFirst(termType)}${termIndex}`,
                            camel: `${clauseName.camel}${capitalizeFirst(termType)}${termIndex}`,
                            snake: `${clauseName.snake}_${termType}_${termIndex}`
                          };
                          termIndex++;
                          terms.push({ name, type: 'timeout', value: _timeout.text });
                        }
                      });
                    }

                    if (_operation instanceof MessageContentContext) {
                      const termType = 'messageContent';

                      const name = {
                        pascal: `${clauseName.pascal}${capitalizeFirst(termType)}${termIndex}`,
                        camel: `${clauseName.camel}${capitalizeFirst(termType)}${termIndex}`,
                        snake: `${clauseName.snake}_${termType}_${termIndex}`
                      };

                      const parameters = this.parseMessageContent(_operation, termIndex);

                      if (parameters?.length === 1) {
                        if (typeof parameters[0] !== 'number' && typeof parameters[0] !== 'string' && parameters[0]) {
                          variables = {
                            ...variables,
                            ...{ [parameters[0].name.camel]: parameters[0] }
                          };
                        }

                        terms.push({
                          name,
                          type: termType,
                          variables: parameters
                        });
                      }

                      if (parameters?.length === 3) {
                        if (typeof parameters[0] !== 'number' && typeof parameters[0] !== 'string' && parameters[0]) {
                          variables = {
                            ...variables,
                            ...{ [parameters[0].name.camel]: parameters[0] }
                          };
                        }

                        if (typeof parameters[2] !== 'number' && typeof parameters[2] !== 'string' && parameters[2]) {
                          variables = {
                            ...variables,
                            ...{ [parameters[2].name.camel]: parameters[2] }
                          };
                        }

                        terms.push({
                          name,
                          type: termType,
                          comparator: parameters[1],
                          variables: [parameters[0], parameters[2]]
                        });
                      }

                      termIndex++;
                    }
                  });
                });
              });
            });

            clauses.push({
              name: clauseName,
              type: clauseType,
              variables: Object.values(variables),
              rolePlayer,
              operation,
              terms,
              messages
            });
          }
        });
      }
    });

    return { name: contractName, beginDate, dueDate, application, process, variables: [], clauses };
  }

  parseMessageContent(term: MessageContentContext, index: number) {
    // MessageContent('xpath')
    // MessageContent('jsonpath')
    if (term.childCount === 4) {
      const booleanContext = term.children?.[2];
      if (!(booleanContext instanceof MessageContentBooleanContext)) {
        return;
      }

      const argument: string = booleanContext.children?.[2].text ?? '';

      if (argument?.startsWith('"')) {
        return [
          {
            name: {
              pascal: `MessageContent${index}`,
              camel: `messageContent${index}`,
              snake: `messageContent_${index}`
            },
            type: 'BOOLEAN'
          }
        ];
      }

      if (argument) {
        return [
          {
            name: { pascal: capitalizeFirst(argument), camel: argument, snake: argument },
            type: 'BOOLEAN'
          }
        ];
      }
    }

    const context1 = term.children?.[2];
    const context2 = term.children?.[4];
    const comparator = term.children?.[3].text as unknown as string;
    const type = context1 instanceof MessageContentTextContext ? 'TEXT' : 'NUMBER';
    const response = [];

    if (!isNaN(Number(context1?.text))) {
      response.push(context1?.text);
    } else if (context1 && context1.text.startsWith('"')) {
      response.push(context1?.text);
    } else {
      const value1: string =
        (context1 as MessageContentTextContext | MessageContentNumericContext).children?.[2].text ?? '';
      if (value1.startsWith('"')) {
        response.push({
          name: {
            pascal: `MessageContent${index}2`,
            camel: `messageContent${index}2`,
            snake: `messageContent_${index}_2`
          },
          type
        });
      } else {
        response.push({
          name: { pascal: capitalizeFirst(value1), camel: value1, snake: value1 },
          type
        });
      }
    }

    response.push(comparator);

    if (!isNaN(Number(context2?.text))) {
      response.push(context2?.text);
    } else if (context2 && context2.text.startsWith('"')) {
      response.push(context2?.text);
    } else {
      const value2: string =
        (context2 as MessageContentTextContext | MessageContentNumericContext).children?.[2].text ?? '';
      if (value2.startsWith('"')) {
        response.push({
          name: {
            pascal: `MessageContent${index}2`,
            camel: `messageContent${index}2`,
            snake: `messageContent_${index}_2`
          },
          type
        });
      } else {
        response.push({
          name: { pascal: capitalizeFirst(value2), camel: value2, snake: value2 },
          type
        });
      }
    }

    return response;
  }
}
