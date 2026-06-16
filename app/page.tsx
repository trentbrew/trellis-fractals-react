import { redirect } from 'next/navigation';
import { DEMO_SURFACE_DEFAULT_HREF } from '@/lib/shell/demo-nav';
import { hrefWithSearchParams, type SearchParams } from '@/lib/shell/preserve-query';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(hrefWithSearchParams(DEMO_SURFACE_DEFAULT_HREF, await searchParams));
}
