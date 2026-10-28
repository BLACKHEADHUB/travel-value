export function PriceNotice({ asOf }: { asOf?: string | null }) {
  return (
    <p className="text-xs text-sub">
      대략적인 참고 가격이에요. 실제 가격은 검색 링크·판매처에서 확인하세요.
      {asOf ? ` (기준일 ${asOf})` : ''}
    </p>
  );
}
