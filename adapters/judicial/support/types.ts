export interface ViewStatePayload {
  __VIEWSTATE: string;
  __VIEWSTATEGENERATOR: string;
  __EVENTVALIDATION: string;
}

export type SearchSort = 'DS' | 'DB' | 'LG' | 'LB' | 'KG' | 'KB';

export type CourtLevel = 'constitutional' | 'supreme' | 'high' | 'district' | 'special';

export type CourtRegion = 'north' | 'central' | 'south' | 'east' | 'outlying' | 'national';

export interface CourtRecord {
  code: string;
  officialName: string;
  aliases: string[];
  level: CourtLevel;
  region: CourtRegion;
  supportsCaseTypes: string[];
}

export interface DateParts {
  year: string;
  month: string;
  day: string;
}

export interface SearchResultItem {
  rank: number;
  id: string;
  title: string;
  date: string;
  cause: string;
  summary: string;
  sizeKb: number | null;
  detailUrl: string;
  pdfUrl: string;
}

export interface SearchPage {
  items: SearchResultItem[];
  page: number;
  totalPages: number;
  totalCount: number;
  nextPageUrl: string | null;
}

export interface SearchParams {
  query: string;
  page?: number;
  sort?: SearchSort;
  limit?: number;
}

export interface AdvancedSearchParams {
  courts?: string;
  courtLevels?: string;
  regions?: string;
  caseTypes?: string;
  caseYear?: string;
  caseWord?: string;
  caseNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  cause?: string;
  holding?: string;
  fulltext?: string;
  sizeMinKb?: number;
  sizeMaxKb?: number;
  page?: number;
  sort?: SearchSort;
  limit?: number;
}

export interface ReadParams {
  id: string;
}

export interface ReadBatchParams {
  ids: string[];
  concurrency?: number;
}

export interface ReadResult {
  id: string;
  title: string;
  date: string;
  cause: string;
  text: string;
  pdfUrl: string;
  printUrl: string;
}

export interface PdfResult {
  id: string;
  title: string;
  pdfUrl: string;
  detailUrl: string;
}

export type ExportFormat = 'csv' | 'md';

export interface ExportResult {
  format: ExportFormat;
  inputPath: string;
  outputPath: string;
  recordCount: number;
}
