import { describe, expect, test } from 'vitest';

import {
  buildInstallPlan,
  isSupportedOpencliVersion,
  normalizeOpencliVersion,
} from '../scripts/lib/compat.js';

describe('compatibility helpers', () => {
  test('normalizes npm and git style versions', () => {
    expect(normalizeOpencliVersion('1.0.1')).toBe('1.0.1');
    expect(normalizeOpencliVersion('v1.0.2')).toBe('1.0.2');
  });

  test('checks supported opencli version range', () => {
    expect(isSupportedOpencliVersion('1.0.0')).toBe(true);
    expect(isSupportedOpencliVersion('1.0.2')).toBe(true);
    expect(isSupportedOpencliVersion('0.9.9')).toBe(false);
    expect(isSupportedOpencliVersion('2.0.0')).toBe(false);
  });

  test('builds the install plan under ~/.opencli', () => {
    const plan = buildInstallPlan('C:\\Users\\demo', 'C:\\repo\\dist');

    expect(plan.siteRoot).toBe('C:\\Users\\demo\\.opencli\\clis\\judicial');
    expect(plan.shimRoot).toBe('C:\\Users\\demo\\.opencli\\opencli-shims');
    expect(plan.adapterSource).toBe('C:\\repo\\dist\\adapters\\judicial');
  });
});
