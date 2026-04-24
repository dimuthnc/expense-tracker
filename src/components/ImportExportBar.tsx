import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppState } from '@/state/AppContext';
import { toDataModel } from '@/state/selectors';
import { buildCsv, parseCsv } from '@/lib/csv';
import { downloadBlob, makeCsvFilename, makeJsonFilename, readFileAsText } from '@/lib/io';

export function ImportExportBar() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onExportJson = () => {
    const data = toDataModel(state);
    downloadBlob(makeJsonFilename(), 'application/json', JSON.stringify(data, null, 2));
  };

  const onExportCsv = () => {
    const data = toDataModel(state);
    downloadBlob(makeCsvFilename(), 'text/csv', buildCsv(data));
  };

  const onImport = async (file: File) => {
    const text = await readFileAsText(file);
    if (file.name.toLowerCase().endsWith('.json')) {
      try {
        const obj = JSON.parse(text);
        dispatch({ type: 'LOAD', data: obj });
      } catch {
        alert('Invalid JSON file.');
      }
    } else {
      dispatch({ type: 'LOAD', data: parseCsv(text) });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={onExportJson}>
        Export JSON
      </Button>
      <Button size="sm" onClick={onExportCsv}>
        Export CSV
      </Button>
      <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
        Import...
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,.csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImport(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
