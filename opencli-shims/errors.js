export class CliError extends Error {
  constructor(code, message, hint = '') {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.hint = hint;
  }
}
