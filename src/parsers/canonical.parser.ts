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
  TermsContext,
  TermOrWhenContext,
  MessageContentContext,
  TermContext,
  TimeoutContext,
  NumberContext,
  VariableNameContext,
  DateContext,
  ClauseContext,
  OnBreachContext,
  type JabutiGrammarParser
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

    const contractName = tree.variableName()?.text ?? '';

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
              if (_beginDate instanceof DateContext) {
                beginDate = _beginDate.text;
              }
            });
          }

          if (_date instanceof DueDateContext) {
            _date.children?.forEach(_dueDate => {
              if (_dueDate instanceof DateContext) {
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
            const name: string = _clauses.variableName().text;
            const clauseName = {
              pascal: `${capitalizeFirst(clauseType)}${capitalizeFirst(name)}`,
              camel: `${clauseType.toLocaleLowerCase()}${capitalizeFirst(name)}`,
              snake: `${clauseType}_${name}`
            };
            const rolePlayer = _clauses.rolePlayer().children?.[2].text;
            const operation = _clauses.rolePlayer().children?.[2].text;
            const terms: any[] = [];
            // const variables: Array<{ name: string; type: string }> = [];
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
                        if (_timeout instanceof NumberContext) {
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

                      const messageContent = this.parseMessageContent(_operation, termIndex);

                      termIndex++;

                      variables = { ...variables, ...messageContent.variables };

                      terms.push({
                        name,
                        type: termType,
                        comparator: messageContent.comparator,
                        variables: Object.values(messageContent.variables)
                      });
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
    let variables: Record<string, Variable> = {};
    let comparator: string | undefined;

    // MessageContent('xpath')
    // MessageContent('jsonpath')
    if (term.childCount === 4) {
      variables = {
        [`messageContent${index}`]: {
          name: { pascal: `MessageContent${index}`, camel: `messageContent${index}`, snake: `messageContent_${index}` },
          type: 'boolean'
        }
      };
    }

    if (term.childCount === 6) {
      const value1 = term.children?.[2];
      const value2 = term.children?.[4];
      comparator = term.children?.[3].text as unknown as string;
      const type = ['==', '!='].includes(comparator) ? 'TEXT' : 'NUMBER';

      if (value1 instanceof VariableNameContext) {
        variables = {
          ...variables,
          [value1.text]: {
            name: { pascal: capitalizeFirst(value1.text), camel: value1.text, snake: value1.text },
            type
          }
        };
      } else {
        variables = {
          ...variables,
          [`messageContent${index}1`]: {
            name: {
              pascal: `MessageContent${index}1`,
              camel: `messageContent${index}1`,
              snake: `messageContent_${index}_1`
            },
            type
          }
        };
      }

      if (value2 instanceof VariableNameContext) {
        variables = {
          ...variables,
          [value2.text]: {
            name: { pascal: capitalizeFirst(value2.text), camel: value2.text, snake: value2.text },
            type
          }
        };
      } else {
        variables = {
          ...variables,
          [`messageContent${index}2`]: {
            name: {
              pascal: `MessageContent${index}2`,
              camel: `messageContent${index}2`,
              snake: `messageContent_${index}_2`
            },
            type
          }
        };
      }
    }

    return { variables, comparator };
  }
}
