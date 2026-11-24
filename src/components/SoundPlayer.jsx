import { useEffect } from 'react';
import { Volume2, VolumeX, CloudRain, Waves, Radio } from 'lucide-react';
import { studyAudio } from '../utils/audio';

const CHANNELS = [
  { id: 'brown', label: 'Brown Noise', desc: 'Trầm ấm, chặn tiếng ồn', icon: Waves },
  { id: 'white', label: 'White Noise', desc: 'Đều đặn, tăng tập trung', icon: Radio },
  { id: 'rain', label: 'Soft Rain', desc: 'Mưa nhẹ ngoài cửa sổ', icon: CloudRain },
];

export default function SoundPlayer({ volumes, muted, onChangeVolume, onToggleMute }) {
  // Sync Web Audio API engine with state
  useEffect(() => {
    studyAudio.setMuted(muted);
  }, [muted]);

  const anyActive = !muted && Object.values(volumes).some((v) => v > 0);

  function handleSlider(id, rawVal) {
    const val = Number(rawVal);
    studyAudio.setVolume(id, val);
    onChangeVolume(id, val);
  }

  function handleQuickToggle(id) {
    const next = volumes[id] > 0 ? 0 : 0.45;
    studyAudio.setVolume(id, next);
    onChangeVolume(id, next);
  }

  return (
    <section
      aria-label="Focus Soundscape"
      className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className={`h-4 w-4 ${anyActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Focus Soundscape</h2>
        </div>

        <button
          id="btn-sound-mute"
          type="button"
          onClick={onToggleMute}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
            muted
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          <span>{muted ? 'Đã tắt' : 'Bật âm'}</span>
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {CHANNELS.map((ch) => {
          const Icon = ch.icon;
          const vol = volumes[ch.id] ?? 0;
          const isOn = !muted && vol > 0;
          return (
            <div key={ch.id} className="flex items-center gap-3">
              <button
                id={`btn-sound-${ch.id}`}
                type="button"
                onClick={() => handleQuickToggle(ch.id)}
                title={`Bật/tắt ${ch.label}`}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                  isOn
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-950/70 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-200">{ch.label}</span>
                  <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                    {Math.round(vol * 100)}%
                  </span>
                </div>
                <input
                  id={`slider-sound-${ch.id}`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={vol}
                  onChange={(e) => handleSlider(ch.id, e.target.value)}
                  aria-label={`Âm lượng ${ch.label}`}
                  className="sound-slider mt-1.5 w-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
