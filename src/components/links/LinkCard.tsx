import type { JSX } from 'react';
import type { Link } from '../../types/link.ts';

const SERVICE_ICONS: Record<string, string> = {
  'mail.google': 'mail',
  'gmail': 'mail',
  'drive.google': 'folder',
  'calendar.google': 'calendar_today',
  'docs.google': 'description',
  'sheets.google': 'table_chart',
  'slides.google': 'slideshow',
  'frontapp': 'forum',
  'front.com': 'forum',
  'slack': 'chat',
  'notion': 'edit_note',
  'figma': 'design_services',
  'github': 'code',
  'jira': 'bug_report',
  'trello': 'view_kanban',
  'zoom': 'videocam',
  'meet.google': 'videocam',
  'teams.microsoft': 'groups',
  'dropbox': 'cloud',
  'asana': 'task_alt',
  'linear': 'linear_scale',
  'hubspot': 'hub',
  'intercom': 'support_agent',
  'stripe': 'payments',
  'analytics.google': 'analytics',
  'gemini.google': 'auto_awesome',
  'voice.google': 'phone_in_talk',
  'petairvalet': 'flight_takeoff',
};

function getServiceIcon(url: string, title: string): string | null {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  for (const [key, value] of Object.entries(SERVICE_ICONS)) {
    if (urlLower.includes(key) || titleLower.includes(key)) {
      return value;
    }
  }
  return null;
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

export function LinkCard({ link }: { readonly link: Link }): JSX.Element {
  const materialIcon = getServiceIcon(link.url, link.title);
  const favicon = !materialIcon ? (link.iconUrl || getFaviconUrl(link.url)) : '';

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-xl border border-pav-tan/30 bg-white p-5 shadow-sm transition hover:border-pav-gold hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        {materialIcon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pav-gold/15">
            <span
              className="material-symbols-outlined text-pav-terra"
              style={{ fontSize: '20px' }}
              aria-hidden="true"
            >
              {materialIcon}
            </span>
          </div>
        ) : favicon ? (
          <img
            src={favicon}
            alt=""
            className="h-8 w-8 rounded"
            loading="lazy"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pav-gold/15 text-sm font-bold text-pav-terra">
            {link.title.charAt(0).toUpperCase()}
          </div>
        )}
        <h3 className="text-sm font-semibold text-pav-blue group-hover:text-pav-terra">
          {link.title}
        </h3>
      </div>
      {link.description && (
        <p className="text-sm text-pav-grey/60">{link.description}</p>
      )}
    </a>
  );
}
