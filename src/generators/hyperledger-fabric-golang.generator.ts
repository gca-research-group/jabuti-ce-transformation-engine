import { HYPERLEDGER_FABRIC_GOLANG_TEMPLATE } from '../templates/hyperledger-fabric-golang.template';
import { BaseGenerator } from './base.generator';
import { type Generator, type Formatter } from '../models';
import { type CanonicalParser } from '../parsers/canonical.parser';

const GO_MOD_FILE = `
module github.com/hyperledger-fabric/chaincode

go 1.20

require github.com/hyperledger/fabric-contract-api-go v1.2.1

require github.com/google/uuid v1.3.1

require github.com/hyperledger/fabric-chaincode-go v0.0.0-20230731094759-d626e9ab09b9

`;

export class HyperledgerFabricGolangGenerator extends BaseGenerator implements Generator {
  constructor(
    private readonly formatter: Formatter,
    protected readonly canonicalParser: CanonicalParser
  ) {
    super(canonicalParser);
  }

  generate(contract: string) {
    const content = super.render(contract, HYPERLEDGER_FABRIC_GOLANG_TEMPLATE);
    return [this.formatter.format(content), GO_MOD_FILE];
  }
}
