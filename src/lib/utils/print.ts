/**
 * Trigger the browser's print dialog (used for "Export PDF" — the user picks
 * "Save as PDF"). Temporarily swaps the document title so the suggested PDF
 * filename is meaningful, then restores it once printing finishes.
 *
 * The active theme is preserved by the `@media print` rules in globals.css
 * (`print-color-adjust: exact`), so a dark-theme export stays dark.
 */
export function printDocument(title?: string): void {
  if (typeof window === "undefined") return;

  if (!title) {
    window.print();
    return;
  }

  const previous = document.title;
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  document.title = title;
  window.print();
}
