export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-slate-600">
      {children}
    </div>
  );
}
