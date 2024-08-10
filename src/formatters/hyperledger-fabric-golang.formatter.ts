import { execSync } from 'child_process';
import { type Formatter } from '../models';

export class HyperledgerFabricGolangFormatter implements Formatter {
  format(content: string) {
    try {
      const code = execSync('gofmt', {
        input: content,
        encoding: 'utf8'
      });

      return code.replace(/,\n\n/g, ',');
    } catch (error) {
      return content.replace(/,\n\n/g, ',');
    }
  }
}
