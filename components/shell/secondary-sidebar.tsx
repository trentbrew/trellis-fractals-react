'use client';

import { useShell } from '@/lib/shell/shell-context';
import { CollectionsSecondary } from './collections-secondary';
import { FractalsSecondary } from './fractals-secondary';
import { ProjectionsSecondary } from './projections-secondary';

function StubSecondary({ title }: { title: string }) {
  return (
    <div className="p-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <p className="mt-2 text-xs text-muted-foreground">Coming soon.</p>
    </div>
  );
}

export function SecondarySidebar() {
  const { mode } = useShell();

  return (
    <aside className="flex h-full min-h-full w-56 shrink-0 flex-col self-stretch border-r border-border bg-shell-panel">
      {mode === 'collections' && <CollectionsSecondary />}
      {mode === 'fractals' && <FractalsSecondary />}
      {mode === 'projections' && <ProjectionsSecondary />}
      {mode === 'graph' && <StubSecondary title="Graph" />}
      {mode === 'issues' && <StubSecondary title="Issues" />}
    </aside>
  );
}
