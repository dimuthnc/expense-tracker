import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppState } from '@/state/AppContext';
import { toDataModel } from '@/state/selectors';
import { downloadBlob, makeJsonFilename, readFileAsText } from '@/lib/io';

export function ImportExportBar() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onExportJson = () => {
    const data = toDataModel(state);
    downloadBlob(makeJsonFilename(), 'application/json', JSON.stringify(data, null, 2));
  };

  const onImport = async (file: File) => {
    const text = await readFileAsText(file);
    try {
      const obj = JSON.parse(text);
      dispatch({ type: 'LOAD', data: obj });
    } catch {
      alert('Invalid JSON file.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={onExportJson}>
        <Download className="h-3.5 w-3.5" />
        Export JSON
      </Button>
      <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
        <Upload className="h-3.5 w-3.5" />
        Import
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
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
