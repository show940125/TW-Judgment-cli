import { cli, Strategy } from '../../opencli-shims/registry.mjs';

import { asCliError } from './support/cli-error.js';
import { exportResults } from './support/export.js';

cli({
  site: 'judicial',
  name: 'export-results',
  description: 'Export search or read-batch JSON results to CSV or Markdown',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'input', required: true, help: 'Path to a JSON file produced by judicial search, advanced-search, or read-batch' },
    { name: 'export-format', required: true, help: 'Export format: csv or md' },
    { name: 'output', help: 'Optional output path; defaults beside the input file' },
  ],
  columns: ['format', 'record_count', 'output_path'],
  func: async (_page: unknown, kwargs: Record<string, any>) => {
    try {
      const result = await exportResults({
        input: kwargs.input,
        format: kwargs['export-format'],
        output: kwargs.output,
      });

      return {
        format: result.format,
        record_count: result.recordCount,
        input_path: result.inputPath,
        output_path: result.outputPath,
      };
    } catch (error) {
      throw asCliError(error);
    }
  },
});
