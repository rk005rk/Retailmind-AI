import React from 'react';

export default function SkeletonLoader({ className = 'h-6 w-full' }) {
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl ${className}`}
    />
  );
}
