export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Profile header */}
      <div className="flex gap-6 items-start mb-8">
        <div className="w-24 h-24 rounded-2xl bg-muted flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-3">
          <div className="h-6 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-32 bg-muted/60 rounded-lg" />
          <div className="h-4 w-64 bg-muted/60 rounded-lg" />
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      {/* Skills grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="h-40 bg-muted rounded-2xl" />
      </div>
      {/* Sessions */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
