'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { SearchIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { TYPE_COLOR_PRESETS } from '@/lib/icons/type-colors';
import {
  estimateCategorySectionHeight,
  searchLucideIconsByCategory,
  type LucideIconCategoryGroup,
} from '@/lib/icons/lucide-icon-categories';
import { cn } from '@/lib/utils';
import {
  LUCIDE_ICON_NAMES,
  normalizeLucideIconName,
  type IconName,
} from '@/lib/icons/lucide-icons';

type LucideIconPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onSelect: (iconName: string) => void;
  color?: string;
  onColorChange?: (color: string) => void;
  colorPresets?: readonly string[];
};

type IconGridProps = {
  icons: readonly IconName[];
  selected: IconName;
  onSelect: (iconName: string) => void;
  onPick?: () => void;
};

function IconGrid({ icons, selected, onSelect, onPick }: IconGridProps) {
  return (
    <div className="grid grid-cols-8 gap-1 px-1 pb-1">
      {icons.map((name) => {
        const isSelected = selected === name;
        return (
          <button
            key={name}
            type="button"
            role="option"
            aria-selected={isSelected}
            title={name}
            className={cn(
              'flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted',
              isSelected && 'bg-primary/15 ring-1 ring-primary',
            )}
            onClick={() => {
              onSelect(name);
              onPick?.();
            }}
          >
            <DynamicIcon name={name} className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

type LazyCategorySectionProps = {
  group: LucideIconCategoryGroup;
  selected: IconName;
  onSelect: (iconName: string) => void;
  onPick?: () => void;
  scrollRoot: HTMLElement | null;
};

function LazyCategorySection({
  group,
  selected,
  onSelect,
  onPick,
  scrollRoot,
}: LazyCategorySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const placeholderHeight = estimateCategorySectionHeight(group.icons.length);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !scrollRoot) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
        }
      },
      {
        root: scrollRoot,
        rootMargin: '240px 0px',
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [scrollRoot, group.category]);

  return (
    <section
      ref={sectionRef}
      aria-label={group.category}
      style={{ minHeight: visible ? undefined : placeholderHeight }}
    >
      <h3 className="sticky top-0 z-10 border-b border-border bg-background px-2 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {group.category}
        <span className="ml-1.5 font-normal normal-case tracking-normal">
          ({group.icons.length})
        </span>
      </h3>

      {visible ? (
        <IconGrid
          icons={group.icons}
          selected={selected}
          onSelect={onSelect}
          onPick={onPick}
        />
      ) : (
        <div aria-hidden style={{ height: placeholderHeight - 28 }} />
      )}
    </section>
  );
}

type IconPickerPanelProps = {
  query: string;
  onQueryChange: (query: string) => void;
  filteredGroups: LucideIconCategoryGroup[];
  selected: IconName;
  onSelect: (iconName: string) => void;
  onPick?: () => void;
  footerText: string;
  scrollRoot: HTMLElement | null;
  onScrollRootChange: (node: HTMLElement | null) => void;
};

function IconPickerPanel({
  query,
  onQueryChange,
  filteredGroups,
  selected,
  onSelect,
  onPick,
  footerText,
  scrollRoot,
  onScrollRootChange,
}: IconPickerPanelProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          placeholder="Search icons…"
          className="h-9 pl-8"
          autoFocus
        />
      </div>

      <div
        ref={onScrollRootChange}
        className="max-h-72 overflow-y-auto rounded-md border border-border"
        role="listbox"
        aria-label="Lucide icons"
      >
        {filteredGroups.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No icons match your search.
          </p>
        ) : (
          filteredGroups.map((group) => (
            <LazyCategorySection
              key={group.category}
              group={group}
              selected={selected}
              onSelect={onSelect}
              onPick={onPick}
              scrollRoot={scrollRoot}
            />
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">{footerText}</p>
    </div>
  );
}

export function LucideIconPicker({
  open,
  onOpenChange,
  value,
  onSelect,
  color,
  onColorChange,
  colorPresets = TYPE_COLOR_PRESETS,
}: LucideIconPickerProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'icon' | 'color'>('icon');
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const selected = normalizeLucideIconName(value);
  const hasColorPicker = Boolean(color && onColorChange);

  const filteredGroups = useMemo(
    () => searchLucideIconsByCategory(query),
    [query],
  );

  const totalMatches = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.icons.length, 0),
    [filteredGroups],
  );

  const footerText = useMemo(() => {
    const q = query.trim();
    if (totalMatches === 0) return 'No icons match your search.';
    if (q) {
      return `${totalMatches} match${totalMatches === 1 ? '' : 'es'} in ${filteredGroups.length} categor${filteredGroups.length === 1 ? 'y' : 'ies'}`;
    }
    return `${LUCIDE_ICON_NAMES.length} icons in ${filteredGroups.length} categories`;
  }, [filteredGroups.length, query, totalMatches]);

  const handlePick = hasColorPicker ? undefined : () => onOpenChange(false);

  const iconPanel = (
    <IconPickerPanel
      query={query}
      onQueryChange={setQuery}
      filteredGroups={filteredGroups}
      selected={selected}
      onSelect={onSelect}
      onPick={handlePick}
      footerText={footerText}
      scrollRoot={scrollRoot}
      onScrollRootChange={setScrollRoot}
    />
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery('');
          setActiveTab('icon');
        }
      }}
    >
      <DialogContent className="gap-3 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{hasColorPicker ? 'Type appearance' : 'Choose icon'}</DialogTitle>
          <DialogDescription>
            {hasColorPicker
              ? 'Pick an icon and color for this type.'
              : `Pick from ${LUCIDE_ICON_NAMES.length} Lucide icons. Values are stored as kebab-case names (e.g. book-open).`}
          </DialogDescription>
        </DialogHeader>

        {hasColorPicker ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'icon' | 'color')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="icon">Icon</TabsTrigger>
              <TabsTrigger value="color">Color</TabsTrigger>
            </TabsList>
            <TabsContent value="icon" className="mt-3">
              {iconPanel}
            </TabsContent>
            <TabsContent value="color" className="mt-3">
              <ColorPicker
                value={color!}
                onChange={onColorChange!}
                presets={colorPresets}
              />
            </TabsContent>
          </Tabs>
        ) : (
          iconPanel
        )}
      </DialogContent>
    </Dialog>
  );
}
