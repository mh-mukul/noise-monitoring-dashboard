import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEVICES, Device } from '@/lib/mockData';

interface DeviceSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function DeviceSelector({ value, onChange }: DeviceSelectorProps) {
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
        {DEVICES.map((device) => (
          <SelectItem key={device.id} value={device.id}>
            {device.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
