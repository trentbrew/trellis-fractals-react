import {
  BracesIcon,
  CalendarIcon,
  GanttChartIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListIcon,
  TableIcon,
  type LucideIcon,
} from 'lucide-react';
import type { CollectionViewMode } from './collection-views';

export const VIEW_ICONS: Record<CollectionViewMode, LucideIcon> = {
  table: TableIcon,
  kanban: LayoutDashboardIcon,
  calendar: CalendarIcon,
  gantt: GanttChartIcon,
  list: ListIcon,
  'card-grid': LayoutGridIcon,
  dag: GitBranchIcon,
  'json-ld': BracesIcon,
};
