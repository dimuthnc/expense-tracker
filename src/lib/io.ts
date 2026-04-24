import { buildExportTimestamp } from './format';

export function downloadBlob(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}

export function makeJsonFilename(): string {
  return `expense_export_${buildExportTimestamp()}.json`;
}

export function makeCsvFilename(): string {
  return `expense_export_${buildExportTimestamp()}.csv`;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target?.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
