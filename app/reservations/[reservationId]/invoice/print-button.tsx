'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded-lg font-medium"
    >
      Download / Print
    </button>
  );
}
