import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'normal' | 'elevated' | 'high' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  loading?: boolean;
}

const variantStyles = {
  default: 'border-border',
  normal: 'border-l-4 border-l-[hsl(var(--noise-normal))]',
  elevated: 'border-l-4 border-l-[hsl(var(--noise-elevated))]',
  high: 'border-l-4 border-l-[hsl(var(--noise-high))]',
  critical: 'border-l-4 border-l-[hsl(var(--noise-critical))]',
};

const valueStyles = {
  default: 'text-foreground',
  normal: 'text-[hsl(var(--noise-normal))]',
  elevated: 'text-[hsl(var(--noise-elevated))]',
  high: 'text-[hsl(var(--noise-high))]',
  critical: 'text-[hsl(var(--noise-critical))]',
};

export function KPICard({ title, value, subtitle, icon, variant = 'default', loading }: KPICardProps) {
  return (
    <Card className={cn('transition-all hover:shadow-md', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-4 w-[140px]" />
          </div>
        ) : (
          <>
            <div className={cn('text-3xl font-bold tracking-tight', valueStyles[variant])}>
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
