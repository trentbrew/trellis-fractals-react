export type FractalPageFixture = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  colorIndex: number;
  relatedIds: string[];
};

export const SAMPLE_PAGES: FractalPageFixture[] = [
  {
    id: 'page:overview',
    title: 'Overview',
    slug: 'overview',
    summary: 'Why the claim matters and what the operator needs to decide.',
    body:
      'This page anchors the investigation. At high vantage it should read like a real surface: title, summary, and enough body copy to justify a sidebar built from related routes in the page graph.',
    colorIndex: 2,
    relatedIds: ['page:evidence', 'page:decision'],
  },
  {
    id: 'page:evidence',
    title: 'Evidence',
    slug: 'evidence',
    summary: 'Return notes, bench logs, and support transcripts.',
    body:
      'Evidence pages collect heterogeneous sources. In a fractal page demo, low vantage shows this route as a node among siblings; high vantage renders the narrative with navigation derived from graph edges.',
    colorIndex: 6,
    relatedIds: ['page:overview', 'page:decision'],
  },
  {
    id: 'page:decision',
    title: 'Decision',
    slug: 'decision',
    summary: 'Operator verdict and the qualifiers that change the claim.',
    colorIndex: 9,
    body:
      'The decision page is the default focus: it sits between overview and follow-up, with the richest set of related links. Sidebar items should mirror relatedIds, not a hard-coded nav file.',
    relatedIds: ['page:overview', 'page:evidence', 'page:follow-up'],
  },
  {
    id: 'page:follow-up',
    title: 'Follow-up',
    slug: 'follow-up',
    summary: 'Actions, owners, and the next review window.',
    body:
      'Follow-up closes the loop. At graph vantage it is one more dot; at layout vantage it becomes a full page with the same graph-derived sidebar pattern as the other routes.',
    colorIndex: 11,
    relatedIds: ['page:decision'],
  },
];

export const DEFAULT_PAGE_ID = 'page:decision';

export function pageById(id: string): FractalPageFixture | undefined {
  return SAMPLE_PAGES.find((page) => page.id === id);
}

export function relatedPages(page: FractalPageFixture): FractalPageFixture[] {
  return page.relatedIds
    .map((id) => pageById(id))
    .filter((item): item is FractalPageFixture => item != null);
}
