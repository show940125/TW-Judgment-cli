import path from 'node:path';

export const SUPPORTED_OPENCLI_RANGE = {
  min: '1.0.0',
  maxExclusive: '2.0.0',
};

function compareVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  const length = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < length; index += 1) {
    const left = aParts[index] ?? 0;
    const right = bParts[index] ?? 0;
    if (left > right) return 1;
    if (left < right) return -1;
  }
  return 0;
}

export function normalizeOpencliVersion(version) {
  return String(version).trim().replace(/^v/i, '');
}

export function isSupportedOpencliVersion(version) {
  const normalized = normalizeOpencliVersion(version);
  return (
    compareVersions(normalized, SUPPORTED_OPENCLI_RANGE.min) >= 0 &&
    compareVersions(normalized, SUPPORTED_OPENCLI_RANGE.maxExclusive) < 0
  );
}

export function buildInstallPlan(homeDir, distRoot) {
  return {
    homeDir,
    distRoot,
    adapterSource: path.join(distRoot, 'adapters', 'judicial'),
    siteRoot: path.join(homeDir, '.opencli', 'clis', 'judicial'),
    shimRoot: path.join(homeDir, '.opencli', 'opencli-shims'),
  };
}
