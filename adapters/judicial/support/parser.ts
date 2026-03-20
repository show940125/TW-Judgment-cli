import type { ReadResult, SearchPage, SearchResultItem, ViewStatePayload } from './types.js';

const BASE_URL = 'https://judgment.judicial.gov.tw';

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(parseInt(num, 10)));
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function stripInlineTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function encodePathPart(value: string): string {
  return encodeURIComponent(value).replace(/%[0-9A-F]{2}/g, (token) => token.toLowerCase());
}

function absolutize(url: string): string {
  return new URL(url, `${BASE_URL}/FJUD/`).toString();
}

function matchRequired(source: string, pattern: RegExp, field: string): string {
  const match = source.match(pattern);
  if (!match?.[1]) {
    throw new Error(`PARSE_ERROR: missing ${field}`);
  }
  return decodeHtml(match[1]).trim();
}

function extractIdFromDetailUrl(detailUrl: string): string {
  const parsed = new URL(detailUrl);
  const id = parsed.searchParams.get('id');
  if (!id) {
    throw new Error('PARSE_ERROR: missing detail id');
  }
  return decodeURIComponent(id);
}

function buildPdfUrlFromId(id: string): string {
  const parts = id.split(',');
  if (parts.length < 6) {
    throw new Error('PARSE_ERROR: invalid judgment id');
  }
  const folder = encodePathPart(parts[0]);
  const tail = parts.slice(1).map((part) => encodePathPart(part)).join('%2c');
  return `${BASE_URL}/FILES/${folder}/${tail}.pdf`;
}

export function parseViewStatePayload(html: string): ViewStatePayload {
  return {
    __VIEWSTATE: matchRequired(html, /id="__VIEWSTATE"[^>]*value="([^"]+)"/i, '__VIEWSTATE'),
    __VIEWSTATEGENERATOR: matchRequired(html, /id="__VIEWSTATEGENERATOR"[^>]*value="([^"]+)"/i, '__VIEWSTATEGENERATOR'),
    __EVENTVALIDATION: matchRequired(html, /id="__EVENTVALIDATION"[^>]*value="([^"]+)"/i, '__EVENTVALIDATION'),
  };
}

export function extractResultListPath(html: string): string {
  const href = matchRequired(html, /href="(qryresultlst\.aspx\?[^"]*q=[^"]+)"/i, 'result list href');
  return href.startsWith('/') ? href : `/FJUD/${href}`;
}

export function parseResultListHtml(html: string, currentUrl: string): SearchPage {
  const pageMatch = html.match(/共\s*(\d+)\s*筆\s*\.\s*現在第\s*(\d+)\s*\/\s*(\d+)\s*頁/);
  if (!pageMatch) {
    throw new Error('PARSE_ERROR: missing pagination');
  }

  const items: SearchResultItem[] = [];
  const rowBlocks = [...html.matchAll(/<tr>\s*<td[^>]*>(\d+)\.<\/td>([\s\S]*?)<\/tr>\s*<tr class="summary">([\s\S]*?)<\/tr>/gi)];

  for (const block of rowBlocks) {
    const rank = Number(block[1]);
    const rowHtml = block[2];
    const summary = stripInlineTags(block[3]);
    const href = matchRequired(rowHtml, /href="([^"]+)"/i, 'detail href');
    const title = stripTags(matchRequired(rowHtml, />([\s\S]*?)<\/a>（\d+K）/i, 'row title'));
    const sizeKb = Number(matchRequired(rowHtml, /<\/a>（(\d+)K）/i, 'size'));
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => stripTags(cell[1])).filter(Boolean);
    if (cells.length < 3) {
      throw new Error('PARSE_ERROR: incomplete result row');
    }
    const detailUrl = absolutize(decodeHtml(href));
    const id = extractIdFromDetailUrl(detailUrl);
    items.push({
      rank,
      id,
      title,
      sizeKb,
      date: cells[1],
      cause: cells[2],
      summary,
      detailUrl,
      pdfUrl: buildPdfUrlFromId(id),
    });
  }

  const nextMatch = html.match(/id="hlNext"[^>]*href="([^"]+)"/i);

  return {
    items,
    totalCount: Number(pageMatch[1]),
    page: Number(pageMatch[2]),
    totalPages: Number(pageMatch[3]),
    nextPageUrl: nextMatch ? absolutize(decodeHtml(nextMatch[1])) : null,
  };
}

export function parseDetailHtml(html: string, currentUrl: string): ReadResult {
  const title = matchRequired(html, /<title>\s*([\s\S]*?)\s*<\/title>/i, 'detail title');
  const date = stripTags(matchRequired(html, /<div class="col-th">裁判日期：<\/div>\s*<div class="col-td">\s*([\s\S]*?)<\/div>/i, 'detail date'));
  const cause = stripTags(matchRequired(html, /<div class="col-th">裁判案由：<\/div>\s*<div class="col-td">\s*([\s\S]*?)<\/div>/i, 'detail cause'));
  const pdfUrl = absolutize(matchRequired(html, /id="hlExportPDF"[^>]*href="([^"]+)"/i, 'pdf href'));
  const printUrl = absolutize(matchRequired(html, /id="hlPrint"[^>]*href="([^"]+)"/i, 'print href'));
  const rawText = matchRequired(html, /<div class="htmlcontent">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i, 'detail text');

  return {
    id: extractIdFromDetailUrl(currentUrl),
    title: stripTags(title),
    date,
    cause,
    text: stripTags(rawText),
    pdfUrl,
    printUrl,
  };
}
