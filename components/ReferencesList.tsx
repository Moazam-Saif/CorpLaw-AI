import { ExternalLink, BookOpen } from 'lucide-react';

interface Reference {
  title: string;
  url?: string;
  description?: string;
}

export default function ReferencesList({ references }: { references: Reference[] }) {
  if (!references || references.length === 0) return null;

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">
        <BookOpen size={16} /> Legal References
      </h4>
      <div className="flex flex-col gap-2">
        {references.map((ref, idx) => (
          <div key={idx} className="flex flex-col text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 relative group">
            {ref.url ? (
              <a 
                href={ref.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
              >
                {ref.title}
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <span className="font-medium text-slate-700">{ref.title}</span>
            )}
            {ref.description && (
              <span className="text-slate-500 mt-1">{ref.description}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}