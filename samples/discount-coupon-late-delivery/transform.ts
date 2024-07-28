import { HyperledgerFabricGolangFactory } from './../../src/factories/hyperledger-fabric-golang.factory';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const cwd = './samples/discount-coupon-late-delivery';

const content = readFileSync(`${cwd}/discount-coupon-late-delivery.jabuti`, 'utf-8');
const files = new HyperledgerFabricGolangFactory().transform(content);

writeFileSync(`${cwd}/discount-coupon-late-delivery.go`, files.content);
writeFileSync(`${cwd}/go.mod`, files.mod);
writeFileSync(`${cwd}/discount-coupon-late-delivery.fabric`, files.spydra);

execSync('go mod tidy', { cwd });
