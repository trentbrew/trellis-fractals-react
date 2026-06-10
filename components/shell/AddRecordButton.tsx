import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AddRecordButton({
  label = 'New',
  onClick,
}: {
  label?: string;
  onClick?: () => void;
}) {
  return (
    <Button type="button" size="sm" className="gap-1.5 font-semibold" onClick={onClick}>
      <PlusIcon className="size-4" />
      {label}
    </Button>
  );
}
