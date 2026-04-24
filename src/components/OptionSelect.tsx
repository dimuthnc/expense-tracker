import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OptionSelectProps {
  value: string;
  options: string[];
  onChange: (next: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function OptionSelect({ value, options, onChange, ariaLabel, className }: OptionSelectProps) {
  const hasLegacy = value && !options.includes(value);
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={className ?? 'h-8 w-full text-xs'} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
        {hasLegacy && (
          <SelectItem key={value} value={value} className="italic text-amber-600">
            {value} (legacy)
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
