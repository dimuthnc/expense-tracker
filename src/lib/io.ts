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

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target?.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

let printFrame: HTMLIFrameElement | null = null;

/**
 * Sends a standalone HTML document to the browser's print dialog, where
 * "Save as PDF" turns it into a real, selectable-text PDF. The document is
 * loaded into an off-screen frame so the app itself is neither navigated away
 * from nor printed. `title` becomes the suggested file name.
 */
export function printHtml(html: string, title: string): void {
  printFrame?.remove();

  const frame = document.createElement('iframe');
  printFrame = frame;
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  // No allow-scripts: the document is static, so nothing in it may execute
  // even if escaping were ever missed. allow-same-origin lets this code reach
  // the frame's window; allow-modals is what permits its print dialog.
  frame.setAttribute('sandbox', 'allow-same-origin allow-modals');
  // Off-screen rather than display:none, which some browsers refuse to print.
  frame.style.cssText =
    'position:fixed;left:-200vw;top:0;width:100vw;height:100vh;border:0;visibility:hidden';

  frame.onload = async () => {
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    if (!win || !doc) return;

    // Browsers disagree on whether the frame's or the page's title names the
    // PDF, so the page borrows the report's title until the dialog closes.
    const pageTitle = document.title;
    document.title = title;
    win.addEventListener(
      'afterprint',
      () => {
        document.title = pageTitle;
        frame.remove();
        if (printFrame === frame) printFrame = null;
      },
      { once: true },
    );

    // Printing before the webfonts land would bake the fallback faces into
    // the PDF. Capped, so an offline session still prints.
    await Promise.race([
      doc.fonts?.ready ?? Promise.resolve(),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
    win.focus();
    win.print();
  };

  frame.srcdoc = html;
  document.body.appendChild(frame);
}
