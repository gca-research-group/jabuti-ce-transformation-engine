import { HYPERLEDGER_FABRIC_GOLANG_TEMPLATE } from '../templates/hyperledger-fabric-golang.template';
import { BaseGenerator } from './base.generator';
import { type Generator, type Contract } from '../models';

const GO_MOD_FILE = `
module github.com/hyperledger-fabric/chaincode

go 1.20

require github.com/hyperledger/fabric-contract-api-go v1.2.1

require github.com/google/uuid v1.3.1

require github.com/hyperledger/fabric-chaincode-go v0.0.0-20230731094759-d626e9ab09b9

`;

export class HyperledgerFabricGolangGenerator
  extends BaseGenerator
  implements Generator<{ content: string; mod: string }>
{
  generate(data: Contract) {
    const content = super.render(HYPERLEDGER_FABRIC_GOLANG_TEMPLATE, data);
    return { content, mod: GO_MOD_FILE };
  }
}
