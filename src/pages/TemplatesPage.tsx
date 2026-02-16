import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';
import { TemplateCard } from '../components/templates/TemplateCard.tsx';
import { useTemplates } from '../hooks/useTemplates.ts';
import type { TemplateType } from '../types/template.ts';

const FILTERS: { readonly value: TemplateType | 'all'; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export function TemplatesPage(): JSX.Element {
  const [filter, setFilter] = useState<TemplateType | 'all'>('all');
  const apiFilter = filter === 'all' ? undefined : filter;
  const { templates, isLoading } = useTemplates(apiFilter);

  const sorted = useMemo(
    () => [...templates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [templates],
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl animate-fade-up">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-pav-blue">Shared Templates</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Reusable email and WhatsApp message templates for the team.
            </p>
          </div>
          <Link
            to="/templates/new"
            className="state-layer shrink-0 rounded-md bg-pav-blue px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-pav-blue/90"
          >
            New Template
          </Link>
        </div>

        {/* Filter pills */}
        <div className="mt-6 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setFilter(f.value); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium motion-standard ${
                filter === f.value
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-pav-cream text-on-surface hover:bg-pav-tan/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-36 skeleton-shimmer rounded-xl"
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="mt-12 text-center text-sm text-outline">
            No templates yet. Create your first template to get started.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
