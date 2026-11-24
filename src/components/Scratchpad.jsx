import { useState, useEffect, useMemo } from 'react';
import { FileCode2, Eye, Pencil, Columns2, Check } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';

export default function Scratchpad({ savedContent, onSaveContent }) {
  const [draft, setDraft] = useState(savedContent);
  const [viewMode, setViewMode] = useState('split'); // write | split | preview
  const [saveState, setSaveState] = useState('saved'); // saved | saving

  // Sync if imported from JSON
  useEffect(() => {
    setDraft(savedContent);
  }, [savedContent]);

  // 500ms debounced auto-save
  useEffect(() => {
    if (draft === savedContent) {
      setSaveState('saved');
      return;
    }
    setSaveState('saving');
    const timer = setTimeout(() => {
      onSaveContent(draft);
      setSaveState('saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, savedContent, onSaveContent]);

  const previewHtml = useMemo(() => renderMarkdown(draft), [draft]);

  return (
    <section
      aria-label="Quick Scratchpad"
      className="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-5 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Quick Scratchpad</h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
            {saveState === 'saving' ? (
              'Đang lưu...'
            ) : (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Đã lưu</span>
              </>
            )}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-0.5 rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            title="Chỉ soạn thảo"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors cursor-pointer ${
              viewMode === 'write' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Pencil className="h-3 w-3" />
            <span className="hidden sm:inline">Viết</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            title="Chia đôi"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors cursor-pointer ${
              viewMode === 'split' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Columns2 className="h-3 w-3" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            title="Xem trước Markdown"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors cursor-pointer ${
              viewMode === 'preview' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Eye className="h-3 w-3" />
            <span className="hidden sm:inline">Xem</span>
          </button>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div
        className={`mt-3 grid min-h-0 flex-1 gap-3 ${
          viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {(viewMode === 'write' || viewMode === 'split') && (
          <textarea
            id="scratchpad-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            placeholder={`# Ghi chú nhanh\n- Ý tưởng chính...\n\n\`\`\`js\nconst focus = true;\n\`\`\``}
            className="study-scroll h-full min-h-[180px] w-full resize-none rounded-xl border border-zinc-800/90 bg-zinc-950/80 p-3.5 font-mono text-xs leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
          />
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className="md-preview study-scroll h-full min-h-[180px] overflow-y-auto rounded-xl border border-zinc-800/70 bg-zinc-950/50 p-3.5 text-xs"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
    </section>
  );
}
