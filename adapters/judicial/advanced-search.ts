import { cli, Strategy } from '../../opencli-shims/registry.mjs';

import { asCliError } from './support/cli-error.js';
import { advancedSearchJudgments } from './support/service.js';

cli({
  site: 'judicial',
  name: 'advanced-search',
  description: 'Run Taiwan Judicial advanced search with structured filters',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'courts', help: 'Comma-separated court names, aliases, or court codes' },
    { name: 'court-levels', help: 'Comma-separated levels: constitutional, supreme, high, district, special' },
    { name: 'regions', help: 'Comma-separated regions: north, central, south, east, outlying, national' },
    { name: 'case-types', help: 'Comma-separated case types: constitutional, civil, criminal, administrative, disciplinary' },
    { name: 'case-year', help: 'Case year, usually ROC year' },
    { name: 'case-word', help: 'Case word, for example 金訴 or 上訴' },
    { name: 'case-number', help: 'Case number, for example 204' },
    { name: 'date-from', help: 'Start judgment date in YYYY-MM-DD or ROC YYYY-MM-DD' },
    { name: 'date-to', help: 'End judgment date in YYYY-MM-DD or ROC YYYY-MM-DD' },
    { name: 'cause', help: 'Judgment cause keyword' },
    { name: 'holding', help: 'Holding or operative part keyword' },
    { name: 'fulltext', help: 'Full-text keyword query' },
    { name: 'size-min-kb', type: 'int', help: 'Minimum judgment size in KB' },
    { name: 'size-max-kb', type: 'int', help: 'Maximum judgment size in KB' },
    { name: 'page', type: 'int', default: 1, help: 'Result page number' },
    { name: 'sort', default: 'DS', help: 'Sort order: DS, DB, LG, LB, KG, KB' },
    { name: 'limit', type: 'int', default: 20, help: 'Maximum rows to return from the selected page' },
  ],
  columns: ['rank', 'title', 'date', 'cause', 'size_kb', 'id', 'pdf_url'],
  func: async (_page: unknown, kwargs: Record<string, any>) => {
    try {
      const result = await advancedSearchJudgments({
        courts: kwargs.courts,
        courtLevels: kwargs['court-levels'],
        regions: kwargs.regions,
        caseTypes: kwargs['case-types'],
        caseYear: kwargs['case-year'],
        caseWord: kwargs['case-word'],
        caseNumber: kwargs['case-number'],
        dateFrom: kwargs['date-from'],
        dateTo: kwargs['date-to'],
        cause: kwargs.cause,
        holding: kwargs.holding,
        fulltext: kwargs.fulltext,
        sizeMinKb: kwargs['size-min-kb'],
        sizeMaxKb: kwargs['size-max-kb'],
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
        scan_only: item.scanOnly,
        detail_url: item.detailUrl,
        pdf_url: item.pdfUrl,
      }));
    } catch (error) {
      throw asCliError(error);
    }
  },
});
