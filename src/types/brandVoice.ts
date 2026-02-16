export interface BrandRules {
  readonly rulesMarkdown: string;
  readonly servicesMarkdown: string;
  readonly updatedAt: string | null;
}

export type OutputStyle = 'email' | 'whatsapp' | 'document' | 'other';

export type BrandMode = 'rewrite' | 'draft';

export interface RewriteResult {
  readonly original: string;
  readonly rewritten: string;
}
