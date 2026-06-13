export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-7 w-48 bg-muted rounded-xl mb-2" />
      <div className="h-4 w-72 bg-muted/60 rounded-lg mb-6" />
      <div className="flex gap-3 mb-6">
        <div className="h-10 flex-1 bg-muted rounded-xl" />
        <div className="h-10 w-28 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-56 bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
