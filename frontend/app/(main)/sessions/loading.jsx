export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-7 w-44 bg-muted rounded-xl mb-2" />
      <div className="h-4 w-64 bg-muted/60 rounded-lg mb-6" />
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-28 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
