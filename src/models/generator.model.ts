import { type Contract } from './contract.model';

export interface Generator<T> {
  render: (template: string, data: Contract) => string;
  generate: (data: Contract) => T;
}
