import Link from 'next/link';
import { PROJECTION_NAV } from '@/lib/shell/demo-nav';

export default function ProjectionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Projections lab</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Derived views over fixture entities — structurally diverse, semantically
          meaningless. Use this rail to stress resolver paths (lanes, spans, overlaps)
          without conflating projections with collection content.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Requires <code className="rounded bg-muted px-1 py-0.5">just db-serve</code> and{' '}
          <code className="rounded bg-muted px-1 py-0.5">just seed-projections</code>.
        </p>
      </div>
      <ul className="space-y-1.5">
        {PROJECTION_NAV.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
