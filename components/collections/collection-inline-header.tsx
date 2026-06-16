'use client';

import { TypeAppearanceControls } from '@/components/icons/type-appearance-controls';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import { cn } from '@/lib/utils';

const DESCRIPTION_PLACEHOLDER = 'Add a description…';

type CollectionInlineHeaderProps = {
  title: string;
  description?: string;
  icon: string;
  color: string;
  onSaveTitle: (title: string) => void;
  onSaveDescription: (description: string) => void;
  onSaveAppearance: (updates: { icon?: string; color?: string }) => void;
  className?: string;
};

export function CollectionInlineHeader({
  title,
  description = '',
  icon,
  color,
  onSaveTitle,
  onSaveDescription,
  onSaveAppearance,
  className,
}: CollectionInlineHeaderProps) {
  const titleField = useFocusSafeField(title, onSaveTitle);
  const descriptionField = useFocusSafeField(description, onSaveDescription);

  return (
    <header className={cn('shrink-0 space-y-2', className)}>
      <div className="flex items-center gap-2">
        <TypeAppearanceControls
          icon={icon}
          color={color}
          label={title}
          size="lg"
          onIconChange={(next) => void onSaveAppearance({ icon: next })}
          onColorChange={(next) => void onSaveAppearance({ color: next })}
          iconButtonTestId="collection-edit-icon"
        />
        <input
          type="text"
          value={titleField.value}
          onChange={titleField.onChange}
          onFocus={titleField.onFocus}
          onBlur={titleField.onBlur}
          onKeyDown={titleField.onKeyDown}
          aria-label="Collection title"
          placeholder="Untitled collection"
          data-testid="collection-inline-title"
          className="min-w-0 flex-1 bg-transparent text-xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/70 focus-visible:underline focus-visible:decoration-border focus-visible:underline-offset-4 md:text-2xl"
        />
      </div>
      <textarea
        value={descriptionField.value}
        onChange={descriptionField.onChange}
        onFocus={descriptionField.onFocus}
        onBlur={descriptionField.onBlur}
        aria-label="Collection description"
        placeholder={DESCRIPTION_PLACEHOLDER}
        rows={1}
        data-testid="collection-inline-description"
        className={cn(
          'w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:underline focus-visible:decoration-border focus-visible:underline-offset-4',
          !descriptionField.value.trim() && 'text-muted-foreground/70',
        )}
      />
    </header>
  );
}
