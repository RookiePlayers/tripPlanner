import { formatDuration, intervalToDuration } from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatDDHHMM } from "../app/api/utils";

/**
 * React Countdown
 * -------------------------------------------------------------
 * A production-ready, drift-corrected countdown with pause/resume/reset,
 * render-prop customization, and accessible defaults.
 *
 * Usage:
 *   <Countdown to={"2025-12-31T23:59:59Z"} onComplete={() => ...} />
 *
 *   // Custom rendering
 *   <Countdown
 *     to={Date.now() + 48 * 60 * 60 * 1000}
 *     render={(t) => <span>{formatCompact(t)}</span>}
 *   />
 *
 * Key props (see type CountdownProps below):
 * - to: Date | string | number  // target moment (Date, ISO string, or ms epoch)
 * - interval?: number            // tick rate in ms (default 1000)
 * - autoStart?: boolean          // start automatically (default true)
 * - stopAtZero?: boolean         // stop when reaching zero (default true)
 * - onComplete?: () => void      // fires once at completion
 * - render?: (p: TimeParts & { totalMs: number }) => React.ReactNode
 * - className?: string           // wrapper class
 * - showControls?: boolean       // UI controls for demo/testing (default false)
 * - padZero?: boolean            // pad HH, MM, SS with leading zero (default true)
 * - hideDays?: boolean           // hide the days block (default false)
 *
 * Helpers exported:
 * - msToParts(ms): TimeParts
 * - formatParts(parts, opts?): string
 * - formatCompact(parts): string // e.g. "30h 40m" or "40m 34s"
 */

/** Utilities */
export type TimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export function msToParts(ms: number): TimeParts {
  const safe = Math.max(0, Math.floor(ms));
  const d = Math.floor(safe / 86_400_000); // 24*60*60*1000
  const dRem = safe % 86_400_000;
  const h = Math.floor(dRem / 3_600_000);
  const hRem = dRem % 3_600_000;
  const m = Math.floor(hRem / 60_000);
  const mRem = hRem % 60_000;
  const s = Math.floor(mRem / 1_000);
  const msRem = mRem % 1_000;
  return { days: d, hours: h, minutes: m, seconds: s, milliseconds: msRem };
}

export function pad(n: number, len = 2) {
  const str = String(Math.floor(Math.abs(n)));
  return str.length >= len ? str : "0".repeat(len - str.length) + str;
}

export function formatParts(
  parts: TimeParts,
  opts?: { padZero?: boolean; hideDays?: boolean; sep?: string }
) {
  const { padZero = true, hideDays = false, sep = ":" } = opts || {};
  const hTotal = parts.hours + (hideDays ? parts.days * 24 : 0);
  const HH = padZero ? pad(hTotal) : String(hTotal);
  const MM = padZero ? pad(parts.minutes) : String(parts.minutes);
  const SS = padZero ? pad(parts.seconds) : String(parts.seconds);
  return hideDays ? `${HH}${sep}${MM}${sep}${SS}` : `${parts.days}d ${HH}${sep}${MM}${sep}${SS}`;
}

export function formatCompact(parts: TimeParts) {
  // e.g., "30h 40m" or "40m 34s". Picks the top two most significant non-zero units.
  const items: Array<[label: string, value: number]> = [
    ["d", parts.days],
    ["h", parts.hours],
    ["m", parts.minutes],
    ["s", parts.seconds],
  ];
  const filtered = items.filter(([, v]) => v > 0);
  const use = (filtered.length ? filtered : [["s", 0]]).slice(0, 2);
  return use.map(([l, v]) => `${v}${l}`).join(" ");
}

/** Hook */
function toEpochMs(target: Date | string | number): number {
  if (target instanceof Date) return target.getTime();
  if (typeof target === "string") {
    // Allow ISO or date-like strings
    const t = new Date(target).getTime();
    if (Number.isNaN(t)) throw new Error(`Invalid date string: ${target}`);
    return t;
  }
  if (typeof target === "number") return target; // assume ms epoch
  throw new Error("Invalid target type");
}

export type UseCountdownOptions = {
  interval?: number; // ms, default 1000
  autoStart?: boolean; // default true
  stopAtZero?: boolean; // default true
  onComplete?: () => void;
};

export function useCountdown(
  to: Date | string | number,
  { interval = 1000, autoStart = true, stopAtZero = true, onComplete }: UseCountdownOptions = {}
) {
  const initialTarget = useMemo(() => toEpochMs(to), [to]);
  const [targetMs, setTargetMs] = useState<number>(initialTarget);
  const [remainingMs, setRemainingMs] = useState<number>(() => Math.max(0, targetMs - Date.now()));
  const [running, setRunning] = useState<boolean>(autoStart);
  const doneRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const tick = () => {
    const now = Date.now();
    const rem = targetMs - now;
    const atZero = stopAtZero ? Math.max(0, rem) : rem;
    setRemainingMs(atZero);

    if (stopAtZero && rem <= 0) {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete?.();
      }
      setRunning(false);
      clearTimer();
      return;
    }

    // Drift-corrected next tick: align to interval boundaries from the clock
    const delay = Math.max(16, interval - (now % interval));
    timerRef.current = window.setTimeout(tick, delay);
  };

  useEffect(() => {
    // If the `to` prop changes, reset target and state
    setTargetMs(initialTarget);
    setRemainingMs(Math.max(0, initialTarget - Date.now()));
    doneRef.current = false;
    if (autoStart) setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTarget]);

  useEffect(() => {
    clearTimer();
    if (!running) return;
    // Kick off next aligned tick immediately
    const now = Date.now();
    const delay = Math.max(16, (interval - (now % interval)) % interval || interval);
    timerRef.current = window.setTimeout(tick, delay);
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, interval, targetMs, stopAtZero]);

  const start = () => {
    if (!running) {
      setRunning(true);
    }
  };
  const pause = () => {
    setRunning(false);
    clearTimer();
  };
  const reset = (newTarget?: Date | string | number) => {
    const t = newTarget != null ? toEpochMs(newTarget) : initialTarget;
    setTargetMs(t);
    setRemainingMs(Math.max(0, t - Date.now()));
    doneRef.current = false;
    setRunning(autoStart);
  };

  const parts = useMemo(() => msToParts(remainingMs), [remainingMs]);

  return {
    remainingMs,
    parts,
    running,
    start,
    pause,
    reset,
    setTarget: (t: Date | string | number) => setTargetMs(toEpochMs(t)),
  } as const;
}

/** Component */
export type CountdownProps = {
  to: Date | string | number;
  interval?: number;
  autoStart?: boolean;
  stopAtZero?: boolean;
  onComplete?: () => void;
  render?: (t: TimeParts & { totalMs: number }) => React.ReactNode;
  className?: string;
  showControls?: boolean;
  padZero?: boolean;
  hideDays?: boolean;
  ariaLabel?: string;
};

export function CountdownCompact({
  to,
  interval,
  autoStart,
  stopAtZero,
  onComplete,
  render,
  className,
  showControls,
  padZero,
  hideDays,
  ariaLabel,
}: CountdownProps) {
    const { parts, remainingMs, running, start, pause, reset } = useCountdown(to, {
        interval,
        autoStart,
        stopAtZero,
        onComplete,
    });

  return formatDDHHMM(remainingMs);
}

export function Countdown({
  to,
  interval = 1000,
  autoStart = true,
  stopAtZero = true,
  onComplete,
  render,
  className,
  showControls = false,
  padZero = true,
  hideDays = false,
  ariaLabel = "Countdown timer",
}: CountdownProps) {
  const { parts, remainingMs, running, start, pause, reset } = useCountdown(to, {
    interval,
    autoStart,
    stopAtZero,
    onComplete,
  });

  const content = render
    ? render({ ...parts, totalMs: remainingMs })
    : (
        <DefaultFace parts={parts} padZero={padZero} hideDays={hideDays} />
      );

  return (
    <div className={"w-full max-w-xl mx-auto " + (className ?? "")}
         role="timer"
         aria-live="polite"
         aria-label={ariaLabel}
    >
      <div className="flex items-center justify-center gap-3 select-none">
        {content}
      </div>

      {showControls && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={start} className="px-3 py-2 rounded-2xl shadow border">Start</button>
          <button onClick={pause} className="px-3 py-2 rounded-2xl shadow border">Pause</button>
          <button onClick={() => reset()} className="px-3 py-2 rounded-2xl shadow border">Reset</button>
        </div>
      )}
    </div>
  );
}

function DefaultFace({ parts, padZero, hideDays }: { parts: TimeParts; padZero: boolean; hideDays: boolean }) {
  const d = parts.days;
  const h = padZero ? pad(parts.hours) : String(parts.hours);
  const m = padZero ? pad(parts.minutes) : String(parts.minutes);
  const s = padZero ? pad(parts.seconds) : String(parts.seconds);

  const Block = ({ label, value }: { label: string; value: string | number }) => (
    <div className="min-w-[72px] px-3 py-2 rounded-2xl shadow-sm bg-white/60 dark:bg-white/10 border text-center">
      <div className="text-3xl font-semibold font-mono leading-none">{value}</div>
      <div className="text-xs opacity-70 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );

  return (
    <>
      {!hideDays && <Block label="Days" value={d} />}
      <Block label="Hours" value={hideDays ? String(Number(h) + d * 24) : h} />
      <Block label="Minutes" value={m} />
      <Block label="Seconds" value={s} />
    </>
  );
}

/** Demo page (default export) */
export default function Demo() {
  const now = Date.now();
  const tenMinutesFromNow = now + 10 * 60 * 1000;
  const newYearUTC = new Date(`${new Date().getUTCFullYear()}-12-31T23:59:59Z`).getTime();

  return (
    <div className="p-6 md:p-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">React Countdown</h1>
        <p className="opacity-70 max-w-prose">A reusable, drift-corrected countdown component with a handy hook, sensible defaults, and render-prop customization.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">🍃 Basic</h2>
        <Countdown to={tenMinutesFromNow} showControls />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">🎨 Custom Render</h2>
        <Countdown
          to={newYearUTC}
          hideDays
          render={(t) => (
            <div className="text-5xl font-mono">
              {formatParts(t, { hideDays: true, padZero: true, sep: ":" })}
            </div>
          )}
        />
        <p className="text-sm opacity-70">Example uses <code>render</code> to fully customize the markup.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">🧪 Compact Format Helper</h2>
        <CompactPreview />
      </section>
    </div>
  );
}

function CompactPreview() {
  const [ms, setMs] = useState(30 * 60 * 60 * 1000 + 40 * 60 * 1000); // 30h 40m
  const t = msToParts(ms);
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={0}
        max={3 * 24 * 60 * 60 * 1000}
        step={1_000}
        value={ms}
        onChange={(e) => setMs(Number(e.target.value))}
        className="w-64"
        aria-label="Adjust milliseconds"
      />
      <div className="font-mono">{formatCompact(t)}</div>
    </div>
  );
}
