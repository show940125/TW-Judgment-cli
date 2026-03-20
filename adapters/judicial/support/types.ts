export interface ViewStatePayload {
  __VIEWSTATE: string;
  __VIEWSTATEGENERATOR: string;
  __EVENTVALIDATION: string;
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
  sort?: 'DS' | 'DB' | 'LG' | 'LB' | 'KG' | 'KB';
  limit?: number;
}

export interface ReadParams {
  id: string;
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
