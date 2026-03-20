import { cli, Strategy } from '../../opencli-shims/registry.mjs';

import { asCliError } from './support/cli-error.js';
import { openExternalUrl } from './support/open-url.js';
import { getPdfMetadata } from './support/service.js';

cli({
  site: 'judicial',
  name: 'open',
  description: 'Open a Taiwan Judicial judgment in the browser or PDF viewer',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'id', required: true, help: 'Judgment id from judicial search output' },
    { name: 'target', default: 'web', help: 'Open the detail page (web) or the PDF (pdf)' },
  ],
  columns: ['id', 'target', 'url'],
  func: async (_page: unknown, kwargs: Record<string, any>) => {
    try {
      const result = await getPdfMetadata({ id: kwargs.id });
      const url = kwargs.target === 'pdf' ? result.pdfUrl : result.detailUrl;
      await openExternalUrl(url);
      return {
        id: result.id,
        target: kwargs.target,
        url,
      };
    } catch (error) {
      throw asCliError(error);
    }
  },
});
