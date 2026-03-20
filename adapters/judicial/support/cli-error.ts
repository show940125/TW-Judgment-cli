import { CliError } from '../../../opencli-shims/errors.mjs';

function errorCode(error: unknown): string {
  if (error instanceof Error && error.name) {
    return error.name;
  }
  return 'PARSE_ERROR';
}

export function asCliError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    const [code, ...rest] = error.message.split(':');
    const normalizedCode = /^[A-Z_]+$/.test(code) ? code : errorCode(error);
    const message = rest.length > 0 ? rest.join(':').trim() : error.message;
    return new CliError(normalizedCode, message, hintForCode(normalizedCode));
  }

  return new CliError('PARSE_ERROR', String(error), hintForCode('PARSE_ERROR'));
}

function hintForCode(code: string): string {
  switch (code) {
    case 'NOT_FOUND':
      return 'Try a more specific keyword, or search by court/year/case number.';
    case 'UPSTREAM_MAINTENANCE':
      return 'The Judicial Yuan site may be under maintenance. Wait and retry.';
    case 'UPSTREAM_CHANGED':
      return 'The upstream HTML or route shape changed. Update the parser or verify the site manually.';
    case 'ADAPTER_NOT_INSTALLED':
      return 'Run the install script to sync the judicial adapters into ~/.opencli/clis/judicial.';
    case 'UNSUPPORTED_OPENCLI_VERSION':
      return 'Install a supported opencli version, then rerun doctor and verify.';
    default:
      return 'Check the command arguments and rerun with verification if needed.';
  }
}
