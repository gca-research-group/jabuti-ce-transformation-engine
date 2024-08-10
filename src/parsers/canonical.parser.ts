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
  ClauseContext
} from 'jabuti-dsl-language-antlr/JabutiGrammarParser';
import { type GrammarParser } from './grammar.parser';
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';
import { SemanticValidor } from '../validators';
import { capitalizeFirst } from '../utils';

export class CanonicalParser {
  constructor(private readonly grammarParser: GrammarParser) {}

  parse(content: string) {
    const contract = this.grammarParser.parse(content);

    const walker = new ParseTreeWalker();
    walker.walk(new SemanticValidor(), contract);

    const contractName = contract.variableName()?.text;

    let beginDate: string | undefined;
    let dueDate: string | undefined;
    let application: string | undefined;
    let process: string | undefined;

    const variables: Array<{ name: string | undefined; value: string | undefined }> = [];

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
    }> = [];

    contract.children?.forEach(_item => {
      if (_item instanceof VariablesContext) {
        _item.children?.forEach(_variable => {
          if (_variable instanceof VariableStatementContext) {
            const name = _variable.children?.[0].text;
            const value = _variable.children?.[2].text;
            variables.push({ name, value });
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

            _clauses.children?.forEach(_clause => {
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

                  _term.children?.forEach((_operation, index) => {
                    if (_operation instanceof TimeoutContext) {
                      _operation.children?.forEach(_timeout => {
                        if (_timeout instanceof NumberContext) {
                          const termType = 'timeout';
                          const name = {
                            pascal: `${clauseName.pascal}${capitalizeFirst(termType)}${index}`,
                            camel: `${clauseName.camel}${capitalizeFirst(termType)}${index}`,
                            snake: `${clauseName.snake}_${termType}_${index}`
                          };
                          terms.push({ name, type: 'timeout', value: _timeout.text });
                        }
                      });
                    }

                    if (_operation instanceof MessageContentContext) {
                      let variable1: string | undefined;
                      let variable2: string | undefined;
                      let comparator: string | undefined;
                      let path1: string | undefined;
                      let path2: string | undefined;

                      if (_operation.childCount === 4) {
                        path1 = _operation.children?.[2].text as unknown as string;
                      }

                      if (_operation.childCount === 6) {
                        const value1 = _operation.children?.[2];
                        const value2 = _operation.children?.[4];
                        comparator = _operation.children?.[3].text as unknown as string;

                        if (value1 instanceof VariableNameContext) {
                          variable1 = value1.text as unknown as string;
                        } else {
                          path1 = value1?.text as unknown as string;
                        }

                        if (value2 instanceof VariableNameContext) {
                          variable2 = value2.text as unknown as string;
                        } else {
                          path2 = value2?.text as unknown as string;
                        }
                      }

                      const termType = 'messageContent';

                      const name = {
                        pascal: `${clauseName.pascal}${capitalizeFirst(termType)}${index}`,
                        camel: `${clauseName.camel}${capitalizeFirst(termType)}${index}`,
                        snake: `${clauseName.snake}_${termType}_${index}`
                      };

                      terms.push({ name, type: termType, variable1, variable2, comparator, path1, path2 });
                    }
                  });
                });
              });
            });

            clauses.push({ name: clauseName, type: clauseType, variables: [], rolePlayer, operation, terms });
          }
        });
      }
    });

    return { contractName, beginDate, dueDate, application, process, variables, clauses };
  }
}
