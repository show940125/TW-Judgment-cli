import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

import {
  extractResultListPath,
  parseDetailHtml,
  parseResultListHtml,
  parseViewStatePayload,
} from '../adapters/judicial/support/parser.js';

function fixture(name: string): string {
  return readFileSync(resolve(process.cwd(), 'fixtures', name), 'utf8');
}

describe('judicial parser', () => {
  test('parses ASP.NET hidden fields from default page', () => {
    const payload = parseViewStatePayload(fixture('default-page.html'));

    expect(payload).toEqual({
      __VIEWSTATE: 'VIEWSTATE_TOKEN',
      __VIEWSTATEGENERATOR: 'GEN123',
      __EVENTVALIDATION: 'EVENT456',
    });
  });

  test('extracts the result list path with q token', () => {
    const path = extractResultListPath(fixture('search-entry.html'));

    expect(path).toBe('/FJUD/qryresultlst.aspx?ty=JUDBOOK&q=70829f2ea883f3e5e9affd3bd8be8e88');
  });

  test('parses list rows, pagination, and pdf metadata', () => {
    const result = parseResultListHtml(
      fixture('result-list.html'),
      'https://judgment.judicial.gov.tw/FJUD/qryresultlst.aspx?q=70829f2ea883f3e5e9affd3bd8be8e88&sort=DS&page=2'
    );

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(5);
    expect(result.totalCount).toBe(97);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      rank: 1,
      id: 'TPDV,105,訴,123,20200630,4',
      title: '臺灣臺北地方法院 105 年度 訴 字第 123 號民事判決',
      date: '109.06.30',
      cause: '給付貨款',
      sizeKb: 30,
      summary: '臺灣臺北地方法院民事判決105年度訴字第123號原告即反訴被告國玉星企業有限公司...',
      detailUrl: 'https://judgment.judicial.gov.tw/FJUD/data.aspx?ty=JD&id=TPDV%2c105%2c%e8%a8%b4%2c123%2c20200630%2c4&ot=in',
      pdfUrl: 'https://judgment.judicial.gov.tw/FILES/TPDV/105%2c%e8%a8%b4%2c123%2c20200630%2c4.pdf',
    });
    expect(result.nextPageUrl).toBe(
      'https://judgment.judicial.gov.tw/FJUD/qryresultlst.aspx?q=70829f2ea883f3e5e9affd3bd8be8e88&sort=DS&page=3'
    );
  });

  test('parses detail page text and export links', () => {
    const result = parseDetailHtml(
      fixture('detail-page.html'),
      'https://judgment.judicial.gov.tw/FJUD/data.aspx?ty=JD&id=TPDV%2c105%2c%e8%a8%b4%2c123%2c20200630%2c4&ot=in'
    );

    expect(result).toMatchObject({
      id: 'TPDV,105,訴,123,20200630,4',
      title: '臺灣臺北地方法院 105 年度訴字第 123 號民事判決',
      date: '民國 109 年 06 月 30 日',
      cause: '給付貨款',
      pdfUrl: 'https://judgment.judicial.gov.tw/FILES/TPDV/105%2c%e8%a8%b4%2c123%2c20200630%2c4.pdf',
      printUrl: 'https://judgment.judicial.gov.tw/FJUD/printData.aspx?id=TPDV%2c105%2c%e8%a8%b4%2c123%2c20200630%2c4',
    });
    expect(result.text).toContain('臺灣臺北地方法院民事判決');
    expect(result.text).toContain('被告應給付原告新臺幣參佰捌拾肆萬貳仟肆佰零柒元');
  });
});
