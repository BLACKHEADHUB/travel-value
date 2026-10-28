export const REGIONS = ['japan', 'sea', 'greater-china', 'europe', 'americas', 'oceania'] as const;
export const REGION_LABEL: Record<(typeof REGIONS)[number], string> = {
  japan: '일본',
  sea: '동남아',
  'greater-china': '중화권',
  europe: '유럽',
  americas: '미주',
  oceania: '대양주',
};
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
