import { Play, Pause, RotateCcw, Bell, BellOff, Maximize2, Minimize2, Flame, Clock } from 'lucide-react';

const PRESETS = [
  { id: '25-5', label: '25 / 5', focus: 25, break: 5 },
  { id: '45-15', label: '45 / 15', focus: 45, break: 15 },
  { id: '60-10', label: '60 / 10', focus: 60, break: 10 },
];

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatFocusMinutes(totalMinutes) {
  if (totalMinutes < 60) return `${totalMinutes}p`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}g` : `${h}g ${m}p`;
}

export default function Timer({
  presetId,
  phase,
  secondsLeft,
  isRunning,
  sessionsToday,
  focusMinutesToday,
  notificationsEnabled,
  zenMode,
  onSelectPreset,
  onSwitchPhase,
  onToggleRun,
  onReset,
  onToggleNotifications,
  onToggleZen,
}) {
  const currentPreset = PRESETS.find((p) => p.id === presetId) || PRESETS[1];
  const totalSeconds = (phase === 'focus' ? currentPreset.focus : currentPreset.break) * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  const size = zenMode ? 280 : 210;
  const strokeWidth = zenMode ? 7 : 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  const isFocus = phase === 'focus';
  const accentStroke = isFocus ? '#10b981' : '#06b6d4';

  return (
    <section
      aria-label="Adaptive Pomodoro Timer"
      className={`flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-sm transition-all duration-300 ${
        zenMode ? 'w-full max-w-md p-8 shadow-2xl shadow-black/60' : 'h-full p-5'
      }`}
    >
      {/* Header & Presets */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-zinc-950/80 p-1 border border-zinc-800/80">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              id={`preset-${p.id}`}
              type="button"
              onClick={() => onSelectPreset(p.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                presetId === p.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-toggle-notif"
            type="button"
            onClick={onToggleNotifications}
            title={notificationsEnabled ? 'Tắt thông báo trình duyệt' : 'Bật thông báo trình duyệt'}
            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
              notificationsEnabled
                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
          <button
            id="btn-timer-zen"
            type="button"
            onClick={onToggleZen}
            title="Chế độ Zen (Phím Z)"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
          >
            {zenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Phase Switcher */}
      <div className="mt-3 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-zinc-950/70 p-1 border border-zinc-800/80 text-xs">
          <button
            id="phase-focus"
            type="button"
            onClick={() => onSwitchPhase('focus')}
            className={`rounded-full px-3.5 py-1 font-medium transition-colors cursor-pointer ${
              isFocus
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tập trung
          </button>
          <button
            id="phase-break"
            type="button"
            onClick={() => onSwitchPhase('break')}
            className={`rounded-full px-3.5 py-1 font-medium transition-colors cursor-pointer ${
              !isFocus
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Nghỉ ngắn
          </button>
        </div>
      </div>

      {/* Circular SVG Progress Ring */}
      <div className="my-4 flex items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90 transform">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#27272a"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={accentStroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              id="timer-display"
              className={`font-mono font-semibold tracking-tight tabular-nums text-zinc-100 ${
                zenMode ? 'text-6xl' : 'text-5xl'
              }`}
            >
              {formatTime(secondsLeft)}
            </span>
            <span className="mt-1.5 text-xs font-medium uppercase tracking-widest text-zinc-500">
              {isRunning ? (isFocus ? 'Deep Work' : 'Rest & Reset') : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          id="btn-timer-toggle"
          type="button"
          onClick={onToggleRun}
          className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            isFocus
              ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
              : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400'
          }`}
        >
          {isRunning ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          <span>{isRunning ? 'Tạm dừng' : 'Bắt đầu'}</span>
        </button>

        <button
          id="btn-timer-reset"
          type="button"
          onClick={onReset}
          title="Đặt lại (Phím R)"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Daily Stats Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-emerald-400" />
          <span>Phiên hôm nay:</span>
          <strong className="font-semibold text-zinc-200 tabular-nums">{sessionsToday}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span>Tổng học:</span>
          <strong className="font-semibold text-zinc-200 tabular-nums">{formatFocusMinutes(focusMinutesToday)}</strong>
        </div>
      </div>
    </section>
  );
}
