'use client';

import { useCallback, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ContextAction = 'delete';

/**
 * Right-click context menu for entity rows. Returns `openAt` (call from a row's
 * `onContextMenu`) and the `menu` element to render once per board — replaces
 * `EntityContextMenu.svelte`'s imperative `openAt(event, id)` + bits-ui anchor.
 */
export function useEntityContextMenu(onAction: (action: ContextAction, entityId: string) => void) {
  const [target, setTarget] = useState<{ x: number; y: number; entityId: string } | null>(null);

  const openAt = useCallback((event: React.MouseEvent, entityId: string) => {
    event.preventDefault();
    setTarget({ x: event.clientX, y: event.clientY, entityId });
  }, []);

  const menu = (
    <DropdownMenu
      open={target != null}
      onOpenChange={(open) => {
        if (!open) setTarget(null);
      }}
    >
      <DropdownMenuTrigger
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none fixed h-px w-px opacity-0"
        style={{ left: target?.x ?? 0, top: target?.y ?? 0 }}
      />
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            if (target) onAction('delete', target.entityId);
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return { openAt, menu };
}
