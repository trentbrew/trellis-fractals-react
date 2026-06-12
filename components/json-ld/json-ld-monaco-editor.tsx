'use client';

import dynamic from 'next/dynamic';
import type { Monaco } from '@monaco-editor/react';
import { useTheme } from '@/lib/shell/theme';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const FRACTALS_LIGHT = 'fractals-light';
const FRACTALS_DARK = 'fractals-dark';

let themesRegistered = false;

function registerFractalsThemes(monaco: Monaco) {
  if (themesRegistered) return;
  themesRegistered = true;

  monaco.editor.defineTheme(FRACTALS_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'minimap.background': '#00000000',
    },
  });

  monaco.editor.defineTheme(FRACTALS_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#00000000',
      'editorGutter.background': '#00000000',
      'minimap.background': '#00000000',
    },
  });
}

const MONACO_OPTIONS = {
  readOnly: true,
  minimap: { enabled: true },
  fontSize: 13,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  automaticLayout: true,
};

export function JsonLdMonacoEditor({
  value,
  className,
  'data-testid': dataTestId,
}: {
  value: string;
  className?: string;
  'data-testid'?: string;
}) {
  const { theme } = useTheme();
  const monacoTheme = theme === 'dark' ? FRACTALS_DARK : FRACTALS_LIGHT;

  return (
    <div
      data-testid={dataTestId}
      className={cn('flex min-h-0 flex-1 flex-col', className)}
    >
      <div
        className={cn(
          'min-h-0 flex-1',
          '[&_.monaco-editor]:bg-transparent!',
          '[&_.monaco-editor-background]:bg-transparent!',
          '[&_.margin]:bg-transparent!',
        )}
      >
        <MonacoEditor
          height="100%"
          language="json"
          theme={monacoTheme}
          value={value}
          beforeMount={registerFractalsThemes}
          options={MONACO_OPTIONS}
        />
      </div>
    </div>
  );
}
