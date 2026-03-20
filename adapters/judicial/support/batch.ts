function createBatchError(message: string): Error {
  const error = new Error(`INVALID_ARGUMENT: ${message}`);
  error.name = 'INVALID_ARGUMENT';
  return error;
}

function isSingleJudgmentId(value: string): boolean {
  return value.split(',').filter(Boolean).length === 6;
}

export function parseJudgmentIdsInput(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) {
    throw createBatchError('ids are required');
  }

  if (trimmed.includes('\n')) {
    const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.every(isSingleJudgmentId)) {
      return lines;
    }
  }

  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length % 6 !== 0) {
    throw createBatchError('ids must be provided as newline-delimited ids or a comma-joined list of complete judgment ids');
  }

  const ids = [];
  for (let index = 0; index < parts.length; index += 6) {
    ids.push(parts.slice(index, index + 6).join(','));
  }
  return ids;
}
