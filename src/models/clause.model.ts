import { type Message } from './message.model';
import { type Term } from './term.model';
import { type Variable } from './variable.model';

export interface Clause {
  name: {
    pascal: string;
    camel: string;
    snake: string;
  };
  type: string | undefined;
  rolePlayer: string | undefined;
  operation: string | undefined;
  terms: Term[];
  messages: Message;
  variables: Variable[];
}
