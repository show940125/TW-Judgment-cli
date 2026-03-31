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

  test('parses ASP.NET hidden fields from advanced search page', () => {
    const payload = parseViewStatePayload(fixture('advanced-page.html'));

    expect(payload).toEqual({
      __VIEWSTATE: 'ADV_VIEWSTATE',
      __VIEWSTATEGENERATOR: 'ADV_GENERATOR',
      __EVENTVALIDATION: 'ADV_EVENT',
    });
  });

  test('extracts the result list path with q token', () => {
    const path = extractResultListPath(fixture('search-entry.html'));

    expect(path).toBe('/FJUD/qryresultlst.aspx?ty=JUDBOOK&q=70829f2ea883f3e5e9affd3bd8be8e88');
  });

  test('returns null when no-result iframe is embedded', () => {
    const html = `
      <html>
        <body>
          <form method="post" action="qryresult.aspx" id="form1">
            <iframe src="../ErrorPage.aspx?frm=iframe&amp;err=Q003"></iframe>
          </form>
        </body>
      </html>
    `;

    expect(extractResultListPath(html)).toBeNull();
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

  test('falls back to a single-page result list when pagination text is absent', () => {
    const result = parseResultListHtml(
      fixture('result-list-single-page.html'),
      'https://judgment.judicial.gov.tw/FJUD/qryresultlst.aspx?q=singlepage&sort=DS&page=1'
    );

    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.totalCount).toBe(1);
    expect(result.nextPageUrl).toBeNull();
    expect(result.items[0]?.id).toBe('CYDM,115,金訴,204,20260319,1');
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

  test('parses legacy 5-part ids and export pdf urls', () => {
    const html = `
      <table>
        <tr>
          <td>1.</td>
          <td><a id="hlTitle" href="data.aspx?ty=JD&amp;id=TPSV%2c103%2c%e5%8f%b0%e4%b8%8a%2c880%2c20140508&amp;ot=in">最高法院 103 年度 台上 字第 880 號民事判決</a>（10K）</td>
          <td>103.05.08</td>
          <td width="30%">回復繼承權等</td>
        </tr>
        <tr class="summary">
          <td colspan="4">舊制最高法院民事判決結果列。</td>
        </tr>
      </table>
    `;

    const result = parseResultListHtml(
      html,
      'https://judgment.judicial.gov.tw/FJUD/qryresultlst.aspx?ty=JUDBOOK&q=demo&sort=DS&page=1'
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'TPSV,103,台上,880,20140508',
      sizeKb: 10,
      scanOnly: false,
    });
    expect(result.items[0]?.pdfUrl).toContain('ExportToPdf.aspx?type=JD&id=TPSV');
  });

  test('supports legacy scan-only rows without size marker', () => {
    const html = `
      <table>
        <tr>
          <td>1.</td>
          <td><a id="hlTitle" href="data.aspx?ty=JD&amp;id=TPSV%2c55%2c%e5%8f%b0%e4%b8%8a%2c228%2c19660204%2c1&amp;ot=in">最高法院 55 年度 台上 字第 228 號民事判決</a></td>
          <td>55.02.04</td>
          <td width="30%">請求返還豬鬃</td>
        </tr>
        <tr class="summary">
          <td colspan="4">全文為掃描檔</td>
        </tr>
      </table>
    `;

    const result = parseResultListHtml(
      html,
      'https://judgment.judicial.gov.tw/FJUD/qryresultlst.aspx?ty=JUDBOOK&q=demo&sort=DS&page=1'
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'TPSV,55,台上,228,19660204,1',
      sizeKb: 0,
      scanOnly: true,
    });
  });

  test('skips masked rows without detail href', () => {
    const html = `
      <table>
        <tr>
          <td>1.</td>
          <td><a id="hlTitle" class="hlTitle_scroll">最高法院 103 年度 台上 字第 2253 號民事判決</a>（9K）</td>
          <td>103.10.30</td>
          <td width="30%">請求分配剩餘財產差額等</td>
        </tr>
        <tr class="summary">
          <td colspan="4">【103台上2253】本件經程式判定為依法不得公開。</td>
        </tr>
        <tr>
          <td>2.</td>
          <td><a id="hlTitle" href="data.aspx?ty=JD&amp;id=TPSV%2c103%2c%e5%8f%b0%e4%b8%8a%2c2253%2c20141030%2c1&amp;ot=in">最高法院 103 年度 台上 字第 2253 號民事判決</a>（9K）</td>
          <td>103.10.30</td>
          <td width="30%">請求分配剩餘財產差額等</td>
        </tr>
        <tr class="summary">
          <td colspan="4">上列當事人間請求分配剩餘財產差額等事件。</td>
        </tr>
      </table>
    `;

    const result = parseResultListHtml(
      html,
      'https://judgment.judicial.gov.tw/FJUD/qryresultlst.aspx?ty=JUDBOOK&q=demo&sort=DS&page=1'
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      rank: 2,
      id: 'TPSV,103,台上,2253,20141030,1',
    });
  });

  test('tolerates missing print href and empty text layer on legacy detail pages', () => {
    const html = `
      <html>
        <head><title>最高法院 103 年度台上字第 880 號民事判決</title></head>
        <body>
          <div class="col-th">裁判日期：</div><div class="col-td">103.05.08</div>
          <div class="col-th">裁判案由：</div><div class="col-td">回復繼承權等</div>
          <a id="hlPrint" class="btn btn-default btn-xs btn-print" title="友善列印" target="_blank">友善列印</a>
          <a id="hlExportPDF" href="/EXPORTFILE/ExportToPdf.aspx?type=JD&amp;id=TPSV%2c103%2c%e5%8f%b0%e4%b8%8a%2c880%2c20140508">轉存PDF</a>
          <div class="htmlcontent">判決全文</div></div></div>
        </body>
      </html>
    `;

    const result = parseDetailHtml(
      html,
      'https://judgment.judicial.gov.tw/FJUD/data.aspx?ty=JD&id=TPSV%2c103%2c%e5%8f%b0%e4%b8%8a%2c880%2c20140508&ot=in'
    );

    expect(result.printUrl).toBeNull();
    expect(result.hasTextLayer).toBe(true);
    expect(result.scanOnly).toBe(false);
    expect(result.pdfUrl).toContain('ExportToPdf.aspx?type=JD&id=TPSV');
  });

  test('falls back to derived pdf url on scan-only detail pages', () => {
    const html = `
      <html>
        <head><title>最高法院 55 年度台上字第 228 號民事判決</title></head>
        <body>
          <div class="col-th">裁判日期：</div><div class="col-td">民國 55 年 02 月 04 日</div>
          <div class="col-th">裁判案由：</div><div class="col-td">請求返還豬鬃</div>
          <a id="hlPrint" class="btn btn-default btn-xs btn-print" title="友善列印" target="_blank">友善列印</a>
        </body>
      </html>
    `;

    const result = parseDetailHtml(
      html,
      'https://judgment.judicial.gov.tw/FJUD/data.aspx?ty=JD&id=TPSV%2c55%2c%e5%8f%b0%e4%b8%8a%2c228%2c19660204%2c1&ot=in'
    );

    expect(result.text).toBe('');
    expect(result.hasTextLayer).toBe(false);
    expect(result.scanOnly).toBe(true);
    expect(result.printUrl).toBeNull();
    expect(result.pdfUrl).toContain('/FILES/TPSV/');
  });
});
