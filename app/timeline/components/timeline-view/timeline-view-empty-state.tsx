/**
 * Empty state shown when filters remove all visible sectors/tables.
 */
export function TimelineViewEmptyState() {
  return (
    <div className="min-h-0 rounded-2xl border border-dashed border-slate-300 grid place-items-center px-6 text-center bg-white">
      <p className="text-sm text-slate-500">
        No sectors match the selected filters.
      </p>
    </div>
  );
}
