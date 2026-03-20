import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { exportResults } from '../adapters/judicial/support/export.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('export helpers', () => {
  test('exports search results to csv beside the input file by default', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'twjud-export-'));
    tempDirs.push(dir);
    const inputPath = join(dir, 'search.json');
    writeFileSync(inputPath, JSON.stringify([
      {
        rank: 1,
        id: 'CYDM,115,金訴,204,20260319,1',
        title: '臺灣嘉義地方法院 115 年度金訴字第 204 號刑事判決',
        date: '115.03.19',
        cause: '加重詐欺等',
        summary: '詐騙摘要',
        size_kb: 11,
        detail_url: 'https://example.test/detail',
        pdf_url: 'https://example.test/file.pdf',
      },
    ], null, 2), 'utf8');

    const result = await exportResults({ input: inputPath, format: 'csv' });
    const output = readFileSync(result.outputPath, 'utf8');

    expect(result.outputPath).toBe(join(dir, 'search.csv'));
    expect(output).toContain('rank,id,title,date,cause,summary,size_kb,detail_url,pdf_url');
    expect(output).toContain('CYDM,115,金訴,204,20260319,1');
  });

  test('exports read-batch results to markdown dossier', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'twjud-export-'));
    tempDirs.push(dir);
    const inputPath = join(dir, 'reads.json');
    writeFileSync(inputPath, JSON.stringify([
      {
        id: 'CYDM,115,金訴,204,20260319,1',
        title: '臺灣嘉義地方法院 115 年度金訴字第 204 號刑事判決',
        date: '民國 115 年 03 月 19 日',
        cause: '加重詐欺等',
        text: '第一段。第二段。',
        pdf_url: 'https://example.test/file.pdf',
        print_url: 'https://example.test/print',
      },
    ], null, 2), 'utf8');

    const result = await exportResults({ input: inputPath, format: 'md' });
    const output = readFileSync(result.outputPath, 'utf8');

    expect(result.outputPath).toBe(join(dir, 'reads.md'));
    expect(output).toContain('# 裁判書匯出');
    expect(output).toContain('## 1. 臺灣嘉義地方法院 115 年度金訴字第 204 號刑事判決');
    expect(output).toContain('PDF: https://example.test/file.pdf');
    expect(output).toContain('第一段。第二段。');
  });
});
