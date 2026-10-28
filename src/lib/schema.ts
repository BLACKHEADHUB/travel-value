import { z } from 'zod';

export const REGIONS = ['japan', 'sea', 'greater-china', 'europe', 'americas', 'oceania'] as const;
export const THEMES = [
  '휴양',
  '미식',
  '도시',
  '자연',
  '문화/역사',
  '액티비티',
  '쇼핑',
  '온천',
] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
const confidence = z.enum(['high', 'medium', 'low']);

/** 가격 계열 공통 메타. 값이 하나라도 있으면 source/asOf 필수 (validate-data에서도 검사). */
const priceMeta = {
  source: z.string().min(1).nullable(),
  asOf: isoDate.nullable(),
  confidence,
};

export const flightPriceSchema = z.object({
  min: z.number().int().positive().nullable(),
  max: z.number().int().positive().nullable(),
  ...priceMeta,
});

export const dailyCostSchema = z.object({
  total: z.number().int().positive().nullable(),
  lodging: z.number().int().positive().nullable(),
  food: z.number().int().positive().nullable(),
  transport: z.number().int().positive().nullable(),
  ...priceMeta,
});

export const monthlySchema = z.object({
  month: z.number().int().min(1).max(12),
  flightPrice: flightPriceSchema,
  dailyCost: dailyCostSchema,
  seasonLevel: z.enum(['peak', 'shoulder', 'off']).nullable(),
  notes: z.string().nullable(),
});

export const destinationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nameKo: z.string().min(1),
  country: z.string().min(1),
  region: z.enum(REGIONS),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  themes: z.array(z.enum(THEMES)).min(1),
  visaInfo: z.object({
    required: z.boolean().nullable(),
    note: z.string().nullable(),
    source: z.string().nullable(),
  }),
  /** 인천 출발 편도 대략 비행시간(시간). 김포 출발은 노선이 달라 별도 값 없음 → null */
  flightHours: z.object({
    ICN: z.number().positive().nullable(),
    GMP: z.number().positive().nullable(),
  }),
  landmarks: z.array(z.string().min(1)).min(3).max(5),
  imageUrl: z.string().url().nullable(),
  imageCredit: z
    .object({ author: z.string().min(1), license: z.string().min(1), sourceUrl: z.string().url() })
    .nullable(),
  monthly: z.array(monthlySchema).length(12),
});
export type Destination = z.infer<typeof destinationSchema>;
export const destinationFileSchema = z.array(destinationSchema);

/** fetch-climate.ts가 생성. 직접 수정 금지. */
export const climateMonthSchema = z.object({
  month: z.number().int().min(1).max(12),
  avgTempMin: z.number(),
  avgTempMax: z.number(),
  rainfallMm: z.number().min(0),
});
export const climateFileSchema = z.object({
  source: z.string(),
  years: z.array(z.number().int()),
  generatedAt: isoDate,
  cities: z.record(z.string(), z.array(climateMonthSchema).length(12)),
});
export type ClimateFile = z.infer<typeof climateFileSchema>;

export const packageTourSchema = z.object({
  destinationId: z.string(),
  vendor: z.string().min(1),
  title: z.string().min(1),
  nights: z.number().int().min(1).max(14),
  departureMonth: z.number().int().min(1).max(12),
  /** 출발일 기준 1인 가격 */
  priceKRW: z.number().int().positive(),
  departureDate: isoDate.nullable(),
  priceIncludesFuelSurcharge: z.boolean().nullable(),
  included: z.array(z.string()),
  excluded: z.array(z.string()),
  /** 불포함 중 금액이 확인된 합계(원). 모르면 null */
  extraKnownKRW: z.number().int().nonnegative().nullable(),
  hasShopping: z.boolean().nullable(),
  hasOptionalTours: z.boolean().nullable(),
  /** 포함/불포함이 명확해 가격 통계에 쓸 수 있는가 */
  termsClear: z.boolean(),
  url: z.string().url(),
  asOf: isoDate,
  confidence,
});
export type PackageTour = z.infer<typeof packageTourSchema>;
export const packageFileSchema = z.array(packageTourSchema);
