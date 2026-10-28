'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DestinationView } from '@/lib/data';
import { won } from '@/lib/format';
import { nightsLabel } from '@/lib/prefs';
import type { PeerStats } from '@/lib/trip';
import { useTrip } from '@/lib/useTrip';
import { TripControls } from './TripControls';

/** 점수 → 색 (높을수록 진한 초록). 점수 없음은 회색 */
const color = (s: number | null) =>
  s === null
    ? '#a1a1aa'
    : s >= 80
      ? '#15803d'
      : s >= 65
        ? '#65a30d'
        : s >= 50
          ? '#ca8a04'
          : '#dc2626';

const esc = (t: string) =>
  t.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

export function MapView({
  destinations,
  peers,
}: {
  destinations: DestinationView[];
  peers: PeerStats;
}) {
  const { prefs, scores, setPrefs, query } = useTrip(destinations, peers);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);

  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  // 지도 생성 (한 번)
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((mod) => {
      if (cancelled || !el.current || map.current) return;
      map.current = mod.map(el.current, { worldCopyJump: true }).setView([25, 130], 3);
      mod
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자',
        })
        .addTo(map.current);
      layer.current = mod.layerGroup().addTo(map.current);
      setL(mod);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  // 조건이 바뀌면 마커만 다시 그림
  useEffect(() => {
    const group = layer.current;
    if (!L || !group) return;
    group.clearLayers();
    for (const d of destinations) {
      const s = scores.get(d.id)!;
      L.circleMarker([d.coordinates.lat, d.coordinates.lng], {
        radius: 9,
        color: '#fff',
        weight: 2,
        fillColor: color(s.total),
        fillOpacity: 0.95,
      })
        .bindTooltip(`${esc(d.nameKo)} ${s.total ?? '–'}점`)
        .bindPopup(
          `<strong>${esc(d.nameKo)}</strong> (${esc(d.country)})<br>` +
            `가성비 ${s.total ?? '정보 없음'}점${s.parts.price === null && s.total !== null ? ' · 가격 제외' : ''}<br>` +
            `${nightsLabel(prefs.nights)} 총액 ${won(s.totalCost)}<br>` +
            `<a href="/d/${d.id}/?${query}">자세히 보기 →</a>`,
        )
        .addTo(group);
    }
  }, [L, destinations, scores, query, prefs.nights]);

  return (
    <div className="space-y-4">
      <TripControls prefs={prefs} onChange={setPrefs} />
      <div
        ref={el}
        role="region"
        aria-label={`여행지 지도 (${prefs.month}월 점수로 색칠)`}
        className="h-[60vh] min-h-80 w-full overflow-hidden rounded-2xl border border-line"
      />
      <p className="flex flex-wrap gap-3 text-xs text-sub">
        {[
          ['#15803d', '80점 이상'],
          ['#65a30d', '65~79'],
          ['#ca8a04', '50~64'],
          ['#dc2626', '50 미만'],
          ['#a1a1aa', '점수 없음'],
        ].map(([c, t]) => (
          <span key={t} className="inline-flex items-center gap-1">
            <span className="size-3 rounded-full" style={{ background: c }} aria-hidden />
            {t}
          </span>
        ))}
      </p>
      {/* 지도 대체 목록 (스크린리더·키보드용) */}
      <details className="text-sm">
        <summary className="cursor-pointer text-sub">목록으로 보기</summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {[...destinations]
            .sort((a, b) => (scores.get(b.id)!.total ?? -1) - (scores.get(a.id)!.total ?? -1))
            .map((d) => (
              <li key={d.id}>
                <a href={`/d/${d.id}/?${query}`} className="text-link underline">
                  {d.nameKo}
                </a>{' '}
                {scores.get(d.id)!.total ?? '–'}점
              </li>
            ))}
        </ul>
      </details>
    </div>
  );
}
