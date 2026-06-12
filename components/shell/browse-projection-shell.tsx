import { cn } from '@/lib/utils';

/** Shared width and flex column for collection browse / projection surfaces. */
export function BrowseProjectionShell({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex w-full flex-col', className)}
      {...props}
    />
  );
}
