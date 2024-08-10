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
    return { content, mod: GO_MOD_FILE, spydra: JSON.stringify(this.generateSpydraConfiguration(data), null, 2) };
  }

  private generateSpydraConfiguration(data: Contract) {
    const beginDate = this.prepareDate(data.beginDate);
    const dueDate = this.prepareDate(data.dueDate);

    return [
      {
        invoke: 'QueryClientId'
      },
      {
        invoke: 'Sign',
        args: ['<< asset id >>']
      },
      {
        invoke: 'QueryAsset',
        args: ['<< asset id >>']
      },
      {
        invoke: 'Init',
        args: [
          {
            beginDate,
            dueDate,
            parties: {
              application: {
                name: data.application.slice(1, -1),
                id: '<< app 1 id >>'
              },
              process: {
                name: data.process.slice(1, -1),
                id: '<< app 2 id >>'
              }
            }
          }
        ]
      },
      ...data.clauses.map(clause => ({ invoke: clause.name.pascal, args: ['<< asset id >>'] }))
      // {
      //   invoke: 'ClauseObligationPurchasesBetween100USD300USD',
      //   args: [
      //     '17819fdd-575e-46a7-aef9-9467ac9e8ad9',
      //     250,
      //     1717758000, // 2024-06-07 12:00:00
      //     1717844400 // 2024-06-08 12:00:00
      //   ]
      // }
    ];
  }

  private prepareDate(data: string) {
    const pattern = /^(\d{4})-(\d{2})-(\d{2})(\d{2})?(\d{2})?(\d{2})?$/;

    const match = data.match(pattern);

    if (!match) {
      return;
    }

    const [, year, month, day, hour, minute, second] = match;

    return `${year}-${month}-${day}T${hour ?? '00'}:${minute ?? '00'}:${second ?? '00'}Z`;
  }
}
