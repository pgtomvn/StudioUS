import { sfx } from "../lib/sound";
import { actions, useAppState } from "../lib/store";
import type { SoundSettings } from "../types";
import { Icon, Modal } from "./ui";

function Slider(props: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onRelease?: () => void;
}) {
  const percent = Math.round(props.value * 100);
  return (
    <label className={`sound-row${props.disabled ? " is-off" : ""}`}>
      <span className="sound-label">{props.label}</span>
      <input
        type="range"
        className="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        disabled={props.disabled}
        style={{ "--fill": `${percent}%` } as React.CSSProperties}
        aria-valuetext={`${percent}%`}
        onChange={(event) => props.onChange(Number(event.target.value) / 100)}
        onPointerUp={props.onRelease}
        onKeyUp={props.onRelease}
      />
      <b className="sound-value">{percent}%</b>
    </label>
  );
}

function Toggle(props: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="sound-toggle">
      <span className="tick-label">
        <input
          type="checkbox"
          className="tick-input"
          checked={props.checked}
          onChange={(event) => props.onChange(event.target.checked)}
        />
        <span className="tick" aria-hidden="true">
          {props.checked ? "✓" : ""}
        </span>
      </span>
      <span>{props.label}</span>
    </label>
  );
}

export function SoundPanel({ onClose }: { onClose: () => void }) {
  const { settings } = useAppState();
  const sound = settings.sound;
  const set = (patch: Partial<SoundSettings>) => actions.setSound(patch);
  return (
    <Modal title="Cài đặt âm thanh" onClose={onClose} wide>
      <button
        className={`btn btn-block sound-master${sound.muted ? "" : " btn-primary"}`}
        aria-pressed={!sound.muted}
        data-sfx="none"
        onClick={() => {
          set({ muted: !sound.muted });
          // Bật lại thì phát một tiếng để người dùng biết đã có âm.
          if (sound.muted) setTimeout(() => sfx("pop"), 60);
        }}
      >
        <Icon name={sound.muted ? "mute" : "speaker"} size={1.5} />
        {sound.muted ? "Đang tắt toàn bộ âm thanh – bấm để bật" : "Âm thanh đang bật – bấm để tắt"}
      </button>

      <div className="sound-group">
        <Slider
          label="Âm lượng chung"
          value={sound.master}
          disabled={sound.muted}
          onChange={(master) => set({ master })}
          onRelease={() => sfx("coin")}
        />
        <Slider
          label="Hiệu ứng"
          value={sound.effects}
          disabled={sound.muted}
          onChange={(effects) => set({ effects })}
          onRelease={() => sfx("coin")}
        />
        <Toggle
          label="Tiếng bấm nút, tick, chuyển trang, chạm linh vật"
          checked={sound.ui}
          onChange={(ui) => set({ ui })}
        />
      </div>

      <div className="sound-group">
        <Toggle
          label="Nhạc nền 8-bit"
          checked={sound.musicOn}
          onChange={(musicOn) => set({ musicOn })}
        />
        <Slider
          label="Âm lượng nhạc"
          value={sound.music}
          disabled={sound.muted || !sound.musicOn}
          onChange={(music) => set({ music })}
        />
      </div>
    </Modal>
  );
}

/** Nút mở cài đặt âm thanh: có chữ ở thanh bên, chỉ có icon ở thanh trên điện thoại. */
export function SoundButton({ compact, onOpen }: { compact?: boolean; onOpen: () => void }) {
  const { settings } = useAppState();
  const muted = settings.sound.muted;
  return (
    <button
      className={`btn btn-sm sound-btn${compact ? " icon-btn" : ""}`}
      onClick={onOpen}
      aria-label={compact ? "Cài đặt âm thanh" : undefined}
      title={muted ? "Âm thanh đang tắt" : "Cài đặt âm thanh"}
    >
      <Icon name={muted ? "mute" : "speaker"} size={1} />
      {!compact && "Âm thanh"}
      <span className="eq" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}
