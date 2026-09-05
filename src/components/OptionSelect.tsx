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
      <SelectTrigger className={className ?? 'h-8 w-full'} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
        {hasLegacy && (
          // A value that outlived its list is a warning, so it takes the coral accent.
          <SelectItem key={value} value={value} className="text-signal data-[state=checked]:text-signal">
            {value} (legacy)
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
