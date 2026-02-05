import { Volume2, RefreshCw, Clock, LogOut } from 'lucide-react';
import { logout } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DeviceSelector } from './DeviceSelector';
import { Device } from '@/types';

interface DashboardHeaderProps {
  devices: Device[];
  selectedDeviceId: string | null;
  onDeviceChange: (deviceId: string | null) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
  lastUpdated: Date;
  timezone: string;
}

export function DashboardHeader({
  devices,
  selectedDeviceId,
  onDeviceChange,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  lastUpdated,
  timezone,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Volume2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Noise Monitoring</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
            <Clock className="h-3 w-3" />
            Last updated: {lastUpdated.toLocaleTimeString()} ({timezone})
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <DeviceSelector devices={devices} value={selectedDeviceId} onChange={onDeviceChange} />

        <div className="flex items-center gap-2">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={onAutoRefreshChange}
          />
          <Label htmlFor="auto-refresh" className="text-sm">
            Auto-refresh
          </Label>
        </div>

        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>

        <ThemeToggle />

        <Button variant="ghost" size="icon" onClick={logout} title="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
