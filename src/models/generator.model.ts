export interface Generator {
  render: (contract: string, template?: string) => string;
  generate: (contract: string) => string[];
}
