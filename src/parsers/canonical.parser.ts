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
  OnBreachContext
} from 'jabuti-dsl-grammar-antlr/JabutiGrammarParser';
import { type GrammarParser } from './grammar.parser';
import { capitalizeFirst } from '../utils';

export class CanonicalParser {
  constructor(private readonly grammarParser: GrammarParser) {}

  parse(content: string) {
    const contract = this.grammarParser.parse(content);

    const contractName = contract.variableName()?.text;

    let beginDate: string | undefined;
    let dueDate: string | undefined;
    let application: string | undefined;
    let process: string | undefined;

    const clauses: Array<{
      variables: Array<{ name: string; type: string }>;
      name: {
        pascal: string;
        camel: string;
        snake: string;
      };
      type: string | undefined;
      rolePlayer: string | undefined;
      operation: string | undefined;
      terms: Array<{
        type: string | undefined;
        variable: string | undefined;
        symbol: string | undefined;
        value: string | undefined;
      }>;
      messages: { error: string; success: string };
    }> = [];

    contract.children?.forEach(_item => {
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
            application = _party.children?.[2].text;
          }

          if (_party instanceof ProcessContext) {
            process = _party.children?.[2].text;
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
            const variables: Array<{ name: string; type: string }> = [];
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

                      variables.push(...messageContent.variables);

                      terms.push({ name, type: termType, ...messageContent });
                    }
                  });
                });
              });
            });

            clauses.push({ name: clauseName, type: clauseType, variables, rolePlayer, operation, terms, messages });
          }
        });
      }
    });

    return { contractName, beginDate, dueDate, application, process, variables: [], clauses };
  }

  parseMessageContent(term: MessageContentContext, index: number) {
    const variables: Array<{ name: string; type: any }> = [];
    let comparator: string | undefined;

    if (term.childCount === 4) {
      variables.push({ name: `messageContent${index}`, type: 'boolean' });
    }

    if (term.childCount === 6) {
      const value1 = term.children?.[2];
      const value2 = term.children?.[4];
      comparator = term.children?.[3].text as unknown as string;
      const type = ['==', '!='].includes(comparator) ? 'TEXT' : 'NUMBER';

      if (typeof value1 === 'number' || typeof value2 === 'number') {
        variables.push({ name: `messageContent${index}1`, type: 'NUMBER' });
        variables.push({ name: `messageContent${index}2`, type: 'NUMBER' });
      } else if (!(value1 instanceof VariableNameContext) && !(value2 instanceof VariableNameContext)) {
        variables.push({
          name: `messageContent${index}1`,
          type
        });
        variables.push({ name: `messageContent${index}2`, type });
      } else if (value1 instanceof VariableNameContext && !(value2 instanceof VariableNameContext)) {
        variables.push({ name: `${value1.text}${index}1`, type });
        variables.push({ name: `messageContent${index}2`, type });
      } else if (!(value1 instanceof VariableNameContext) && value2 instanceof VariableNameContext) {
        variables.push({ name: `messageContent${index}1`, type });
        variables.push({ name: `${value2.text}${index}2`, type });
      } else if (value1 instanceof VariableNameContext && value2 instanceof VariableNameContext) {
        variables.push({ name: `${value1.text}${index}1`, type });
        variables.push({ name: `${value2.text}${index}2`, type });
      } else {
        variables.push({ name: `messageContent${index}1`, type: 'BOOLEAN' });
        variables.push({ name: `messageContent${index}2`, type: 'BOOLEAN' });
      }
    }

    return { variables, comparator };
  }
}
