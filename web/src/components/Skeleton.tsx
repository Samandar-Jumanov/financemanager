import { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, rounded = '8px', className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-100 ${className}`}
      style={{ width, height, borderRadius: rounded, ...style }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={14} />
        <Skeleton width={36} height={36} rounded="12px" />
      </div>
      <Skeleton width={160} height={28} rounded="8px" className="mb-2" />
      <Skeleton width={100} height={12} />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton height={14} width={i === 0 ? 80 : i === 1 ? 120 : i === 2 ? 100 : '80%'} />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="flex items-end gap-2 h-full px-4 pb-6 pt-4">
        {[65, 45, 80, 55, 70, 40, 90, 60, 75, 50, 85, 45].map((h, i) => (
          <div key={i} className="flex-1 bg-gray-100 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3, height = 120 }: { lines?: number; height?: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse" style={{ minHeight: height }}>
      <Skeleton width="60%" height={14} className="mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${90 - i * 10}%`} height={12} className="mb-2" />
      ))}
    </div>
  );
}
