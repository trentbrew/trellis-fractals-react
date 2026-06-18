'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SpawnType, sortSpawns, type Spawn } from '@/lib/schemas/spawn';
import { initialsForName } from '@/lib/presence/identity';
import { usePresenceIdentity } from '@/lib/presence/use-presence-identity';
import { useSessionRoom } from '@/lib/shell/session-room';
import { useCollection } from '@/lib/trellis/use-collection';
import { cn } from '@/lib/utils';

/** Words that change the rules of the field instead of just spawning a noun. */
const RULES = ['gravity', 'blackhole', 'freeze'] as const;
type Rule = (typeof RULES)[number];
function isRule(word: string): word is Rule {
  return (RULES as readonly string[]).includes(word);
}

type Body = { x: number; y: number; vx: number; vy: number; ax: number; ay: number };

const LEFT = 0.04;
const RIGHT = 0.96;
const CEIL = 0.09;
const FLOOR = 0.9;

function SpawnToken({
  spawn,
  refCb,
  onPop,
}: {
  spawn: Spawn;
  refCb: (el: HTMLButtonElement | null) => void;
  onPop: () => void;
}) {
  const rule = isRule(spawn.word);
  return (
    <button
      ref={refCb}
      type="button"
      onClick={onPop}
      title={`${spawn.word} — by ${spawn.owner} · click to pop`}
      className="group absolute left-0 top-0 animate-in fade-in zoom-in-50 cursor-pointer select-none outline-none duration-300 will-change-transform"
    >
      <span className="relative flex items-center justify-center">
        <span
          className={cn(
            'absolute inset-0 -z-10 rounded-full blur-xl transition-opacity group-hover:opacity-90',
            rule && 'animate-pulse',
          )}
          style={{ backgroundColor: `hsl(${spawn.hue} 90% 60% / ${rule ? 0.6 : 0.42})` }}
        />
        <span
          className={cn(
            'whitespace-nowrap rounded-full border backdrop-blur-sm transition-transform group-hover:scale-105 group-active:scale-90',
            rule
              ? 'px-4 py-2 text-sm font-bold uppercase tracking-widest'
              : 'px-4 py-2 text-sm font-semibold lowercase tracking-tight',
          )}
          style={{
            borderColor: `hsl(${spawn.hue} 90% 70% / ${rule ? 0.9 : 0.6})`,
            backgroundColor: `hsl(${spawn.hue} 80% 12% / 0.72)`,
            color: `hsl(${spawn.hue} 95% 82%)`,
            boxShadow: `0 0 ${rule ? 36 : 24}px hsl(${spawn.hue} 90% 55% / ${rule ? 0.55 : 0.35})`,
          }}
        >
          {spawn.word}
        </span>
        {rule ? (
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-semibold uppercase tracking-widest text-white/40">
            rule
          </span>
        ) : null}
        <span
          className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-black/40"
          style={{ backgroundColor: spawn.color }}
        >
          {initialsForName(spawn.owner)[0] ?? '?'}
        </span>
      </span>
    </button>
  );
}

function Field({ spawns, onPop }: { spawns: Spawn[]; onPop: (id: string) => void }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const size = useRef({ w: 1, h: 1 });
  const bodies = useRef(new Map<string, Body>());
  const els = useRef(new Map<string, HTMLButtonElement>());
  const spawnsRef = useRef<Spawn[]>(spawns);
  spawnsRef.current = spawns;

  // Reconcile sim bodies with the synced entity set (add new, drop popped).
  useEffect(() => {
    const live = new Set(spawns.map((s) => s.id));
    for (const id of bodies.current.keys()) {
      if (!live.has(id)) bodies.current.delete(id);
    }
    for (const s of spawns) {
      if (bodies.current.has(s.id)) continue;
      bodies.current.set(s.id, {
        x: s.x,
        y: s.y,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        ax: s.x,
        ay: s.y,
      });
    }
  }, [spawns]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const measure = () => {
      size.current = { w: el.clientWidth, h: el.clientHeight };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const list = spawnsRef.current;
      const words = new Set(list.map((s) => s.word));
      const gravity = words.has('gravity');
      const freeze = words.has('freeze');
      const holes = list
        .filter((s) => s.word === 'blackhole')
        .map((s) => bodies.current.get(s.id))
        .filter((b): b is Body => Boolean(b));
      const floor = gravity ? FLOOR : 0.9;

      for (const s of list) {
        const b = bodies.current.get(s.id);
        if (!b) continue;
        const cmd = isRule(s.word);

        if (freeze) {
          b.vx *= 0.8;
          b.vy *= 0.8;
        } else if (cmd) {
          // command orbs hold position so they read as stable, named rules
          b.vx += (b.ax - b.x) * 3 * dt;
          b.vy += (b.ay - b.y) * 3 * dt;
        } else {
          if (gravity) b.vy += 1.1 * dt;
          for (const h of holes) {
            const dx = h.x - b.x;
            const dy = h.y - b.y;
            const d = Math.hypot(dx, dy) + 0.05;
            const f = (0.7 / d) * dt;
            b.vx += (dx / d) * f;
            b.vy += (dy / d) * f;
          }
          if (!gravity && holes.length === 0) {
            // organic wander — weak pull to spawn anchor + jitter
            b.vx += (b.ax - b.x) * 0.6 * dt + (Math.random() - 0.5) * 0.3 * dt;
            b.vy += (b.ay - b.y) * 0.6 * dt + (Math.random() - 0.5) * 0.3 * dt;
          }
        }

        b.vx *= 0.99;
        b.vy *= 0.99;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x < LEFT) ((b.x = LEFT), (b.vx = -b.vx * 0.55));
        if (b.x > RIGHT) ((b.x = RIGHT), (b.vx = -b.vx * 0.55));
        if (b.y < CEIL) ((b.y = CEIL), (b.vy = -b.vy * 0.55));
        if (b.y > floor) ((b.y = floor), (b.vy = -b.vy * 0.55));

        const node = els.current.get(s.id);
        if (node) {
          node.style.transform = `translate3d(${b.x * size.current.w}px, ${b.y * size.current.h}px, 0) translate(-50%, -50%)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={fieldRef} className="absolute inset-0 z-10">
      {spawns.map((s) => (
        <SpawnToken
          key={s.id}
          spawn={s}
          refCb={(el) => {
            if (el) els.current.set(s.id, el);
            else els.current.delete(s.id);
          }}
          onPop={() => onPop(s.id)}
        />
      ))}
    </div>
  );
}

export function Arena() {
  const room = useSessionRoom() ?? 'lobby';
  const identity = usePresenceIdentity();
  const { rows, mut, loading, error } = useCollection(SpawnType, {
    where: { room },
  });
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const spawns = useMemo(() => sortSpawns(rows), [rows]);

  const spawn = useCallback(async () => {
    const word = draft.trim().split(/\s+/)[0]?.slice(0, 40).toLowerCase();
    if (!word || busy || !identity) return;
    setBusy(true);
    setDraft('');
    try {
      await mut.create({
        room,
        word,
        x: 0.1 + Math.random() * 0.8,
        y: 0.18 + Math.random() * 0.5,
        hue: isRule(word) ? 280 + Math.floor(Math.random() * 60) : Math.floor(Math.random() * 360),
        owner: identity.name,
        color: identity.color,
        createdAt: Date.now(),
      });
    } finally {
      setBusy(false);
    }
  }, [draft, busy, identity, mut, room]);

  const pop = useCallback(
    async (id: string) => {
      try {
        await mut.remove(id);
      } catch {
        /* already gone */
      }
    },
    [mut],
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#07070b] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#07070b_85%)]" />

      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold tracking-tight">arena</span>
          <span className="font-mono text-xs text-white/40">#{room}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="tabular-nums">{spawns.length} alive</span>
          {identity ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: identity.color }} />
              {identity.name}
            </span>
          ) : null}
        </div>
      </header>

      <Field spawns={spawns} onPop={pop} />

      {!loading && spawns.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-lg font-medium text-white/70">type a word to spawn it</p>
          <p className="text-sm text-white/35">
            open this URL in another tab — words appear in both, in realtime
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="absolute left-1/2 top-20 z-20 -translate-x-1/2 text-sm text-red-400">
          lost the room — is the backend up?
        </p>
      ) : null}

      <div className="absolute bottom-7 left-1/2 z-20 flex w-[min(92vw,440px)] -translate-x-1/2 flex-col items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void spawn();
          }}
          className="flex w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 backdrop-blur-md"
        >
          <span className="font-mono text-sm text-white/30">›</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            placeholder="type a word…"
            maxLength={40}
            autoFocus
            autoComplete="off"
            className="flex-1 bg-transparent text-sm lowercase tracking-tight text-white outline-none placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!draft.trim() || busy || !identity}
            className="rounded-full bg-white px-4 py-1 text-xs font-bold text-black transition disabled:opacity-30"
          >
            spawn
          </button>
        </form>
        <p className="text-[11px] text-white/30">
          words are nouns — but <span className="text-white/55">gravity</span>,{' '}
          <span className="text-white/55">blackhole</span>, and{' '}
          <span className="text-white/55">freeze</span> change the rules
        </p>
      </div>
    </div>
  );
}
