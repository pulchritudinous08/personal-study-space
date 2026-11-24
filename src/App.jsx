import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Upload, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { studyAudio } from './utils/audio';
import Timer from './components/Timer';
import TaskList from './components/TaskList';
import Scratchpad from './components/Scratchpad';
import SoundPlayer from './components/SoundPlayer';

const PRESET_MINUTES = {
  '25-5': { focus: 25, break: 5 },
  '45-15': { focus: 45, break: 15 },
  '60-10': { focus: 60, break: 10 },
};

const INITIAL_TASKS = [
  {
    id: 'demo-1',
    title: 'Hoàn thành 1 phiên Deep Work 45 phút không kiểm tra điện thoại',
    tag: 'Code',
    priority: 'High',
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: 'demo-2',
    title: 'Tóm tắt lại kiến thức chính vào Quick Scratchpad',
    tag: 'Reading',
    priority: 'Medium',
    completed: false,
    createdAt: Date.now() - 1000,
  },
];

const INITIAL_NOTES = `# Deep Work Notes

- **Mục tiêu phiên này:** Tập trung giải quyết 1 bài toán quan trọng nhất.
- Nhấn \`Space\` để chạy/dừng đồng hồ, \`Z\` để vào chế độ Zen.

\`\`\`js
// Ghi chú nhanh đoạn code hoặc công thức
function deepWork(minutes = 45) {
  return \`Focused for \${minutes}m\`;
}
\`\`\``;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  // Persisted state in localStorage
  const [presetId, setPresetId] = useLocalStorage('pss_preset', '45-15');
  const [stats, setStats] = useLocalStorage('pss_daily_stats', {
    date: getTodayKey(),
    sessions: 0,
    focusMinutes: 0,
  });
  const [tasks, setTasks] = useLocalStorage('pss_tasks', INITIAL_TASKS);
  const [notes, setNotes] = useLocalStorage('pss_notes', INITIAL_NOTES);
  const [volumes, setVolumes] = useLocalStorage('pss_volumes', {
    brown: 0,
    white: 0,
    rain: 0,
  });

  // Runtime state
  const [phase, setPhase] = useState('focus'); // 'focus' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(
    (PRESET_MINUTES[presetId]?.focus ?? 45) * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [muted, setMuted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(''), 2600);
  }, []);

  // Reset daily counters automatically on a new calendar day
  useEffect(() => {
    const today = getTodayKey();
    if (stats.date !== today) {
      setStats({ date: today, sessions: 0, focusMinutes: 0 });
    }
  }, [stats.date, setStats]);

  // Countdown tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle phase completion when secondsLeft hits 0
  useEffect(() => {
    if (secondsLeft !== 0 || !isRunning) return;
    setIsRunning(false);

    const cfg = PRESET_MINUTES[presetId] || PRESET_MINUTES['45-15'];
    if (phase === 'focus') {
      studyAudio.playChime(false);
      setStats((prev) => ({
        date: getTodayKey(),
        sessions: (prev.date === getTodayKey() ? prev.sessions : 0) + 1,
        focusMinutes: (prev.date === getTodayKey() ? prev.focusMinutes : 0) + cfg.focus,
      }));
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Hoàn thành phiên Deep Work!', {
          body: `Tuyệt vời! Nghỉ ngơi ${cfg.break} phút nhé.`,
        });
      }
      setPhase('break');
      setSecondsLeft(cfg.break * 60);
      showToast(`Hoàn thành phiên ${cfg.focus} phút! Chuyển sang nghỉ ngắn.`);
    } else {
      studyAudio.playChime(true);
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Hết giờ nghỉ!', {
          body: `Sẵn sàng cho phiên tập trung ${cfg.focus} phút tiếp theo.`,
        });
      }
      setPhase('focus');
      setSecondsLeft(cfg.focus * 60);
      showToast('Hết giờ nghỉ — sẵn sàng cho phiên mới.');
    }
  }, [secondsLeft, isRunning, phase, presetId, notificationsEnabled, setStats, showToast]);

  // Dynamic document title with remaining timer
  useEffect(() => {
    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const secs = String(secondsLeft % 60).padStart(2, '0');
    document.title = isRunning
      ? `${mins}:${secs} · ${phase === 'focus' ? 'Focus' : 'Break'} — Study Space`
      : 'Personal Study Space — Deep Work';
  }, [secondsLeft, isRunning, phase]);

  const handleSelectPreset = useCallback(
    (id) => {
      const cfg = PRESET_MINUTES[id] || PRESET_MINUTES['45-15'];
      setPresetId(id);
      setIsRunning(false);
      setPhase('focus');
      setSecondsLeft(cfg.focus * 60);
    },
    [setPresetId]
  );

  const handleSwitchPhase = useCallback(
    (nextPhase) => {
      const cfg = PRESET_MINUTES[presetId] || PRESET_MINUTES['45-15'];
      setIsRunning(false);
      setPhase(nextPhase);
      setSecondsLeft((nextPhase === 'focus' ? cfg.focus : cfg.break) * 60);
    },
    [presetId]
  );

  const handleReset = useCallback(() => {
    const cfg = PRESET_MINUTES[presetId] || PRESET_MINUTES['45-15'];
    setIsRunning(false);
    setSecondsLeft((phase === 'focus' ? cfg.focus : cfg.break) * 60);
  }, [presetId, phase]);

  const handleToggleRun = useCallback(() => {
    studyAudio.ensureContext();
    setIsRunning((prev) => !prev);
  }, []);

  const handleToggleNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      showToast('Trình duyệt không hỗ trợ Notification.');
      return;
    }
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      showToast('Đã bật thông báo hết giờ.');
    } else {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        setNotificationsEnabled(true);
        showToast('Đã bật thông báo hết giờ.');
      } else {
        showToast('Bạn đã từ chối quyền thông báo.');
      }
    }
  }, [notificationsEnabled, showToast]);

  // Global Keyboard Shortcuts: Space (Play/Pause), R (Reset), Z (Zen Mode)
  useEffect(() => {
    function onKeyDown(e) {
      const target = e.target;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleRun();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        setZenMode((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleRun, handleReset]);

  // Export JSON backup
  function handleExportJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      presetId,
      stats,
      tasks,
      notes,
      volumes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-space-backup-${getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file sao lưu .json');
  }

  // Import JSON backup
  function handleImportJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.presetId && PRESET_MINUTES[data.presetId]) {
          setPresetId(data.presetId);
          setSecondsLeft(PRESET_MINUTES[data.presetId].focus * 60);
          setPhase('focus');
          setIsRunning(false);
        }
        if (data.stats && typeof data.stats.sessions === 'number') setStats(data.stats);
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (typeof data.notes === 'string') setNotes(data.notes);
        if (data.volumes && typeof data.volumes === 'object') {
          setVolumes({
            brown: Number(data.volumes.brown) || 0,
            white: Number(data.volumes.white) || 0,
            rain: Number(data.volumes.rain) || 0,
          });
        }
        showToast('Đã khôi phục dữ liệu từ file .json');
      } catch {
        showToast('File .json không hợp lệ.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleChangeVolume(id, val) {
    setVolumes((prev) => ({ ...prev, [id]: val }));
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 lg:h-screen lg:overflow-hidden">
      {/* Subtle Top Bar */}
      {!zenMode && (
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-900 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
                Personal Study Space
              </h1>
              <p className="text-[11px] text-zinc-500">
                Space: Chạy/Dừng · R: Reset · Z: Zen Mode
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              id="btn-import-json"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import</span>
            </button>
            <button
              id="btn-export-json"
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
            <button
              id="btn-zen-mode"
              type="button"
              onClick={() => setZenMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Zen Mode</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content: Zen Mode vs Bento Grid */}
      {zenMode ? (
        <main className="flex flex-1 flex-col items-center justify-center p-6">
          <Timer
            presetId={presetId}
            phase={phase}
            secondsLeft={secondsLeft}
            isRunning={isRunning}
            sessionsToday={stats.sessions}
            focusMinutesToday={stats.focusMinutes}
            notificationsEnabled={notificationsEnabled}
            zenMode={true}
            onSelectPreset={handleSelectPreset}
            onSwitchPhase={handleSwitchPhase}
            onToggleRun={handleToggleRun}
            onReset={handleReset}
            onToggleNotifications={handleToggleNotifications}
            onToggleZen={() => setZenMode(false)}
          />
          <button
            type="button"
            onClick={() => setZenMode(false)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span>Thoát Zen Mode (Phím Z)</span>
          </button>
        </main>
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-12">
          {/* Left Column: Timer + Focus Soundscape */}
          <div className="flex min-h-0 flex-col gap-4 lg:col-span-4">
            <div className="min-h-0 flex-1">
              <Timer
                presetId={presetId}
                phase={phase}
                secondsLeft={secondsLeft}
                isRunning={isRunning}
                sessionsToday={stats.sessions}
                focusMinutesToday={stats.focusMinutes}
                notificationsEnabled={notificationsEnabled}
                zenMode={false}
                onSelectPreset={handleSelectPreset}
                onSwitchPhase={handleSwitchPhase}
                onToggleRun={handleToggleRun}
                onReset={handleReset}
                onToggleNotifications={handleToggleNotifications}
                onToggleZen={() => setZenMode(true)}
              />
            </div>
            <SoundPlayer
              volumes={volumes}
              muted={muted}
              onChangeVolume={handleChangeVolume}
              onToggleMute={() => setMuted((m) => !m)}
            />
          </div>

          {/* Right Area: Study Roadmap + Quick Scratchpad */}
          <div className="grid min-h-0 grid-cols-1 gap-4 lg:col-span-8 lg:grid-rows-2">
            <TaskList tasks={tasks} onChangeTasks={setTasks} />
            <Scratchpad savedContent={notes} onSaveContent={setNotes} />
          </div>
        </main>
      )}

      {/* Subtle Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-xl border border-zinc-700/80 bg-zinc-900/95 px-4 py-2.5 text-xs font-medium text-zinc-100 shadow-xl backdrop-blur-md"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
