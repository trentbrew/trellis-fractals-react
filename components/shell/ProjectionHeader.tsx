export function ProjectionHeader({
  title,
  children,
  trailing,
}: {
  title: string;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {trailing}
      </div>
      {children ? (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </header>
  );
}
