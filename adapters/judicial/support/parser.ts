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

function matchOptional(source: string, pattern: RegExp): string | null {
  const match = source.match(pattern);
  return match?.[1] ? decodeHtml(match[1]).trim() : null;
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
  if (parts.length === 5) {
    const encodedId = parts.map((part) => encodePathPart(part)).join('%2c');
    return `${BASE_URL}/EXPORTFILE/ExportToPdf.aspx?type=JD&id=${encodedId}`;
  }
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

export function extractResultListPath(html: string): string | null {
  if (/ErrorPage\.aspx\?frm=iframe(?:&amp;|&)err=Q003/i.test(html)) {
    return null;
  }
  const href = matchRequired(html, /href="(qryresultlst\.aspx\?[^"]*q=[^"]+)"/i, 'result list href');
  return href.startsWith('/') ? href : `/FJUD/${href}`;
}

export function parseResultListHtml(html: string, currentUrl: string): SearchPage {
  const items: SearchResultItem[] = [];
  const rowBlocks = [...html.matchAll(/<tr>\s*<td[^>]*>(\d+)\.<\/td>([\s\S]*?)<\/tr>\s*<tr class="summary">([\s\S]*?)<\/tr>/gi)];

  for (const block of rowBlocks) {
    const rank = Number(block[1]);
    const rowHtml = block[2];
    const summary = stripInlineTags(block[3]);
    const href = matchOptional(rowHtml, /href="([^"]+)"/i);
    if (!href) {
      continue;
    }
    const title = stripTags(matchRequired(rowHtml, /<a[^>]*>([\s\S]*?)<\/a>/i, 'row title'));
    const sizeMatch = rowHtml.match(/<\/a>（(\d+)K）/i);
    const sizeKb = sizeMatch?.[1] ? Number(sizeMatch[1]) : 0;
    const scanOnly = /全文為掃描檔/.test(summary);
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
      scanOnly,
      detailUrl,
      pdfUrl: buildPdfUrlFromId(id),
    });
  }

  if (items.length === 0) {
    throw new Error('PARSE_ERROR: missing result rows');
  }

  const pageMatch = html.match(/共\s*(\d+)\s*筆\s*\.\s*現在第\s*(\d+)\s*\/\s*(\d+)\s*頁/);
  const nextMatch = html.match(/id="hlNext"[^>]*href="([^"]+)"/i);
  const parsedCurrentUrl = new URL(currentUrl);
  const currentPage = Number(parsedCurrentUrl.searchParams.get('page') || '1');

  return {
    items,
    totalCount: pageMatch ? Number(pageMatch[1]) : items.length,
    page: pageMatch ? Number(pageMatch[2]) : currentPage,
    totalPages: pageMatch ? Number(pageMatch[3]) : 1,
    nextPageUrl: nextMatch ? absolutize(decodeHtml(nextMatch[1])) : null,
  };
}

export function parseDetailHtml(html: string, currentUrl: string): ReadResult {
  const id = extractIdFromDetailUrl(currentUrl);
  const title = matchRequired(html, /<title>\s*([\s\S]*?)\s*<\/title>/i, 'detail title');
  const date = stripTags(matchRequired(html, /<div class="col-th">裁判日期：<\/div>\s*<div class="col-td">\s*([\s\S]*?)<\/div>/i, 'detail date'));
  const cause = stripTags(matchRequired(html, /<div class="col-th">裁判案由：<\/div>\s*<div class="col-td">\s*([\s\S]*?)<\/div>/i, 'detail cause'));
  const pdfHref = matchOptional(html, /id="hlExportPDF"[^>]*href="([^"]+)"/i);
  const pdfUrl = pdfHref ? absolutize(pdfHref) : buildPdfUrlFromId(id);
  const rawPrintUrl = matchOptional(html, /id="hlPrint"[^>]*href="([^"]+)"/i);
  const rawText = matchOptional(html, /<div class="htmlcontent">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
  const text = rawText ? stripTags(rawText) : '';

  return {
    id,
    title: stripTags(title),
    date,
    cause,
    text,
    hasTextLayer: Boolean(text),
    scanOnly: !text && Boolean(pdfUrl),
    pdfUrl,
    printUrl: rawPrintUrl ? absolutize(rawPrintUrl) : null,
  };
}
