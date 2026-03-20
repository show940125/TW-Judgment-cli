export class CliError extends Error {
  code: string;
  hint: string;
  constructor(code: string, message: string, hint?: string);
}
