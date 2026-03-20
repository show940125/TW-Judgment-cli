import { extractResultListPath, parseDetailHtml, parseResultListHtml, parseViewStatePayload } from './parser.js';
import type { PdfResult, ReadParams, ReadResult, SearchPage, SearchParams } from './types.js';

const BASE_URL = 'https://judgment.judicial.gov.tw';
const SEARCH_URL = `${BASE_URL}/FJUD/default.aspx`;

function createJudgmentError(code: string, message: string): Error {
  const error = new Error(`${code}: ${message}`);
  error.name = code;
  return error;
}

async function fetchHtml(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw createJudgmentError('UPSTREAM_CHANGED', `unexpected response ${response.status} for ${url}`);
  }
  return response.text();
}

function ensurePageLooksValid(html: string): void {
  if (/系統更新|重新整理/.test(html) && !/__VIEWSTATE|qryresultlst\.aspx|hlExportPDF/.test(html)) {
    throw createJudgmentError('UPSTREAM_MAINTENANCE', 'judgment site appears to be in maintenance mode');
  }
}

function normalizeId(id: string): string {
  return id.trim();
}

function detailUrlFromId(id: string): string {
  const normalized = normalizeId(id)
    .split(',')
    .map((part) => encodeURIComponent(part).replace(/%[0-9A-F]{2}/g, (token) => token.toLowerCase()))
    .join('%2c');
  return `${BASE_URL}/FJUD/data.aspx?ty=JD&id=${normalized}&ot=in`;
}

export async function searchJudgments(params: SearchParams): Promise<SearchPage> {
  const page = params.page ?? 1;
  const sort = params.sort ?? 'DS';
  const limit = params.limit ?? 20;
  const query = params.query?.trim();
  if (!query) {
    throw createJudgmentError('PARSE_ERROR', 'query is required');
  }

  const defaultHtml = await fetchHtml(SEARCH_URL);
  ensurePageLooksValid(defaultHtml);
  const viewState = parseViewStatePayload(defaultHtml);
  const formBody = new URLSearchParams({
    ...viewState,
    __VIEWSTATEENCRYPTED: '',
    txtKW: query,
    judtype: 'JUDBOOK',
    whosub: '0',
    'ctl00$cp_content$btnSimpleQry': '送出查詢',
  });

  const searchHtml = await fetchHtml(SEARCH_URL, {
    method: 'POST',
    body: formBody,
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
  });
  ensurePageLooksValid(searchHtml);

  const resultPath = extractResultListPath(searchHtml);
  const resultUrl = new URL(resultPath, BASE_URL);
  resultUrl.searchParams.set('sort', sort);
  resultUrl.searchParams.set('page', String(page));

  const resultHtml = await fetchHtml(resultUrl.toString());
  ensurePageLooksValid(resultHtml);
  const parsed = parseResultListHtml(resultHtml, resultUrl.toString());

  if (parsed.items.length === 0) {
    throw createJudgmentError('NOT_FOUND', `no judgments found for query "${query}"`);
  }

  return {
    ...parsed,
    items: parsed.items.slice(0, limit),
  };
}

export async function readJudgment(params: ReadParams): Promise<ReadResult> {
  const detailUrl = detailUrlFromId(params.id);
  const html = await fetchHtml(detailUrl);
  ensurePageLooksValid(html);
  return parseDetailHtml(html, detailUrl);
}

export async function getPdfMetadata(params: ReadParams): Promise<PdfResult> {
  const judgment = await readJudgment(params);
  return {
    id: judgment.id,
    title: judgment.title,
    pdfUrl: judgment.pdfUrl,
    detailUrl: detailUrlFromId(params.id),
  };
}
