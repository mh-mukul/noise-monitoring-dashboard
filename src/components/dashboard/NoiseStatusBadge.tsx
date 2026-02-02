import { cn } from '@/lib/utils';
import { getNoiseLevel, NOISE_THRESHOLDS } from '@/lib/mockData';

interface NoiseStatusBadgeProps {
  dba: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

const colorStyles = {
  normal: 'bg-[hsl(var(--noise-normal)/0.15)] text-[hsl(var(--noise-normal))] border-[hsl(var(--noise-normal)/0.3)]',
  elevated: 'bg-[hsl(var(--noise-elevated)/0.15)] text-[hsl(var(--noise-elevated))] border-[hsl(var(--noise-elevated)/0.3)]',
  high: 'bg-[hsl(var(--noise-high)/0.15)] text-[hsl(var(--noise-high))] border-[hsl(var(--noise-high)/0.3)]',
  critical: 'bg-[hsl(var(--noise-critical)/0.15)] text-[hsl(var(--noise-critical))] border-[hsl(var(--noise-critical)/0.3)]',
};

const dotStyles = {
  normal: 'bg-[hsl(var(--noise-normal))]',
  elevated: 'bg-[hsl(var(--noise-elevated))]',
  high: 'bg-[hsl(var(--noise-high))]',
  critical: 'bg-[hsl(var(--noise-critical))] animate-pulse',
};

export function NoiseStatusBadge({ dba, size = 'md' }: NoiseStatusBadgeProps) {
  const level = getNoiseLevel(dba);
  const threshold = NOISE_THRESHOLDS[level];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        sizeStyles[size],
        colorStyles[level]
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', dotStyles[level])} />
      {threshold.label}
    </div>
  );
}
