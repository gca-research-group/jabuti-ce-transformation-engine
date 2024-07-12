import * as ejs from 'ejs';
import { type CanonicalParser } from '../parsers/canonical.parser';

export abstract class BaseGenerator {
  constructor(protected readonly canonicalParser: CanonicalParser) {}
  render(contract: string, template?: string) {
    const data = this.canonicalParser.parse(contract);
    return ejs.render(template ?? '', data);
  }
}
