import { HyperledgerFabricGolangFactory } from './../../src/factories/hyperledger-fabric-golang.factory';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const contract = 'port-of-seville';

const cwd = `./samples/${contract}`;

const content = readFileSync(`${cwd}/${contract}.jabuti`, 'utf-8');
const files = new HyperledgerFabricGolangFactory().transform(content);

writeFileSync(`${cwd}/${contract}.go`, files.content);
writeFileSync(`${cwd}/go.mod`, files.mod);
writeFileSync(`${cwd}/${contract}.fabric`, files.spydra);

execSync('go mod tidy', { cwd });
