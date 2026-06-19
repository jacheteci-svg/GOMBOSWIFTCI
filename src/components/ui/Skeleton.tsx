import React from 'react';

export const Skeleton = ({ width, height, borderRadius = '8px', style = {} }: { width?: string | number, height?: string | number, borderRadius?: string, style?: React.CSSProperties }) => {
  return (
    <div 
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%)',
        backgroundSize: '400% 100%',
        animation: 'skeleton-loading 1.5s infinite ease-in-out',
        ...style
      }}
    />
  );
};

export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div style={{ width: '100%', padding: '1rem' }}>
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`h-${i}`} height="24px" width={`${100 / columns}%`} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={`r-${r}`} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton key={`c-${r}-${c}`} height="48px" width={`${100 / columns}%`} borderRadius="12px" />
        ))}
      </div>
    ))}
  </div>
);
