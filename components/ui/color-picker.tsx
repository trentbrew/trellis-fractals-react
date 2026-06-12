'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { PipetteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  formatRgbString,
  hexToHsl,
  hslToHex,
  normalizeHexColor,
  parseHexColor,
  type HslColor,
} from '@/lib/color-utils';
import { cn } from '@/lib/utils';

type ColorFormat = 'hex' | 'rgb';

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  presets?: readonly string[];
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function usePointerDrag(
  onMove: (clientX: number, clientY: number) => void,
  onEnd?: () => void,
) {
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const move = (moveEvent: PointerEvent) => {
        onMove(moveEvent.clientX, moveEvent.clientY);
      };

      const up = () => {
        target.releasePointerCapture(event.pointerId);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        onEnd?.();
      };

      onMove(event.clientX, event.clientY);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [onEnd, onMove],
  );

  return handlePointerDown;
}

function ColorPickerCanvas({
  hsl,
  onChange,
}: {
  hsl: HslColor;
  onChange: (next: HslColor) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const area = areaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      onChange({
        h: hsl.h,
        s: Math.round(x * 100),
        l: Math.round((1 - y) * 100),
      });
    },
    [hsl.h, onChange],
  );

  const handlePointerDown = usePointerDrag(updateFromPointer);

  const pointerStyle = {
    left: `${hsl.s}%`,
    top: `${100 - hsl.l}%`,
  };

  return (
    <div
      ref={areaRef}
      className="relative h-36 w-full cursor-crosshair touch-none rounded-md border border-border"
      style={{ backgroundColor: `hsl(${hsl.h} 100% 50%)` }}
      onPointerDown={handlePointerDown}
      data-testid="color-picker-canvas"
    >
      <div className="absolute inset-0 rounded-[inherit] bg-linear-to-r from-white to-transparent" />
      <div className="absolute inset-0 rounded-[inherit] bg-linear-to-t from-black to-transparent" />
      <div
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ring-1 ring-black/20"
        style={{
          ...pointerStyle,
          backgroundColor: hslToHex(hsl),
        }}
      />
    </div>
  );
}

function ColorPickerHueSlider({
  hue,
  onChange,
}: {
  hue: number;
  onChange: (hue: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      onChange(Math.round(x * 360));
    },
    [onChange],
  );

  const handlePointerDown = usePointerDrag((clientX) => updateFromPointer(clientX));

  return (
    <div
      ref={trackRef}
      className="relative h-3 w-full cursor-pointer touch-none rounded-full border border-border"
      style={{
        background:
          'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
      }}
      onPointerDown={handlePointerDown}
      data-testid="color-picker-hue"
    >
      <div
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ring-1 ring-black/20"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: `hsl(${hue} 100% 50%)`,
        }}
      />
    </div>
  );
}

function ColorPickerFormatInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(format === 'hex' ? value : formatRgbString(value));
  }, [format, value]);

  function commitDraft() {
    if (format === 'hex') {
      const parsed = parseHexColor(draft);
      if (parsed) onChange(parsed);
      return;
    }

    const parts = draft.split(',').map((part) => Number.parseInt(part.trim(), 10));
    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      const [r, g, b] = parts;
      if ([r, g, b].every((part) => part >= 0 && part <= 255)) {
        onChange(
          `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`,
        );
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(['hex', 'rgb'] as const).map((option) => (
          <Button
            key={option}
            type="button"
            size="xs"
            variant={format === option ? 'secondary' : 'ghost'}
            onClick={() => setFormat(option)}
          >
            {option.toUpperCase()}
          </Button>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commitDraft();
        }}
        aria-label={format === 'hex' ? 'Hex color' : 'RGB color'}
        data-testid={`color-picker-${format}-input`}
      />
    </div>
  );
}

function ColorPickerEyedropper({ onPick }: { onPick: (color: string) => void }) {
  const supported = typeof window !== 'undefined' && 'EyeDropper' in window;

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="Pick color from screen"
      data-testid="color-picker-eyedropper"
      onClick={async () => {
        try {
          const EyeDropperCtor = (
            window as Window & {
              EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
            }
          ).EyeDropper;
          if (!EyeDropperCtor) return;
          const dropper = new EyeDropperCtor();
          const result = await dropper.open();
          onPick(normalizeHexColor(result.sRGBHex));
        } catch {
          // User cancelled eyedropper.
        }
      }}
    >
      <PipetteIcon />
    </Button>
  );
}

function ColorPickerPresets({
  value,
  presets,
  onSelect,
}: {
  value: string;
  presets: readonly string[];
  onSelect: (color: string) => void;
}) {
  if (presets.length === 0) return null;

  return (
    <div className="grid grid-cols-8 gap-1.5" data-testid="color-picker-presets">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          className={cn(
            'size-6 rounded-full border border-border transition-transform hover:scale-110',
            value.toLowerCase() === preset.toLowerCase() &&
              'ring-2 ring-ring ring-offset-1 ring-offset-background',
          )}
          style={{ backgroundColor: preset }}
          aria-label={`Preset color ${preset}`}
          onClick={() => onSelect(preset)}
        />
      ))}
    </div>
  );
}

export function ColorPicker({ value, onChange, presets = [], className }: ColorPickerProps) {
  const normalized = normalizeHexColor(value);
  const hsl = useMemo(() => hexToHsl(normalized), [normalized]);

  const updateHsl = useCallback(
    (next: HslColor) => {
      onChange(hslToHex(next));
    },
    [onChange],
  );

  return (
    <div className={cn('space-y-3', className)} data-testid="color-picker">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-3">
          <ColorPickerCanvas hsl={hsl} onChange={updateHsl} />
          <ColorPickerHueSlider hue={hsl.h} onChange={(h) => updateHsl({ ...hsl, h })} />
        </div>
        <ColorPickerEyedropper onPick={onChange} />
      </div>

      <ColorPickerFormatInput value={normalized} onChange={onChange} />

      {presets.length > 0 ? (
        <>
          <Separator />
          <ColorPickerPresets value={normalized} presets={presets} onSelect={onChange} />
        </>
      ) : null}
    </div>
  );
}
