import { cli, Strategy } from '../../opencli-shims/registry.mjs';

import { asCliError } from './support/cli-error.js';
import { getPdfMetadata } from './support/service.js';

cli({
  site: 'judicial',
  name: 'pdf',
  description: 'Get the PDF URL for a Taiwan Judicial judgment',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'id', required: true, help: 'Judgment id from judicial search output' },
  ],
  columns: ['id', 'title', 'pdf_url'],
  func: async (_page: unknown, kwargs: Record<string, any>) => {
    try {
      const result = await getPdfMetadata({ id: kwargs.id });
      return {
        id: result.id,
        title: result.title,
        pdf_url: result.pdfUrl,
        detail_url: result.detailUrl,
      };
    } catch (error) {
      throw asCliError(error);
    }
  },
});
