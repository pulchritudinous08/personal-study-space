import { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Tag, ListTodo } from 'lucide-react';

const DEFAULT_TAGS = [
  { name: 'Code', color: 'emerald' },
  { name: 'Math', color: 'cyan' },
  { name: 'English', color: 'amber' },
  { name: 'Reading', color: 'rose' },
];

const TAG_STYLES = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  slate: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
};

const PRIORITY_STYLES = {
  High: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Medium: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  Low: 'text-zinc-400 bg-zinc-800/80 border-zinc-700/60',
};

export default function TaskList({ tasks, onChangeTasks }) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('Code');
  const [priority, setPriority] = useState('Medium');
  const [filter, setFilter] = useState('All'); // All | Active | Completed
  const [tagFilter, setTagFilter] = useState('All');

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return tasks
      .filter((t) => {
        if (filter === 'Active' && t.completed) return false;
        if (filter === 'Completed' && !t.completed) return false;
        if (tagFilter !== 'All' && t.tag !== tagFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
      });
  }, [tasks, filter, tagFilter]);

  function handleAddTask(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const next = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: trimmed,
        tag,
        priority,
        completed: false,
        createdAt: Date.now(),
      },
      ...tasks,
    ];
    onChangeTasks(next);
    setTitle('');
  }

  function toggleTask(id) {
    onChangeTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTask(id) {
    onChangeTasks(tasks.filter((t) => t.id !== id));
  }

  function getTagColor(tagName) {
    const found = DEFAULT_TAGS.find((t) => t.name === tagName);
    return TAG_STYLES[found ? found.color : 'slate'];
  }

  return (
    <section
      aria-label="Study Roadmap & Task Manager"
      className="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-5 backdrop-blur-sm"
    >
      {/* Header + Progress */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Study Roadmap</h2>
        </div>
        <span className="font-mono text-xs font-medium text-emerald-400 tabular-nums">
          {stats.done}/{stats.total} ({stats.pct}%)
        </span>
      </div>

      {/* Daily Progress Bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${stats.pct}%` }}
        />
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="mt-3.5 space-y-2">
        <div className="flex gap-2">
          <input
            id="input-new-task"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Thêm mục tiêu học tập..."
            className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
          />
          <button
            id="btn-add-task"
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-zinc-500" />
            <select
              id="select-task-tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-xs text-zinc-300 focus:border-emerald-500/50 focus:outline-none"
            >
              {DEFAULT_TAGS.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              id="select-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-xs text-zinc-300 focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-0.5 rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-0.5 text-[11px]">
            {['All', 'Active', 'Completed'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-2 py-0.5 font-medium transition-colors cursor-pointer ${
                  filter === f ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Tag Quick Filter */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setTagFilter('All')}
          className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
            tagFilter === 'All'
              ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
              : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tất cả môn
        </button>
        {DEFAULT_TAGS.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setTagFilter(tagFilter === t.name ? 'All' : t.name)}
            className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
              tagFilter === t.name
                ? getTagColor(t.name)
                : 'border-zinc-800/80 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="study-scroll mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
            Không có nhiệm vụ nào trong mục này.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-start justify-between gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                task.completed
                  ? 'border-zinc-800/50 bg-zinc-950/35 opacity-65'
                  : 'border-zinc-800/90 bg-zinc-950/75 hover:border-zinc-700'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 shrink-0 text-zinc-500 transition-colors hover:text-emerald-400 cursor-pointer"
                aria-label={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
              >
                {task.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`break-words text-xs leading-relaxed ${
                    task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                  }`}
                >
                  {task.title}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getTagColor(task.tag)}`}>
                    {task.tag}
                  </span>
                  <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                className="shrink-0 rounded-md p-1 text-zinc-600 opacity-0 transition-all hover:bg-zinc-800 hover:text-rose-400 group-hover:opacity-100 cursor-pointer"
                aria-label="Xóa nhiệm vụ"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
