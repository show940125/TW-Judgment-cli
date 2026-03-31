import { cli, Strategy } from '../../opencli-shims/registry.mjs';

import { asCliError } from './support/cli-error.js';
import { readJudgment } from './support/service.js';

cli({
  site: 'judicial',
  name: 'read',
  description: 'Read a Taiwan Judicial judgment in full text',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'id', required: true, help: 'Judgment id from judicial search output' },
  ],
  columns: ['id', 'title', 'date', 'cause', 'pdf_url'],
  func: async (_page: unknown, kwargs: Record<string, any>) => {
    try {
      const result = await readJudgment({ id: kwargs.id });
      return {
        id: result.id,
        title: result.title,
        date: result.date,
        cause: result.cause,
        text: result.text,
        has_text_layer: result.hasTextLayer,
        scan_only: result.scanOnly,
        pdf_url: result.pdfUrl,
        print_url: result.printUrl,
      };
    } catch (error) {
      throw asCliError(error);
    }
  },
});
