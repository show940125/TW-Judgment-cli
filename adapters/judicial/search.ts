import { cli, Strategy } from '../../opencli-shims/registry.mjs';

import { asCliError } from './support/cli-error.js';
import { searchJudgments } from './support/service.js';

cli({
  site: 'judicial',
  name: 'search',
  description: 'Search Taiwan Judicial judgments by keyword',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'query', required: true, help: 'Keyword, case number, or free text query' },
    { name: 'page', type: 'int', default: 1, help: 'Result page number' },
    { name: 'sort', default: 'DS', help: 'Sort order: DS, DB, LG, LB, KG, KB' },
    { name: 'limit', type: 'int', default: 20, help: 'Maximum rows to return from the selected page' },
  ],
  columns: ['rank', 'title', 'date', 'cause', 'size_kb', 'id', 'pdf_url'],
  func: async (_page: unknown, kwargs: Record<string, any>) => {
    try {
      const result = await searchJudgments({
        query: kwargs.query,
        page: kwargs.page,
        sort: kwargs.sort,
        limit: kwargs.limit,
      });
      return result.items.map((item) => ({
        rank: item.rank,
        title: item.title,
        date: item.date,
        cause: item.cause,
        size_kb: item.sizeKb,
        id: item.id,
        summary: item.summary,
        detail_url: item.detailUrl,
        pdf_url: item.pdfUrl,
      }));
    } catch (error) {
      throw asCliError(error);
    }
  },
});
