import * as ejs from 'ejs';
import { type Contract } from '../models';

export abstract class BaseGenerator {
  render(template: string, data: Contract) {
    return ejs.render(template, data);
  }
}
