import Link from 'next/link';
import { FRACTAL_ROUTES } from '@/lib/shell/fractals';

export default function FractalsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Fractals</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Four containment levels for the same idea: vantage changes the container
          you are inside, not just the chrome around it.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/fractals/ladder"
          className="rounded-md border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          Ladder reference
        </Link>
        <Link
          href="/fractals/embeds"
          className="rounded-md border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          Blog embed gallery
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FRACTAL_ROUTES.map((route, index) => (
          <Link
            key={route.id}
            href={route.href}
            className="grid min-h-36 content-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{route.label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{route.description}</p>
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground uppercase">
              {route.status === 'live' ? 'Live' : 'Stub'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
