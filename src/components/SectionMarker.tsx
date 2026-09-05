/**
 * A coral mono marker that separates the page into its stages
 * (setup → ledgers → summary). It tells the reader where they are in the
 * workflow; it never restates the heading beneath it.
 */
export function SectionMarker({ children }: { children: string }) {
  return (
    <div className="mb-6 mt-12 flex items-center gap-4 first:mt-0">
      <p className="fx-eyebrow m-0">{children}</p>
      <hr className="fx-divider flex-1" />
    </div>
  );
}
