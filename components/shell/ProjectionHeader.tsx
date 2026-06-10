export function ProjectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex w-full flex-col gap-3">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {children && <div className="flex w-full min-w-0 items-center gap-2">{children}</div>}
    </header>
  );
}
