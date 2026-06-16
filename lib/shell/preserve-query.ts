type SearchParams = Record<string, string | string[] | undefined>;

export function hrefWithSearchParams(
  href: string,
  searchParams: SearchParams | URLSearchParams,
): string {
  const query =
    searchParams instanceof URLSearchParams
      ? searchParams
      : (() => {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(searchParams)) {
            if (typeof value === 'string') params.set(key, value);
            else if (Array.isArray(value)) {
              for (const entry of value) params.append(key, entry);
            }
          }
          return params;
        })();
  const qs = query.toString();
  return qs ? `${href}?${qs}` : href;
}

export type { SearchParams };
