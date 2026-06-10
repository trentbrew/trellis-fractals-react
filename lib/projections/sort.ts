/** Trellis entities include kernel `createdAt` on full reads. */
export type WithCreatedAt = { id: string; createdAt?: string };

/** Default browse order — newest records first. */
export function sortNewestFirst<E extends WithCreatedAt>(rows: E[]): E[] {
  return [...rows].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });
}
