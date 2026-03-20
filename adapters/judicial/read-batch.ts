import { cli, Strategy } from '../../opencli-shims/registry.mjs';

import { parseJudgmentIdsInput } from './support/batch.js';
import { asCliError } from './support/cli-error.js';
import { readJudgmentsBatch } from './support/service.js';

cli({
  site: 'judicial',
  name: 'read-batch',
  description: 'Read multiple Taiwan Judicial judgments in full text',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'ids', required: true, help: 'Newline-delimited ids or a comma-joined list of complete judgment ids' },
    { name: 'concurrency', type: 'int', default: 3, help: 'Maximum concurrent reads' },
  ],
  columns: ['id', 'title', 'date', 'cause', 'pdf_url'],
  func: async (_page: unknown, kwargs: Record<string, any>) => {
    try {
      const ids = parseJudgmentIdsInput(String(kwargs.ids));
      const results = await readJudgmentsBatch({
        ids,
        concurrency: kwargs.concurrency,
      });

      return results.map((result) => ({
        id: result.id,
        title: result.title,
        date: result.date,
        cause: result.cause,
        text: result.text,
        pdf_url: result.pdfUrl,
        print_url: result.printUrl,
      }));
    } catch (error) {
      throw asCliError(error);
    }
  },
});
