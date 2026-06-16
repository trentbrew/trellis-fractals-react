'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  formatRecordDateLabel,
  parseRecordDate,
  recordDateToStorage,
} from '@/lib/record-field-utils';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  value?: unknown;
  onChange: (value: string | undefined) => void;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  id?: string;
  compact?: boolean;
  'data-testid'?: string;
};

export function DatePicker({
  value,
  onChange,
  className,
  buttonClassName,
  placeholder = 'Pick a date',
  id,
  compact = false,
  'data-testid': testId,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseRecordDate(value);
  const label = formatRecordDateLabel(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        data-testid={testId}
        className={cn(
          'inline-flex min-w-0 items-center',
          compact
            ? 'h-full w-full justify-start rounded-none border-0 bg-transparent px-2 text-xs font-normal text-foreground hover:bg-muted data-[empty=true]:text-muted-foreground'
            : 'h-9 w-full justify-start rounded-md border border-input bg-background px-3 text-sm font-normal hover:bg-muted data-[empty=true]:text-muted-foreground',
          buttonClassName,
          className,
        )}
        data-empty={!selected}
      >
        <CalendarIcon className={cn(compact ? 'mr-1.5 size-3' : 'mr-2 size-4')} />
        {label || <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(recordDateToStorage(date));
            setOpen(false);
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          <button
            type="button"
            className="h-7 rounded-md px-2 text-xs hover:bg-muted"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="h-7 rounded-md px-2 text-xs hover:bg-muted"
            onClick={() => {
              onChange(format(new Date(), 'yyyy-MM-dd'));
              setOpen(false);
            }}
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
