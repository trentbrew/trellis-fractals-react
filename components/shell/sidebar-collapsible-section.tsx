'use client';

import type { ReactNode } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export type SidebarCollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  testId?: string;
};

export function SidebarCollapsibleSection({
  title,
  children,
  className,
  defaultOpen = true,
  open,
  onOpenChange,
  testId,
}: SidebarCollapsibleSectionProps) {
  const isControlled = open !== undefined;

  return (
    <Collapsible
      {...(isControlled ? { open, onOpenChange } : { defaultOpen })}
      className={className}
    >
      <CollapsibleTrigger
        className="group flex w-full items-center gap-1.5 rounded-md py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        data-testid={testId}
      >
        <ChevronDownIcon
          className="size-3 shrink-0 text-muted-foreground transition-transform duration-200 -rotate-90 group-data-panel-open:rotate-0"
          aria-hidden
        />
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
