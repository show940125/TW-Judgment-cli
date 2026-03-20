import fs from 'node:fs/promises';
import path from 'node:path';

import type { ExportFormat, ExportResult, ReadResult, SearchResultItem } from './types.js';

type SearchLikeRecord = SearchResultItem | {
  rank: number;
  id: string;
  title: string;
  date: string;
  cause: string;
  summary: string;
  size_kb?: number | null;
  detail_url: string;
  pdf_url: string;
};

type ReadLikeRecord = ReadResult | {
  id: string;
  title: string;
  date: string;
  cause: string;
  text: string;
  pdf_url: string;
  print_url: string;
};

type ExportableRecord = SearchLikeRecord | ReadLikeRecord;

function createExportError(message: string): Error {
  const error = new Error(`INVALID_ARGUMENT: ${message}`);
  error.name = 'INVALID_ARGUMENT';
  return error;
}

function isSearchResult(item: ExportableRecord): item is SearchResultItem {
  return 'summary' in item;
}

function isReadResult(item: ExportableRecord): item is ReadResult {
  return 'text' in item;
}

function normalizeSearchItem(item: SearchLikeRecord): SearchResultItem {
  return {
    rank: item.rank,
    id: item.id,
    title: item.title,
    date: item.date,
    cause: item.cause,
    summary: item.summary,
    sizeKb: 'sizeKb' in item ? item.sizeKb : (item.size_kb ?? null),
    detailUrl: 'detailUrl' in item ? item.detailUrl : item.detail_url,
    pdfUrl: 'pdfUrl' in item ? item.pdfUrl : item.pdf_url,
  };
}

function normalizeReadItem(item: ReadLikeRecord): ReadResult {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    cause: item.cause,
    text: item.text,
    pdfUrl: 'pdfUrl' in item ? item.pdfUrl : item.pdf_url,
    printUrl: 'printUrl' in item ? item.printUrl : item.print_url,
  };
}

function escapeCsv(value: unknown): string {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function changeExtension(filePath: string, extension: string): string {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}.${extension}`);
}

function renderSearchCsv(items: SearchResultItem[]): string {
  const header = 'rank,id,title,date,cause,summary,size_kb,detail_url,pdf_url';
  const rows = items.map((item) => [
    item.rank,
    item.id,
    item.title,
    item.date,
    item.cause,
    item.summary,
    item.sizeKb ?? '',
    item.detailUrl,
    item.pdfUrl,
  ].map(escapeCsv).join(','));
  return [header, ...rows].join('\n');
}

function renderReadCsv(items: ReadResult[]): string {
  const header = 'id,title,date,cause,text_length,pdf_url,print_url';
  const rows = items.map((item) => [
    item.id,
    item.title,
    item.date,
    item.cause,
    item.text.length,
    item.pdfUrl,
    item.printUrl,
  ].map(escapeCsv).join(','));
  return [header, ...rows].join('\n');
}

function renderSearchMarkdown(items: SearchResultItem[]): string {
  const lines = ['# 裁判書匯出', ''];
  for (const item of items) {
    lines.push(`## ${item.rank}. ${item.title}`);
    lines.push(`- 日期：${item.date}`);
    lines.push(`- 案由：${item.cause}`);
    lines.push(`- ID：${item.id}`);
    lines.push(`- PDF：${item.pdfUrl}`);
    lines.push(`- 詳細頁：${item.detailUrl}`);
    lines.push('');
    lines.push(item.summary);
    lines.push('');
  }
  return lines.join('\n');
}

function renderReadMarkdown(items: ReadResult[]): string {
  const lines = ['# 裁判書匯出', ''];
  items.forEach((item, index) => {
    lines.push(`## ${index + 1}. ${item.title}`);
    lines.push(`- 日期：${item.date}`);
    lines.push(`- 案由：${item.cause}`);
    lines.push(`- ID：${item.id}`);
    lines.push(`- PDF: ${item.pdfUrl}`);
    lines.push(`- Print: ${item.printUrl}`);
    lines.push('');
    lines.push(item.text);
    lines.push('');
  });
  return lines.join('\n');
}

export async function exportResults(params: { input: string; format: ExportFormat; output?: string }): Promise<ExportResult> {
  const inputText = await fs.readFile(params.input, 'utf8');
  const parsed = JSON.parse(inputText) as unknown;

  if (!Array.isArray(parsed) || parsed.length === 0 || typeof parsed[0] !== 'object' || parsed[0] == null) {
    throw createExportError('input JSON must be a non-empty array');
  }

  const items = parsed as ExportableRecord[];
  const format = params.format;
  const outputPath = params.output ? path.resolve(params.output) : changeExtension(path.resolve(params.input), format);
  const content = isSearchResult(items[0])
    ? (() => {
        const normalized = (items as SearchLikeRecord[]).map(normalizeSearchItem);
        return format === 'csv' ? renderSearchCsv(normalized) : renderSearchMarkdown(normalized);
      })()
    : isReadResult(items[0])
      ? (() => {
          const normalized = (items as ReadLikeRecord[]).map(normalizeReadItem);
          return format === 'csv' ? renderReadCsv(normalized) : renderReadMarkdown(normalized);
        })()
      : (() => {
          throw createExportError('input JSON must contain search results or read results');
        })();

  await fs.writeFile(outputPath, content, 'utf8');

  return {
    format,
    inputPath: path.resolve(params.input),
    outputPath,
    recordCount: items.length,
  };
}
