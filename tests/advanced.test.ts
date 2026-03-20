import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  buildAdvancedSearchFormData,
  normalizeInputDate,
  resolveCourtCodes,
} from '../adapters/judicial/support/advanced.js';

function fixture(name: string): string {
  return readFileSync(resolve(process.cwd(), 'fixtures', name), 'utf8');
}

describe('advanced search helpers', () => {
  test('resolves courts from aliases, regions, and levels', () => {
    const codes = resolveCourtCodes({
      courts: '嘉義地院,臺南地院',
      regions: 'south',
      courtLevels: 'district',
    });

    expect(codes).toEqual(['CYD', 'TND']);
  });

  test('throws when advanced court filters intersect to nothing', () => {
    expect(() => resolveCourtCodes({
      courts: '最高法院',
      regions: 'south',
      courtLevels: 'district',
    })).toThrowError(/INVALID_ARGUMENT: no courts remain/);
  });

  test('normalizes AD date input from both Gregorian and ROC forms', () => {
    expect(normalizeInputDate('2026-03-20')).toEqual({ year: '115', month: '3', day: '20' });
    expect(normalizeInputDate('115-03-20')).toEqual({ year: '115', month: '3', day: '20' });
  });

  test('builds the advanced WebForms payload with structured filters', () => {
    const form = buildAdvancedSearchFormData(fixture('advanced-page.html'), {
      courts: '嘉義地院',
      caseTypes: 'criminal',
      caseYear: '115',
      caseWord: '金訴',
      caseNumber: '204',
      dateFrom: '2026-03-01',
      dateTo: '2026-03-20',
      cause: '加重詐欺',
      holding: '有期徒刑',
      fulltext: '詐騙',
      sizeMinKb: 5,
      sizeMaxKb: 20,
    });

    expect(form.getAll('jud_court')).toEqual(['CYD']);
    expect(form.getAll('jud_sys')).toEqual(['M']);
    expect(form.get('jud_year')).toBe('115');
    expect(form.get('jud_case')).toBe('金訴');
    expect(form.get('jud_no')).toBe('204');
    expect(form.get('jud_no_end')).toBe('204');
    expect(form.get('dy1')).toBe('115');
    expect(form.get('dm1')).toBe('3');
    expect(form.get('dd1')).toBe('1');
    expect(form.get('dy2')).toBe('115');
    expect(form.get('dm2')).toBe('3');
    expect(form.get('dd2')).toBe('20');
    expect(form.get('jud_title')).toBe('加重詐欺');
    expect(form.get('jud_jmain')).toBe('有期徒刑');
    expect(form.get('jud_kw')).toBe('詐騙');
    expect(form.get('KbStart')).toBe('5');
    expect(form.get('KbEnd')).toBe('20');
    expect(form.get('ctl00$cp_content$btnQry')).toBe('送出查詢');
  });
});
