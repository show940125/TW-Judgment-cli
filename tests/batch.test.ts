import { describe, expect, test } from 'vitest';

import { parseJudgmentIdsInput } from '../adapters/judicial/support/batch.js';

describe('batch helpers', () => {
  test('parses comma-joined judicial ids into fixed six-part ids', () => {
    const ids = parseJudgmentIdsInput('CYDM,115,金訴,204,20260319,1,CYDM,115,金訴,204,20260319,1');

    expect(ids).toEqual([
      'CYDM,115,金訴,204,20260319,1',
      'CYDM,115,金訴,204,20260319,1',
    ]);
  });

  test('accepts newline-delimited ids as well', () => {
    const ids = parseJudgmentIdsInput('CYDM,115,金訴,204,20260319,1\nTPDV,105,訴,123,20200630,4');

    expect(ids).toEqual([
      'CYDM,115,金訴,204,20260319,1',
      'TPDV,105,訴,123,20200630,4',
    ]);
  });
});
