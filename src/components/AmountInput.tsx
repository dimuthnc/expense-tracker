import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface AmountInputProps {
  value: number;
  onCommit: (next: number) => void;
  placeholder?: string;
  step?: string;
  integer?: boolean;
  className?: string;
}

export function AmountInput({
  value,
  onCommit,
  placeholder = '0.00',
  step,
  integer,
  className,
}: AmountInputProps) {
  const [raw, setRaw] = useState<string>(value ? String(value) : '');

  useEffect(() => {
    setRaw(value ? String(value) : '');
  }, [value]);

  const commit = (text: string) => {
    setRaw(text);
    const parsed = integer ? parseInt(text) : parseFloat(text);
    onCommit(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <Input
      type="number"
      min="0"
      step={step ?? (integer ? '1' : '0.01')}
      placeholder={placeholder}
      value={raw}
      onChange={(e) => commit(e.target.value)}
      className={className ?? 'h-8 text-right text-xs'}
    />
  );
}
