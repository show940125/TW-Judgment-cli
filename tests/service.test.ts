import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { getPdfMetadata, readJudgment, searchJudgments } from '../adapters/judicial/support/service.js';

function fixture(name: string): string {
  return readFileSync(resolve(process.cwd(), 'fixtures', name), 'utf8');
}

function htmlResponse(body: string, url: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('judicial service', () => {
  test('searchJudgments performs the WebForms query chain', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/FJUD/default.aspx') && !init?.method) {
        return htmlResponse(fixture('default-page.html'), url);
      }
      if (url.endsWith('/FJUD/default.aspx') && init?.method === 'POST') {
        const body = init.body as URLSearchParams;
        expect(body.get('txtKW')).toBe('105訴123');
        expect(body.get('judtype')).toBe('JUDBOOK');
        expect(body.get('__VIEWSTATE')).toBe('VIEWSTATE_TOKEN');
        return htmlResponse(fixture('search-entry.html'), url);
      }
      if (url.includes('/FJUD/qryresultlst.aspx')) {
        return htmlResponse(fixture('result-list.html'), url);
      }
      throw new Error(`unexpected url ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await searchJudgments({ query: '105訴123', page: 2, sort: 'DS', limit: 20 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('TPDV,105,訴,123,20200630,4');
  });

  test('readJudgment returns a normalized document record', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => htmlResponse(fixture('detail-page.html'), 'https://judgment.judicial.gov.tw/FJUD/data.aspx?ty=JD&id=TPDV%2c105%2c%e8%a8%b4%2c123%2c20200630%2c4&ot=in')));

    const result = await readJudgment({ id: 'TPDV,105,訴,123,20200630,4' });

    expect(result.id).toBe('TPDV,105,訴,123,20200630,4');
    expect(result.pdfUrl).toContain('/FILES/TPDV/');
    expect(result.text).toContain('原告起訴主張系爭設櫃契約');
  });

  test('getPdfMetadata derives pdf data from the detail page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => htmlResponse(fixture('detail-page.html'), 'https://judgment.judicial.gov.tw/FJUD/data.aspx?ty=JD&id=TPDV%2c105%2c%e8%a8%b4%2c123%2c20200630%2c4&ot=in')));

    const result = await getPdfMetadata({ id: 'TPDV,105,訴,123,20200630,4' });

    expect(result).toMatchObject({
      id: 'TPDV,105,訴,123,20200630,4',
      title: '臺灣臺北地方法院 105 年度訴字第 123 號民事判決',
      pdfUrl: 'https://judgment.judicial.gov.tw/FILES/TPDV/105%2c%e8%a8%b4%2c123%2c20200630%2c4.pdf',
    });
  });
});
