import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WeekNavToolbar({
  label,
  onPrev,
  onNext,
  onToday,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button type="button" variant="outline" size="icon-sm" aria-label="Previous week" onClick={onPrev}>
        <ChevronLeftIcon className="size-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onToday}>
        Today
      </Button>
      <Button type="button" variant="outline" size="icon-sm" aria-label="Next week" onClick={onNext}>
        <ChevronRightIcon className="size-4" />
      </Button>
      <span className="ml-1 text-sm font-medium whitespace-nowrap">{label}</span>
    </div>
  );
}
