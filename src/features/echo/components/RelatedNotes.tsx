// src/features/echo/components/RelatedNotes.tsx
export const RelatedNotes = ({ linkedIds }: { linkedIds: string[] }) => {
    if (!linkedIds || linkedIds.length === 0) return null;
  
    return (
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border-l-4 border-indigo-400">
        <h4 className="text-xs font-bold text-indigo-600 mb-2"> ECHO LINKS </h4>
        <div className="flex flex-col gap-2">
          {linkedIds.map(id => (
            <div key={id} className="text-sm text-slate-600 truncate italic">
              🔗 {id} {/* Ở đây sẽ fetch content của id để hiển thị */}
            </div>
          ))}
        </div>
      </div>
    );
  };