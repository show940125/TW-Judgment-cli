export const Strategy: {
  PUBLIC: 'public';
  COOKIE: 'cookie';
  HEADER: 'header';
  INTERCEPT: 'intercept';
  UI: 'ui';
};

export interface CliArg {
  name: string;
  type?: string;
  default?: string | number;
  required?: boolean;
  help?: string;
}

export interface CliDefinition {
  site: string;
  name: string;
  description: string;
  strategy: string;
  browser: boolean;
  args: CliArg[];
  columns?: string[];
  func: (page: unknown, kwargs: Record<string, any>) => Promise<any>;
}

export function cli(definition: CliDefinition): CliDefinition;
