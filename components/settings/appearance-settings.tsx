'use client';

import { CheckIcon, MoonIcon, SunIcon } from 'lucide-react';

import { useColorTheme } from '@/components/shell/color-theme-provider';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/shell/theme';
import { cn } from '@/lib/utils';

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { presetId, setPresetId, presets } = useColorTheme();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Appearance for the fractals playground shell.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-base font-medium">Mode</h2>
          <p className="text-sm text-muted-foreground">Light or dark interface.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
          >
            <SunIcon className="size-4" />
            Light
          </Button>
          <Button
            type="button"
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
          >
            <MoonIcon className="size-4" />
            Dark
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-base font-medium">Color theme</h2>
          <p className="text-sm text-muted-foreground">
            Presets from{' '}
            <a
              href="https://tweakcn.com"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              tweakcn
            </a>
            . Neutral restores the original playground palette.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {presets.map((preset) => {
            const active = preset.id === presetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setPresetId(preset.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border-strong p-3 text-left transition-colors hover:bg-muted/50',
                  active && 'border-primary ring-1 ring-primary/30',
                )}
              >
                <span
                  className="size-9 shrink-0 rounded-full border border-border-strong"
                  style={{ backgroundColor: preset.swatch }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{preset.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {preset.id === 'neutral'
                      ? 'Original playground tokens'
                      : preset.id === 'notebook'
                        ? 'Default theme'
                        : 'tweakcn preset'}
                  </span>
                </span>
                {active ? <CheckIcon className="size-4 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
