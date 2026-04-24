import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/state/AppContext';
import type { ConfigList as ConfigListKey } from '@/state/types';

interface ConfigListProps {
  title: string;
  listKey: ConfigListKey;
  items: string[];
  placeholder: string;
}

export function ConfigList({ title, listKey, items, placeholder }: ConfigListProps) {
  const dispatch = useAppDispatch();
  const [input, setInput] = useState('');

  const add = () => {
    if (!input.trim()) return;
    dispatch({ type: 'ADD_CONFIG', list: listKey, value: input });
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <h3 className="mb-2 mt-0 text-sm font-semibold">{title}</h3>
      <ul className="mb-2 max-h-52 list-none space-y-1.5 overflow-auto p-0">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center justify-between rounded-md surface-alt px-2 py-1 text-xs"
          >
            <span className="truncate">{item}</span>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-6 w-6"
              aria-label={`Remove ${item}`}
              onClick={() => dispatch({ type: 'REMOVE_CONFIG', list: listKey, value: item })}
            >
              <X className="h-3 w-3" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label={`Add to ${title}`}
          className="h-8 text-xs"
        />
        <Button size="sm" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}
