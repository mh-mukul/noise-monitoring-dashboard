import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Device } from '@/types';

interface DeviceSelectorProps {
  devices: Device[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function DeviceSelector({ devices, value, onChange }: DeviceSelectorProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={(v) => onChange(v === 'all' ? null : v)}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Devices" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Devices</SelectItem>
        {devices.map((device) => (
          <SelectItem key={device.id} value={String(device.id)}>
            {device.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
