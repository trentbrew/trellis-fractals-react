/** Column schema lives in view config (shell), not on the entity type. */
export type ColumnEditor = 'text' | 'select' | 'checkbox' | 'none';

export type ColumnDef<E> = {
  key: keyof E & string;
  label: string;
  width?: string;
  editor?: ColumnEditor;
};
