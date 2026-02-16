import type { JSX } from 'react';
import type { Link } from '../../types/link.ts';
import { LinkCard } from './LinkCard.tsx';

export function LinkGrid({ links }: { readonly links: readonly Link[] }): JSX.Element {
  if (links.length === 0) {
    return (
      <p className="text-center text-sm text-pav-grey/60">
        No links available yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} />
      ))}
    </div>
  );
}
