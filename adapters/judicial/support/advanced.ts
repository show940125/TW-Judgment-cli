import { parseViewStatePayload } from './parser.js';
import type { AdvancedSearchParams, CourtLevel, CourtRecord, CourtRegion, DateParts, SearchSort } from './types.js';

const ALL_CASE_TYPES = ['constitutional', 'civil', 'criminal', 'administrative', 'disciplinary'] as const;

const CASE_TYPE_TO_CODE = {
  constitutional: 'C',
  civil: 'V',
  criminal: 'M',
  administrative: 'A',
  disciplinary: 'P',
} as const;

const COURTS: CourtRecord[] = [
  { code: 'JCC', officialName: '憲法法庭', aliases: ['憲法法庭'], level: 'constitutional', region: 'national', supportsCaseTypes: ['constitutional'] },
  { code: 'TPC', officialName: '司法院刑事補償法庭', aliases: ['刑事補償法庭'], level: 'special', region: 'national', supportsCaseTypes: ['criminal'] },
  { code: 'TPU', officialName: '司法院－訴願決定', aliases: ['司法院訴願決定'], level: 'special', region: 'national', supportsCaseTypes: ['administrative'] },
  { code: 'TPS', officialName: '最高法院', aliases: ['最高法院'], level: 'supreme', region: 'national', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'TPA', officialName: '最高行政法院(含改制前行政法院)', aliases: ['最高行政法院', '行政法院'], level: 'supreme', region: 'national', supportsCaseTypes: ['administrative'] },
  { code: 'TPP', officialName: '懲戒法院－懲戒法庭', aliases: ['懲戒法院', '懲戒法庭'], level: 'special', region: 'national', supportsCaseTypes: ['disciplinary'] },
  { code: 'TPJ', officialName: '懲戒法院－職務法庭', aliases: ['職務法庭'], level: 'special', region: 'national', supportsCaseTypes: ['disciplinary'] },
  { code: 'TPH', officialName: '臺灣高等法院', aliases: ['台灣高等法院', '高院'], level: 'high', region: 'north', supportsCaseTypes: ['civil', 'criminal'] },
  { code: '001', officialName: '臺灣高等法院－訴願決定', aliases: ['高院訴願決定'], level: 'high', region: 'north', supportsCaseTypes: ['administrative'] },
  { code: 'TPB', officialName: '臺北高等行政法院 高等庭(含改制前臺北高等行政法院)', aliases: ['台北高等行政法院高等庭', '臺北高等行政法院高等庭'], level: 'high', region: 'north', supportsCaseTypes: ['administrative'] },
  { code: 'TPT', officialName: '臺北高等行政法院 地方庭', aliases: ['台北高等行政法院地方庭', '臺北高等行政法院地方庭'], level: 'district', region: 'north', supportsCaseTypes: ['administrative'] },
  { code: 'TCB', officialName: '臺中高等行政法院 高等庭(含改制前臺中高等行政法院)', aliases: ['台中高等行政法院高等庭', '臺中高等行政法院高等庭'], level: 'high', region: 'central', supportsCaseTypes: ['administrative'] },
  { code: 'TCT', officialName: '臺中高等行政法院 地方庭', aliases: ['台中高等行政法院地方庭', '臺中高等行政法院地方庭'], level: 'district', region: 'central', supportsCaseTypes: ['administrative'] },
  { code: 'KSB', officialName: '高雄高等行政法院 高等庭(含改制前高雄高等行政法院)', aliases: ['高雄高等行政法院高等庭'], level: 'high', region: 'south', supportsCaseTypes: ['administrative'] },
  { code: 'KST', officialName: '高雄高等行政法院 地方庭', aliases: ['高雄高等行政法院地方庭'], level: 'district', region: 'south', supportsCaseTypes: ['administrative'] },
  { code: 'IPC', officialName: '智慧財產及商業法院', aliases: ['智財法院', '智慧財產及商業法院'], level: 'special', region: 'north', supportsCaseTypes: ['civil', 'criminal', 'administrative'] },
  { code: 'TCH', officialName: '臺灣高等法院 臺中分院', aliases: ['台中高分院', '臺中高分院'], level: 'high', region: 'central', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'TNH', officialName: '臺灣高等法院 臺南分院', aliases: ['台南高分院', '臺南高分院'], level: 'high', region: 'south', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'KSH', officialName: '臺灣高等法院 高雄分院', aliases: ['高雄高分院'], level: 'high', region: 'south', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'HLH', officialName: '臺灣高等法院 花蓮分院', aliases: ['花蓮高分院'], level: 'high', region: 'east', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'TPD', officialName: '臺灣臺北地方法院', aliases: ['台北地院', '臺北地院'], level: 'district', region: 'north', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'SLD', officialName: '臺灣士林地方法院', aliases: ['士林地院'], level: 'district', region: 'north', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'PCD', officialName: '臺灣新北地方法院', aliases: ['新北地院', '板橋地院'], level: 'district', region: 'north', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'ILD', officialName: '臺灣宜蘭地方法院', aliases: ['宜蘭地院'], level: 'district', region: 'north', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'KLD', officialName: '臺灣基隆地方法院', aliases: ['基隆地院'], level: 'district', region: 'north', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'TYD', officialName: '臺灣桃園地方法院', aliases: ['桃園地院'], level: 'district', region: 'north', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'SCD', officialName: '臺灣新竹地方法院', aliases: ['新竹地院'], level: 'district', region: 'north', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'MLD', officialName: '臺灣苗栗地方法院', aliases: ['苗栗地院'], level: 'district', region: 'central', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'TCD', officialName: '臺灣臺中地方法院', aliases: ['台中地院', '臺中地院'], level: 'district', region: 'central', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'CHD', officialName: '臺灣彰化地方法院', aliases: ['彰化地院'], level: 'district', region: 'central', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'NTD', officialName: '臺灣南投地方法院', aliases: ['南投地院'], level: 'district', region: 'central', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'ULD', officialName: '臺灣雲林地方法院', aliases: ['雲林地院'], level: 'district', region: 'central', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'CYD', officialName: '臺灣嘉義地方法院', aliases: ['嘉義地院'], level: 'district', region: 'south', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'TND', officialName: '臺灣臺南地方法院', aliases: ['台南地院', '臺南地院'], level: 'district', region: 'south', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'KSD', officialName: '臺灣高雄地方法院', aliases: ['高雄地院'], level: 'district', region: 'south', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'CTD', officialName: '臺灣橋頭地方法院', aliases: ['橋頭地院'], level: 'district', region: 'south', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'HLD', officialName: '臺灣花蓮地方法院', aliases: ['花蓮地院'], level: 'district', region: 'east', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'TTD', officialName: '臺灣臺東地方法院', aliases: ['台東地院', '臺東地院'], level: 'district', region: 'east', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'PTD', officialName: '臺灣屏東地方法院', aliases: ['屏東地院'], level: 'district', region: 'south', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'PHD', officialName: '臺灣澎湖地方法院', aliases: ['澎湖地院'], level: 'district', region: 'outlying', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'KMH', officialName: '福建高等法院金門分院', aliases: ['金門高分院'], level: 'high', region: 'outlying', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'KMD', officialName: '福建金門地方法院', aliases: ['金門地院'], level: 'district', region: 'outlying', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'LCD', officialName: '福建連江地方法院', aliases: ['連江地院', '馬祖地院'], level: 'district', region: 'outlying', supportsCaseTypes: ['civil', 'criminal'] },
  { code: 'KSY', officialName: '臺灣高雄少年及家事法院', aliases: ['高雄少家法院', '少年及家事法院'], level: 'special', region: 'south', supportsCaseTypes: ['civil', 'criminal'] },
];

function createAdvancedError(message: string): Error {
  const error = new Error(`INVALID_ARGUMENT: ${message}`);
  error.name = 'INVALID_ARGUMENT';
  return error;
}

function splitCsv(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCourtToken(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '').replace(/臺/g, '台');
}

function normalizeListToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '').replace(/臺/g, '台');
}

function parseLevels(value?: string): CourtLevel[] {
  const tokens = splitCsv(value);
  const mapping: Record<string, CourtLevel> = {
    constitutional: 'constitutional',
    supreme: 'supreme',
    high: 'high',
    district: 'district',
    special: 'special',
  };

  return tokens.map((token) => {
    const normalized = normalizeListToken(token);
    const level = mapping[normalized];
    if (!level) {
      throw createAdvancedError(`unknown court level "${token}"`);
    }
    return level;
  });
}

function parseRegions(value?: string): CourtRegion[] {
  const tokens = splitCsv(value);
  const mapping: Record<string, CourtRegion> = {
    north: 'north',
    central: 'central',
    south: 'south',
    east: 'east',
    outlying: 'outlying',
    national: 'national',
  };

  return tokens.map((token) => {
    const normalized = normalizeListToken(token);
    const region = mapping[normalized];
    if (!region) {
      throw createAdvancedError(`unknown region "${token}"`);
    }
    return region;
  });
}

export function parseCaseTypes(value?: string): string[] {
  const tokens = splitCsv(value);
  if (tokens.length === 0) {
    return [];
  }

  return tokens.map((token) => {
    const normalized = normalizeListToken(token);
    if (!(normalized in CASE_TYPE_TO_CODE)) {
      throw createAdvancedError(`unknown case type "${token}"`);
    }
    return normalized;
  });
}

export function normalizeInputDate(value: string): DateParts {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{3,4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    throw createAdvancedError(`invalid date "${value}"`);
  }

  const numericYear = Number(match[1]);
  const rocYear = match[1].length === 4 ? numericYear - 1911 : numericYear;
  if (!Number.isInteger(rocYear) || rocYear <= 0) {
    throw createAdvancedError(`invalid date "${value}"`);
  }

  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw createAdvancedError(`invalid date "${value}"`);
  }

  return {
    year: String(rocYear),
    month: String(month),
    day: String(day),
  };
}

function filterCourtsByCaseTypes(courts: CourtRecord[], caseTypes: string[]): CourtRecord[] {
  if (caseTypes.length === 0) {
    return courts;
  }

  return courts.filter((court) => caseTypes.some((caseType) => court.supportsCaseTypes.includes(caseType)));
}

function uniqueSortedCodes(courts: CourtRecord[]): string[] {
  return [...new Set(courts.map((court) => court.code))].sort();
}

export function resolveCourtCodes(params: Pick<AdvancedSearchParams, 'courts' | 'courtLevels' | 'regions' | 'caseTypes'>): string[] {
  const requestedCourts = splitCsv(params.courts);
  const levels = parseLevels(params.courtLevels);
  const regions = parseRegions(params.regions);
  const caseTypes = parseCaseTypes(params.caseTypes);

  let courts = COURTS.slice();
  courts = filterCourtsByCaseTypes(courts, caseTypes);

  if (requestedCourts.length > 0) {
    const matchedCodes = new Set<string>();
    for (const token of requestedCourts) {
      const normalized = normalizeCourtToken(token);
      const match = COURTS.find((court) =>
        court.code.toLowerCase() === normalized
        || normalizeCourtToken(court.officialName) === normalized
        || court.aliases.some((alias) => normalizeCourtToken(alias) === normalized)
      );
      if (!match) {
        throw createAdvancedError(`unknown court "${token}"`);
      }
      matchedCodes.add(match.code);
    }
    courts = courts.filter((court) => matchedCodes.has(court.code));
  }

  if (levels.length > 0) {
    const levelSet = new Set(levels);
    courts = courts.filter((court) => levelSet.has(court.level));
  }

  if (regions.length > 0) {
    const regionSet = new Set(regions);
    courts = courts.filter((court) => regionSet.has(court.region));
  }

  if (courts.length === 0) {
    throw createAdvancedError('no courts remain after applying courts/regions/court-levels filters');
  }

  return uniqueSortedCodes(courts);
}

export function buildAdvancedSearchFormData(html: string, params: AdvancedSearchParams): URLSearchParams {
  const viewState = parseViewStatePayload(html);
  const form = new URLSearchParams({
    ...viewState,
    __VIEWSTATEENCRYPTED: '',
    jud_year: params.caseYear?.trim() ?? '',
    jud_case: params.caseWord?.trim() ?? '',
    jud_no: params.caseNumber?.trim() ?? '',
    jud_no_end: params.caseNumber?.trim() ?? '',
    jud_title: params.cause?.trim() ?? '',
    jud_jmain: params.holding?.trim() ?? '',
    jud_kw: params.fulltext?.trim() ?? '',
    KbStart: params.sizeMinKb != null ? String(params.sizeMinKb) : '',
    KbEnd: params.sizeMaxKb != null ? String(params.sizeMaxKb) : '',
    judtype: 'JUDBOOK',
    whosub: '1',
    sel_judword: '',
    'ctl00$cp_content$btnQry': '送出查詢',
  });

  if (params.dateFrom) {
    const start = normalizeInputDate(params.dateFrom);
    form.set('dy1', start.year);
    form.set('dm1', start.month);
    form.set('dd1', start.day);
  } else {
    form.set('dy1', '');
    form.set('dm1', '');
    form.set('dd1', '');
  }

  if (params.dateTo) {
    const end = normalizeInputDate(params.dateTo);
    form.set('dy2', end.year);
    form.set('dm2', end.month);
    form.set('dd2', end.day);
  } else {
    form.set('dy2', '');
    form.set('dm2', '');
    form.set('dd2', '');
  }

  const courtCodes = resolveCourtCodes(params);
  const hasCourtFilter = splitCsv(params.courts).length > 0 || splitCsv(params.courtLevels).length > 0 || splitCsv(params.regions).length > 0;
  if (hasCourtFilter) {
    for (const code of courtCodes) {
      form.append('jud_court', code);
    }
  } else {
    form.append('jud_court', '');
  }

  const caseTypes = parseCaseTypes(params.caseTypes);
  for (const caseType of caseTypes) {
    form.append('jud_sys', CASE_TYPE_TO_CODE[caseType as keyof typeof CASE_TYPE_TO_CODE]);
  }

  return form;
}

export function defaultSort(sort?: SearchSort): SearchSort {
  return sort ?? 'DS';
}
