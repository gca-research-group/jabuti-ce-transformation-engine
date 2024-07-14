import { type Clause } from './clause.model';
import { type Variable } from './variable.model';

export interface Contract {
  name: string;
  beginDate: string;
  dueDate: string;
  application: string;
  process: string;
  variables: Variable[];
  clauses: Clause[];
}
