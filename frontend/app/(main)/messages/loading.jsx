export default function Loading() {
  return (
    <div className="h-[calc(100vh-72px)] flex px-2 py-2 sm:px-4 sm:py-4 max-w-7xl mx-auto w-full animate-pulse">
      <div className="flex-1 flex rounded-2xl overflow-hidden border border-border bg-card shadow-sm min-h-0">
        {/* Sidebar skeleton */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-border flex flex-col gap-3">
            <div className="h-5 w-24 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded-xl" />
          </div>
          <div className="flex border-b border-border">
            <div className="flex-1 h-10 bg-muted/40" />
            <div className="flex-1 h-10 bg-muted/20" />
          </div>
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
        {/* Chat area skeleton */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted" />
          <div className="h-5 w-32 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted/60 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
