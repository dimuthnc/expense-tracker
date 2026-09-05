import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/state/AppContext';
import type { ConfigList as ConfigListKey } from '@/state/types';

interface ConfigListProps {
  title: string;
  listKey: ConfigListKey;
  items: string[];
  placeholder: string;
}

/** Vocabulary the user defines: amber bar, items rendered as hard-edged tags. */
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
    <Card className="flex flex-col border-l-bar border-l-human p-4 pl-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="fx-label m-0">{title}</h3>
        <span className="fx-label fx-figure text-ink-faint">{items.length}</span>
      </div>
      <ul className="mb-3 max-h-52 min-h-[2rem] list-none overflow-auto p-0">
        <li className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className="fx-tag max-w-full gap-1 pr-1">
              <span className="truncate normal-case tracking-normal">{item}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-5 w-5 rounded-sm text-ink-faint hover:bg-signal-wash hover:text-signal"
                aria-label={`Remove ${item}`}
                onClick={() => dispatch({ type: 'REMOVE_CONFIG', list: listKey, value: item })}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
          {items.length === 0 && (
            <span className="text-small text-ink-faint">Nothing defined yet.</span>
          )}
        </li>
      </ul>
      <div className="mt-auto flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label={`Add to ${title}`}
          className="h-8"
        />
        <Button size="sm" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
    </Card>
  );
}
